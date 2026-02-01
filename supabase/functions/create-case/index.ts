import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';

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

// Hash API key using SHA-256
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Validate API key from Authorization header
async function validateApiKey(authHeader: string | null): Promise<{ success: boolean; apiKey?: any; error?: string }> {
  if (!authHeader) {
    return { success: false, error: 'Missing Authorization header' };
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { success: false, error: 'Invalid Authorization header format. Expected: Bearer <token>' };
  }

  const apiKey = match[1];
  if (!apiKey || apiKey.length < 32) {
    return { success: false, error: 'Invalid API key format' };
  }

  const keyHash = await hashApiKey(apiKey);

  const { data: apiKeyRecord, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !apiKeyRecord) {
    return { success: false, error: 'Invalid or inactive API key' };
  }

  if (apiKeyRecord.expires_at) {
    const expiresAt = new Date(apiKeyRecord.expires_at);
    if (expiresAt < new Date()) {
      return { success: false, error: 'API key has expired' };
    }
  }

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRecord.id);

  return { success: true, apiKey: apiKeyRecord };
}

// Rate limiting
async function checkRateLimit(apiKey: any): Promise<{ allowed: boolean; remaining?: number; resetAt?: string; error?: string }> {
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setMinutes(0, 0, 0);
  const windowEnd = new Date(windowStart);
  windowEnd.setHours(windowEnd.getHours() + 1);

  const { data: existingLimits, error: fetchError } = await supabase
    .from('api_rate_limits')
    .select('*')
    .eq('api_key_id', apiKey.id)
    .gte('window_start', windowStart.toISOString())
    .lt('window_start', windowEnd.toISOString())
    .order('window_start', { ascending: false })
    .limit(1);

  const existingLimit = existingLimits && existingLimits.length > 0 ? existingLimits[0] : null;

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Error fetching rate limit:', fetchError);
    return { allowed: false, error: 'Failed to check rate limit' };
  }

  let currentCount = 0;
  let limitId: number | null = null;

  if (existingLimit) {
    currentCount = existingLimit.request_count || 0;
    limitId = existingLimit.id;
  }

  if (currentCount >= apiKey.rate_limit_per_hour) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowEnd.toISOString(),
      error: `Rate limit exceeded. Limit: ${apiKey.rate_limit_per_hour} requests per hour.`,
    };
  }

  const newCount = currentCount + 1;
  const remaining = apiKey.rate_limit_per_hour - newCount;

  if (limitId) {
    await supabase
      .from('api_rate_limits')
      .update({ request_count: newCount, updated_at: now.toISOString() })
      .eq('id', limitId);
  } else {
    await supabase.from('api_rate_limits').insert({
      api_key_id: apiKey.id,
      request_count: newCount,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
    });
  }

  return { allowed: true, remaining, resetAt: windowEnd.toISOString() };
}

// Validation schemas
const ClientFormDataSchema = z.object({
  isDriver: z.boolean().default(false),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional().default(''),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ssn: z.string().optional().default(''),
  maritalStatus: z.string().optional().default(''),
  streetAddress: z.string().min(1).max(255),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).max(10),
  primaryPhone: z.string().min(1).max(20),
  secondaryPhone: z.string().max(20).optional().default(''),
  email: z.union([
    z.string().email().max(255),
    z.literal('')
  ]).optional().default(''),
  referrer: z.string().max(255).optional().default(''),
  referrerRelationship: z.string().max(100).optional().default(''),
  injuryDescription: z.string().optional().default(''),
  priorAccidents: z.string().optional().default(''),
  priorInjuries: z.string().optional().default(''),
  workImpact: z.string().optional().default(''),
  hasHealthInsurance: z.boolean().default(false),
  healthInsuranceId: z.union([z.number(), z.string()]).optional().default(0),
  healthMemberId: z.string().max(100).optional().default(''),
  hasAutoInsurance: z.boolean().default(false),
  autoInsuranceId: z.union([z.number(), z.string()]).optional().default(0),
  autoPolicyNumber: z.string().max(100).optional().default(''),
  autoClaimNumber: z.string().max(100).optional().default(''),
  hasMedpay: z.boolean().default(false),
  medpayAmount: z.string().max(50).optional().default(''),
  hasUmCoverage: z.boolean().default(false),
  umAmount: z.string().max(50).optional().default(''),
  selectedProviders: z.array(z.union([z.number(), z.string()])).default([]),
  relationshipToPrimary: z.string().max(50).optional().default(''),
  usesPrimaryAddress: z.boolean().default(false),
  usesPrimaryPhone: z.boolean().default(false),
});

const DefendantFormDataSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  isPolicyholder: z.boolean().default(false),
  policyholderFirstName: z.string().max(100).optional().default(''),
  policyholderLastName: z.string().max(100).optional().default(''),
  autoInsuranceId: z.union([z.number(), z.string()]).optional().default(0),
  policyNumber: z.string().max(100).optional().default(''),
  claimNumber: z.string().max(100).optional().default(''),
  liabilityPercentage: z.number().int().min(0).max(100).default(100),
  notes: z.string().optional().default(''),
  relatedToDefendantId: z.number().int().positive().nullable().optional().default(null),
  relationshipType: z.string().max(50).optional().default(''),
  adjusterFirstName: z.string().max(100).optional().default(''),
  adjusterLastName: z.string().max(100).optional().default(''),
  adjusterEmail: z.string().email().max(255).optional().default(''),
  adjusterPhone: z.string().max(20).optional().default(''),
  adjusterMailingAddress: z.string().max(255).optional().default(''),
  adjusterCity: z.string().max(100).optional().default(''),
  adjusterState: z.string().max(50).optional().default(''),
  adjusterZipCode: z.string().max(10).optional().default(''),
});

const IntakeFormDataSchema = z.object({
  dateOfLoss: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeOfWreck: z.string().max(20).optional().default(''),
  wreckType: z.string().max(100).optional().default(''),
  wreckStreet: z.string().max(255).optional().default(''),
  wreckCity: z.string().max(100).optional().default(''),
  wreckCounty: z.string().max(100).optional().default(''),
  wreckState: z.string().max(50).optional().default('Oklahoma'),
  isPoliceInvolved: z.boolean().default(false),
  policeForce: z.string().max(100).optional().default(''),
  isPoliceReport: z.boolean().default(false),
  policeReportNumber: z.string().max(100).optional().default(''),
  vehicleDescription: z.string().max(500).optional().default(''),
  damageLevel: z.string().max(50).optional().default(''),
  wreckDescription: z.string().optional().default(''),
  signUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  clients: z.array(ClientFormDataSchema).min(1),
  medicalProviders: z.array(z.any()).optional().default([]),
  defendants: z.array(DefendantFormDataSchema).optional().default([]),
}).refine(
  (data) => {
    const dateOfLoss = new Date(data.dateOfLoss);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return dateOfLoss <= today;
  },
  { message: 'Date of loss cannot be in the future', path: ['dateOfLoss'] }
);

const CreateCaseRequestSchema = z.object({
  intakeData: IntakeFormDataSchema,
  documents: z.array(z.any()).optional().default([]),
});

// Helper to process temporary IDs
async function processTemporaryId(
  tempId: any,
  name: string,
  table: 'health_insurance' | 'auto_insurance' | 'medical_providers'
): Promise<number> {
  if (typeof tempId === 'number') return tempId;
  if (typeof tempId === 'string' && tempId.startsWith('temp-')) {
    // Use provided name or generate a default name from temp ID
    const displayName = name || `New ${table === 'health_insurance' ? 'Health Insurance' : table === 'auto_insurance' ? 'Auto Insurance' : 'Medical Provider'}`;
    
    const insertData =
      table === 'medical_providers'
        ? { name: displayName, request_method: 'Email', city: '', type: 'Other' }
        : table === 'health_insurance'
        ? { name: displayName, phone: '', city: '', state: 'OK' }
        : { name: displayName, phone: '', city: '', state: 'OK' };

    const { data, error } = await supabase.from(table).insert(insertData).select().single();
    if (error) throw new Error(`Failed to save ${displayName}: ${error.message}`);
    return data.id;
  }
  return parseInt(String(tempId)) || 0;
}

