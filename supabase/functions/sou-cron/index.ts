/**
 * SOU Cron Edge Function
 * 
 * Generates State of the Union (SOU) report as CSV and sends to webhook.
 * Scheduled to run every Friday at 9:00 AM Oklahoma time (Central Time).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Webhook URL for SOU reports
const SOU_WEBHOOK_URL = 'https://primary-production-dc95.up.railway.app/webhook/SOU-form';

// Base mapping for SOU status calculation
type BaseName = '1st Base' | '2nd Base' | '3rd Base';

interface BaseMapping {
  stage: string;
  statuses: readonly string[];
  isComplete: (status: string) => boolean;
}

const BASE_MAPPING: Record<BaseName, BaseMapping> = {
  '1st Base': {
    stage: 'Intake',
    statuses: ['New', 'Incomplete'] as const,
    isComplete: (status: string) => status === 'New'
  },
  '2nd Base': {
    stage: 'Processing',
    statuses: ['Treating', 'Awaiting B&R', 'Awaiting Subro'] as const,
    isComplete: (status: string) => status === 'Awaiting Subro'
  },
  '3rd Base': {
    stage: 'Demand',
    statuses: [
      'Ready for Demand',
      'Demand Sent',
      'Counter Received',
      'Counter Sent',
      'Reduction Sent',
      'Proposed Settlement Statement Sent',
      'Release Sent',
      'Payment Instructions Sent'
    ] as const,
    isComplete: (status: string) => status === 'Payment Instructions Sent'
  }
};

/**
 * Get base completion status for a case
 */
function getBaseStatus(stage: string, status: string, baseName: BaseName): 'Complete' | string {
  const base = BASE_MAPPING[baseName];
  
  if (base.stage !== stage) {
    const baseOrder: BaseName[] = ['1st Base', '2nd Base', '3rd Base'];
    const currentBaseIndex = baseOrder.findIndex(b => BASE_MAPPING[b].stage === stage);
    const targetBaseIndex = baseOrder.indexOf(baseName);
    
    if (currentBaseIndex > targetBaseIndex) {
      return 'Complete';
    }
    return 'Not Started';
  }
  
  if (base.isComplete(status)) {
    return 'Complete';
  }
  
  return status;
}

/**
 * Get all three base statuses for a case
 */
function getAllBaseStatuses(stage: string, status: string): {
  firstBase: string;
  secondBase: string;
  thirdBase: string;
} {
  return {
    firstBase: getBaseStatus(stage, status, '1st Base'),
    secondBase: getBaseStatus(stage, status, '2nd Base'),
    thirdBase: getBaseStatus(stage, status, '3rd Base')
  };
}

/**
 * Fetch all active (non-archived) cases with their clients
 */
async function fetchActiveCases(): Promise<any[]> {
  let { data, error } = await supabase
    .from('casefiles')
    .select(`
      id,
      stage,
      status,
      date_of_loss,
      clients (
        id,
        first_name,
        last_name,
        client_number,
        client_order,
        is_driver
      )
    `)
    .eq('is_archived', false)
    .order('id', { ascending: true });

  // Fallback if is_archived column doesn't exist
  if (error && (error.message?.includes('column') || error.code === '42703')) {
    console.warn('is_archived column not found, loading all cases');
    const retry = await supabase
      .from('casefiles')
      .select(`
        id,
        stage,
        status,
        date_of_loss,
        clients (
          id,
          first_name,
          last_name,
          client_number,
          client_order,
          is_driver
        )
      `)
      .order('id', { ascending: true });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('Error fetching active cases:', error);
    throw new Error(`Failed to fetch cases: ${error.message}`);
  }

  return data || [];
}

/**
 * Fetch all case notes for a specific case
 */
async function fetchCaseNotes(casefileId: number): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('case_notes')
      .select('note_text')
      .eq('casefile_id', casefileId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('case_notes table does not exist yet');
        return [];
      }
      console.error('Error fetching case notes:', error);
      return [];
    }

    return (data || []).map(note => note.note_text);
  } catch (error) {
    console.error('Exception fetching case notes:', error);
    return [];
  }
}

/**
 * Format date of loss for display (MM/DD/YY format)
 */
function formatDateOfLoss(dateString: string | null): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  } catch {
    return '';
  }
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  clientOrder: number;
  isDriver: boolean;
}

/**
 * Generate case name from clients
 */
function generateCaseName(clients: Client[]): string {
  if (!clients || clients.length === 0) return 'Unknown';
  
  // Sort by client order
  const sorted = [...clients].sort((a, b) => a.clientOrder - b.clientOrder);
  
  if (sorted.length === 1) {
    return `${sorted[0].firstName} ${sorted[0].lastName}`;
  }
  
  // Multiple clients: use first client's name + "et al."
  return `${sorted[0].firstName} ${sorted[0].lastName} et al.`;
}

