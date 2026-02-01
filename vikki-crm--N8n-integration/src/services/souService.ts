/**
 * State of the Union (SOU) Document Generation Service
 * 
 * Fetches all active cases, calculates base completion status,
 * gathers case notes, and generates SOU report (PDF + CSV)
 */

import { supabase } from '../utils/database';
import { getAllBaseStatuses } from '../utils/baseMapping';
import { jsonToCSV, csvToBase64, downloadCSV, SOUCaseData } from '../utils/csvExport';
import { generateCaseName, Client } from '../utils/calculations';

/**
 * Fetch all active (non-archived) cases with their clients
 */
async function fetchActiveCases(): Promise<any[]> {
  // Try with is_archived filter first, fallback if column doesn't exist
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

  // If error is about missing column, retry without the filter
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
      // If table doesn't exist yet, return empty array
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
  } catch (error) {
    return '';
  }
}

/**
 * Prepare SOU data for all active cases
 */
async function prepareSOUData(): Promise<SOUCaseData[]> {
  const cases = await fetchActiveCases();
  const souData: SOUCaseData[] = [];

  for (const casefile of cases) {
    // Get base statuses
    const baseStatuses = getAllBaseStatuses(casefile.stage, casefile.status);

    // Fetch case notes
    const notes = await fetchCaseNotes(casefile.id);

    // Format client names - ensure it's an array and convert to Client format
    const rawClients = Array.isArray(casefile.clients) ? casefile.clients : (casefile.clients ? [casefile.clients] : []);
    
    // Convert to Client[] format expected by generateCaseName
    const clients: Client[] = rawClients.map((c: any) => ({
      id: c.id,
      firstName: c.first_name || '',
      lastName: c.last_name || '',
      clientOrder: c.client_order || c.client_number || 0,
      isDriver: c.is_driver || false
    }));
    
    // Generate case name using the proper function
    const caseNameBase = generateCaseName(clients);
    
    // Add date of loss to case name (format: "Name MM/DD/YY")
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
 * Generate SOU report (PDF via webhook + CSV)
 */
export async function generateSOU(): Promise<{
  success: boolean;
  csvContent?: string;
  csvBase64?: string;
  pdfBase64?: string;
  error?: string;
  message?: string;
}> {
  try {
    console.log('📊 Starting SOU generation...');

    // Prepare SOU data
    const souData = await prepareSOUData();
    console.log(`✅ Prepared SOU data for ${souData.length} cases`);

    // Generate CSV
    const csvContent = jsonToCSV(souData);
    const csvBase64 = csvToBase64(csvContent);

    // Call SOU webhook for PDF and CSV generation
    const webhookUrl = 'https://primary-production-dc95.up.railway.app/webhook/SOU-form';
    
    // Prepare payload for webhook
    const payload = {
      template_type: 'state_of_union',
      casefile_id: null, // SOU is for all cases
      sou_data: souData,
      csv_base64: csvBase64,
      csv_content: csvContent, // Also send plain CSV content
      generation_date: new Date().toISOString(),
      case_count: souData.length
    };

    console.log('📤 Sending SOU data to webhook:', webhookUrl);
    console.log('📊 SOU data contains', souData.length, 'cases');
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    let response: Response;
    try {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/pdf, */*'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('❌ Network error calling webhook:', fetchError);
      
      // Handle specific error types
      if (fetchError.name === 'AbortError') {
        throw new Error('Webhook request timed out after 60 seconds. Please check your connection and try again.');
      } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
        throw new Error('Failed to connect to webhook. This could be due to:\n- Network connectivity issues\n- CORS restrictions\n- Webhook server is down\n\nPlease check your internet connection and verify the webhook URL is accessible.');
      } else if (fetchError.message?.includes('CORS') || fetchError.message?.includes('CORS')) {
        throw new Error('CORS error: The webhook server needs to allow requests from this origin. Please configure CORS on the webhook server.');
      } else {
        throw new Error(`Network error: ${fetchError.message || 'Unknown error'}. Please try again.`);
      }
    }

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Could not read error response';
      }
      console.error('❌ Webhook error:', errorText);
      throw new Error(`Webhook error (${response.status}): ${response.statusText}. ${errorText.substring(0, 200)}`);
    }

    // Parse response - webhook should return both PDF and CSV
    const contentType = response.headers.get('content-type');
    let pdfBase64: string | undefined;
    let returnedCsvBase64: string | undefined;
    let returnedCsvContent: string | undefined;

    if (contentType?.includes('application/json')) {
      const result = await response.json();
      pdfBase64 = result.pdf_base64 || result.pdfBase64 || result.pdf;
      returnedCsvBase64 = result.csv_base64 || result.csvBase64 || result.csv;
      returnedCsvContent = result.csv_content || result.csvContent;
      
      console.log('✅ Received response from webhook');
      console.log('📄 PDF present:', !!pdfBase64);
      console.log('📊 CSV present:', !!returnedCsvBase64 || !!returnedCsvContent);
    } else if (contentType?.includes('application/pdf')) {
      // Direct PDF response
      const pdfBlob = await response.blob();
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      pdfBase64 = btoa(binary);
    } else {
      // Try to parse as text/JSON
      const text = await response.text();
      try {
        const result = JSON.parse(text);
        pdfBase64 = result.pdf_base64 || result.pdfBase64 || result.pdf;
        returnedCsvBase64 = result.csv_base64 || result.csvBase64 || result.csv;
        returnedCsvContent = result.csv_content || result.csvContent;
      } catch (e) {
        console.warn('Could not parse response as JSON:', text.substring(0, 200));
      }
    }
    
    // Use returned CSV if available, otherwise use our generated one
    const finalCsvContent = returnedCsvContent || csvContent;
    const finalCsvBase64 = returnedCsvBase64 || csvBase64;

    // Create work log entry
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'System';

      await supabase.from('work_logs').insert({
        casefile_id: null, // SOU is system-wide
        description: `State of the Union report generated for ${souData.length} cases`,
        timestamp: new Date().toISOString(),
        user_name: userName
      });
    } catch (logError) {
      console.warn('Failed to create work log entry:', logError);
    }

    console.log('✅ SOU generation complete');

    return {
      success: true,
      csvContent: finalCsvContent,
      csvBase64: finalCsvBase64,
      pdfBase64,
      message: `Successfully generated SOU report for ${souData.length} cases`
    };
  } catch (error) {
    console.error('❌ Error generating SOU:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate and download SOU CSV file
 */
export async function generateAndDownloadSOU(): Promise<void> {
  const result = await generateSOU();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to generate SOU');
  }

  if (result.csvContent) {
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCSV(result.csvContent, `state_of_union_${timestamp}.csv`);
  }
}