// Submit case function
async function submitCase(formData: any): Promise<{ casefileId: number; clientIds: number[]; defendantIds: number[] }> {
  const statuteDeadline = formData.dateOfLoss
    ? new Date(new Date(formData.dateOfLoss).getTime() + 2 * 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    : null;

  const daysUntilStatute = statuteDeadline
    ? Math.floor((new Date(statuteDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const { data: casefileData, error: casefileError } = await supabase
    .from('casefiles')
    .insert({
      stage: 'Intake',
      status: 'New',
      client_count: formData.clients.length,
      defendant_count: formData.defendants?.length || 0,
      date_of_loss: formData.dateOfLoss,
      time_of_wreck: formData.timeOfWreck || null,
      wreck_type: formData.wreckType || null,
      wreck_street: formData.wreckStreet || null,
      wreck_city: formData.wreckCity || null,
      wreck_county: formData.wreckCounty || null,
      wreck_state: formData.wreckState || 'Oklahoma',
      is_police_involved: formData.isPoliceInvolved || false,
      police_force: formData.policeForce || null,
      is_police_report: formData.isPoliceReport || false,
      police_report_number: formData.policeReportNumber || null,
      vehicle_description: formData.vehicleDescription || null,
      damage_level: formData.damageLevel || null,
      wreck_description: formData.wreckDescription || null,
      sign_up_date: formData.signUpDate || new Date().toISOString().split('T')[0],
      statute_deadline: statuteDeadline,
      days_until_statute: daysUntilStatute,
      is_archived: false
    })
    .select()
    .single();

  if (casefileError) throw new Error(`Failed to create case: ${casefileError.message}`);
  const casefileId = casefileData.id;

  const clientInserts = formData.clients.map((client: any, index: number) => ({
    casefile_id: casefileId,
    client_number: index + 1,
    client_order: index + 1,
    is_driver: client.isDriver || false,
    first_name: client.firstName,
    middle_name: client.middleName || null,
    last_name: client.lastName,
    date_of_birth: client.dateOfBirth,
    ssn: client.ssn || null,
    street_address: client.streetAddress,
    city: client.city,
    state: client.state,
    zip_code: client.zipCode,
    primary_phone: client.primaryPhone,
    secondary_phone: client.secondaryPhone || null,
    email: client.email,
    marital_status: client.maritalStatus || null,
    referrer: client.referrer || null,
    referrer_relationship: client.referrerRelationship || null,
    injury_description: client.injuryDescription || null,
    prior_accidents: client.priorAccidents || null,
    prior_injuries: client.priorInjuries || null,
    work_impact: client.workImpact || null,
    has_health_insurance: client.hasHealthInsurance || false,
    relationship_to_primary: client.relationshipToPrimary || null,
    uses_primary_address: client.usesPrimaryAddress || false,
    uses_primary_phone: client.usesPrimaryPhone || false,
  }));

  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .insert(clientInserts)
    .select();

  if (clientsError) throw new Error(`Failed to create clients: ${clientsError.message}`);
  const clientIds = clientsData.map((c: any) => c.id);

  // Create medical bills
  const medicalBills = [];
  for (let i = 0; i < clientsData.length; i++) {
    const client = clientsData[i];
    const clientData = formData.clients[i];
    const providers = clientData?.selectedProviders || [];
    for (const providerId of providers) {
      const realProviderId = await processTemporaryId(providerId, '', 'medical_providers');
      medicalBills.push({
        client_id: client.id,
        medical_provider_id: realProviderId,
        hipaa_sent: false,
        bill_received: false,
        records_received: false,
        lien_filed: false,
        in_collections: false,
      });
    }
  }

  if (medicalBills.length > 0) {
    const { error: billsError } = await supabase.from('medical_bills').insert(medicalBills);
    if (billsError) throw new Error(`Failed to create medical bills: ${billsError.message}`);
  }

  // Create health insurance claims
  const healthClaims = [];
  for (let i = 0; i < clientsData.length; i++) {
    const client = clientsData[i];
    const clientData = formData.clients[i];
    if (clientData?.hasHealthInsurance && clientData.healthInsuranceId) {
      const realHealthInsuranceId = await processTemporaryId(
        clientData.healthInsuranceId,
        '',
        'health_insurance'
      );
      healthClaims.push({
        client_id: client.id,
        health_insurance_id: realHealthInsuranceId,
        member_id: clientData.healthMemberId || null,
        hipaa_sent: false,
        lor_sent: false,
        log_received: false,
      });
    }
  }

  if (healthClaims.length > 0) {
    const { error: healthClaimError } = await supabase.from('health_claims').insert(healthClaims);
    if (healthClaimError) throw new Error(`Failed to create health claims: ${healthClaimError.message}`);
  }

  // Create first party claims
  const firstPartyClaims = [];
  for (let i = 0; i < clientsData.length; i++) {
    const client = clientsData[i];
    const clientData = formData.clients[i];
    if (clientData?.hasAutoInsurance && clientData.autoInsuranceId) {
      const realAutoInsuranceId = await processTemporaryId(
        clientData.autoInsuranceId,
        '',
        'auto_insurance'
      );
      firstPartyClaims.push({
        casefile_id: casefileId,
        client_id: client.id,
        auto_insurance_id: realAutoInsuranceId,
        policy_number: clientData.autoPolicyNumber || null,
        claim_number: clientData.autoClaimNumber || null,
        has_medpay: clientData.hasMedpay || false,
        medpay_amount: clientData.medpayAmount || null,
        has_um_coverage: clientData.hasUmCoverage || false,
        um_amount: clientData.umAmount || null,
        lor_sent: false,
        loa_received: false,
        dec_sheets_received: false,
      });
    }
  }

  if (firstPartyClaims.length > 0) {
    const { error: firstPartyError } = await supabase.from('first_party_claims').insert(firstPartyClaims);
    if (firstPartyError) console.warn('Failed to create first party claims:', firstPartyError);
  }

  // Create defendants
  const defendants = formData.defendants || [];
  let defendantIds: number[] = [];

  if (defendants.length > 0) {
    const defendantInserts = defendants.map((defendant: any, index: number) => ({
      casefile_id: casefileId,
      defendant_number: index + 1,
      first_name: defendant.firstName,
      last_name: defendant.lastName,
      is_policyholder: defendant.isPolicyholder || false,
      policyholder_first_name: defendant.policyholderFirstName || null,
      policyholder_last_name: defendant.policyholderLastName || null,
      auto_insurance_id: defendant.autoInsuranceId || null,
      policy_number: defendant.policyNumber || null,
      liability_percentage: defendant.liabilityPercentage || 100,
      notes: defendant.notes || null,
    }));

    const { data: defendantsData, error: defendantsError } = await supabase
      .from('defendants')
      .insert(defendantInserts)
      .select();

    if (defendantsError) throw new Error(`Failed to create defendants: ${defendantsError.message}`);
    defendantIds = defendantsData.map((d: any) => d.id);

    // Create third party claims
    const thirdPartyClaims = [];
    for (let i = 0; i < defendantsData.length; i++) {
      const defendant = defendantsData[i];
      const defendantData = defendants[i];
      if (defendantData.autoInsuranceId) {
        const realAutoInsuranceId = await processTemporaryId(
          defendantData.autoInsuranceId,
          '',
          'auto_insurance'
        );
        thirdPartyClaims.push({
          defendant_id: defendant.id,
          auto_insurance_id: realAutoInsuranceId,
          claim_number: defendantData.claimNumber || null,
          lor_sent: false,
          loa_received: false,
        });
      }
    }

    if (thirdPartyClaims.length > 0) {
      const { error: thirdPartyError } = await supabase.from('third_party_claims').insert(thirdPartyClaims);
      if (thirdPartyError) throw new Error(`Failed to create third party claims: ${thirdPartyError.message}`);
    }
  }

  await supabase.from('work_logs').insert({
    casefile_id: casefileId,
    description: `Case created through API with ${formData.clients.length} client(s) and ${defendants.length} defendant(s)`,
    user_name: 'API',
  });

  return { casefileId, clientIds, defendantIds };
}

// Logging
async function logApiRequest(logData: any): Promise<void> {
  try {
    await supabase.from('api_logs').insert({
      ...logData,
      request_body: logData.request_body ? JSON.stringify(logData.request_body).substring(0, 5000) : null,
      response_body: logData.response_body ? JSON.stringify(logData.response_body).substring(0, 5000) : null,
    });
  } catch (error) {
    console.error('Failed to log API request:', error);
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let apiKeyId: number | null = null;
  let statusCode = 200;
  let responseBody: any = { success: false };
  let errorMessage: string | null = null;

  try {
    const authHeader = req.headers.get('authorization');

    const authResult = await validateApiKey(authHeader);
    if (!authResult.success || !authResult.apiKey) {
      statusCode = 401;
      responseBody = {
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: authResult.error || 'Invalid API key',
        },
      };
      throw new Error(authResult.error || 'Invalid API key');
    }

    const apiKey = authResult.apiKey;
    apiKeyId = apiKey.id;

    const rateLimitResult = await checkRateLimit(apiKey);
    if (!rateLimitResult.allowed) {
      statusCode = 429;
      responseBody = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitResult.error || 'Rate limit exceeded',
        },
      };
      return new Response(JSON.stringify(responseBody), {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    const validationResult = CreateCaseRequestSchema.safeParse(requestBody);

    if (!validationResult.success) {
      statusCode = 400;
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      responseBody = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: errors,
        },
      };
      throw new Error('Validation failed');
    }

    const { intakeData } = validationResult.data;

    const { casefileId, clientIds, defendantIds } = await submitCase(intakeData);

    statusCode = 201;
    responseBody = {
      success: true,
      casefileId,
      clients: clientIds,
      defendants: defendantIds,
      message: 'Case created successfully',
    };
  } catch (error) {
    console.error('Error in create-case function:', error);
    if (statusCode === 200) {
      statusCode = 500;
    }
    errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (!responseBody.error) {
      responseBody = {
        success: false,
        error: {
          code: statusCode === 500 ? 'INTERNAL_ERROR' : 'DATABASE_ERROR',
          message: errorMessage,
        },
      };
    }
  } finally {
    const responseTime = Date.now() - startTime;
    await logApiRequest({
      api_key_id: apiKeyId,
      endpoint: '/functions/v1/create-case',
      method: req.method,
      status_code: statusCode,
      response_time_ms: responseTime,
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || null,
      user_agent: req.headers.get('user-agent'),
      request_body: null,
      response_body: responseBody,
      error_message: errorMessage,
    });
  }

  return new Response(JSON.stringify(responseBody), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