interface SOUCaseData {
  caseId: number;
  clientName: string;
  firstBase: string;
  secondBase: string;
  thirdBase: string;
  notes: string;
}

/**
 * Prepare SOU data for all active cases
 */
async function prepareSOUData(): Promise<SOUCaseData[]> {
  const cases = await fetchActiveCases();
  const souData: SOUCaseData[] = [];

  for (const casefile of cases) {
    const baseStatuses = getAllBaseStatuses(casefile.stage, casefile.status);
    const notes = await fetchCaseNotes(casefile.id);

    // Format client names
    const rawClients = Array.isArray(casefile.clients) 
      ? casefile.clients 
      : (casefile.clients ? [casefile.clients] : []);
    
    const clients: Client[] = rawClients.map((c: any) => ({
      id: c.id,
      firstName: c.first_name || '',
      lastName: c.last_name || '',
      clientOrder: c.client_order || c.client_number || 0,
      isDriver: c.is_driver || false
    }));
    
    const caseNameBase = generateCaseName(clients);
    const dateOfLoss = formatDateOfLoss(casefile.date_of_loss);
    const clientName = dateOfLoss ? `${caseNameBase} ${dateOfLoss}` : caseNameBase;

    souData.push({
      caseId: casefile.id,
      clientName: clientName,
      firstBase: baseStatuses.firstBase === 'Complete' ? 'Completed' : baseStatuses.firstBase,
      secondBase: baseStatuses.secondBase === 'Complete' ? 'Completed' : baseStatuses.secondBase,
      thirdBase: baseStatuses.thirdBase === 'Complete' ? 'Completed' : baseStatuses.thirdBase,
      notes: notes.length > 0 ? notes.join(' | ') : ''
    });
  }

  return souData;
}

/**
 * Escape CSV field value
 */
function escapeCSVField(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert SOU case data array to CSV string
 */
function jsonToCSV(data: SOUCaseData[]): string {
  if (!data || data.length === 0) {
    return 'Client,1st Base,2nd Base,3rd Base,Notes\n';
  }
  
  const headers = ['Client', '1st Base', '2nd Base', '3rd Base', 'Notes'];
  
  const rows = data.map(item => [
    escapeCSVField(item.clientName),
    escapeCSVField(item.firstBase),
    escapeCSVField(item.secondBase),
    escapeCSVField(item.thirdBase),
    escapeCSVField(item.notes)
  ]);
  
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ];
  
  return csvLines.join('\n');
}

/**
 * Convert CSV string to base64
 */
function csvToBase64(csvContent: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(csvContent);
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/**
 * Generate and send SOU report to webhook
 */
async function generateAndSendSOU(): Promise<{
  success: boolean;
  caseCount?: number;
  error?: string;
}> {
  try {
    console.log('📊 Starting scheduled SOU generation...');

    // Prepare SOU data
    const souData = await prepareSOUData();
    console.log(`✅ Prepared SOU data for ${souData.length} cases`);

    // Generate CSV
    const csvContent = jsonToCSV(souData);
    const csvBase64 = csvToBase64(csvContent);

    // Prepare payload
    const payload = {
      template_type: 'state_of_union',
      casefile_id: null,
      sou_data: souData,
      csv_base64: csvBase64,
      csv_content: csvContent,
      generation_date: new Date().toISOString(),
      case_count: souData.length,
      source: 'scheduled_cron'
    };

    console.log('📤 Sending SOU data to webhook:', SOU_WEBHOOK_URL);

    // Send to webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(SOU_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, */*'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Webhook error (${response.status}): ${errorText.substring(0, 200)}`);
    }

    console.log('✅ SOU data sent to webhook successfully');

    // Log to work_logs
    try {
      await supabase.from('work_logs').insert({
        casefile_id: null,
        description: `[Scheduled] State of the Union report generated for ${souData.length} cases`,
        timestamp: new Date().toISOString(),
        user_name: 'System (Cron)'
      });
    } catch (logError) {
      console.warn('Failed to create work log entry:', logError);
    }

    return {
      success: true,
      caseCount: souData.length
    };
  } catch (error) {
    console.error('❌ Error generating SOU:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('🕐 SOU Cron job triggered');

  const result = await generateAndSendSOU();

  const responseBody = {
    success: result.success,
    message: result.success 
      ? `SOU report generated and sent for ${result.caseCount} cases`
      : `Failed to generate SOU: ${result.error}`,
    caseCount: result.caseCount,
    timestamp: new Date().toISOString()
  };

  return new Response(JSON.stringify(responseBody), {
    status: result.success ? 200 : 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
