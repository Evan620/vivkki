import { createClient } from '@supabase/supabase-js';
import type { Casefile, Client, Defendant, WorkLogEntry, CasefileWithDetails, MedicalProviderCatalog } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    url: supabaseUrl ? 'present' : 'missing',
    key: supabaseAnonKey ? 'present' : 'missing'
  });
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

interface DbCasefile {
  id: number;
  stage: string;
  status: string;
  client_count: number;
  defendant_count: number;
  date_of_loss: string;
  time_of_wreck: string;
  wreck_type: string;
  wreck_street: string;
  wreck_city: string;
  wreck_state: string;
  wreck_county: string;
  wreck_description: string;
  is_police_involved: boolean;
  police_force: string;
  is_police_report: boolean;
  police_report_number: string;
  vehicle_description: string;
  damage_level: string;
  wreck_notes: string;
  created_at: string;
  updated_at: string;
}

interface DbClient {
  id: number;
  casefile_id: number;
  client_number: number;
  client_order: number;
  is_driver: boolean;
  first_name: string;
  middle_name: string;
  last_name: string;
  date_of_birth: string;
  ssn: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  primary_phone: string;
  secondary_phone: string;
  email: string;
  marital_status: string;
  injury_description: string;
  prior_accidents: string;
  prior_injuries: string;
  work_impact: string;
  referrer: string;
  referrer_relationship: string;
  has_health_insurance: boolean;
}

interface DbDefendant {
  id: number;
  casefile_id: number;
  defendant_number: number;
  first_name: string;
  last_name: string;
  is_policyholder: boolean;
  policyholder_first_name: string;
  policyholder_last_name: string;
  auto_insurance_id: number;
  policy_number: string;
  liability_percentage: number;
  notes: string;
}

interface DbWorkLog {
  id: number;
  casefile_id: number;
  description: string;
  timestamp: string;
  user_name: string;
}

const mapDbCasefileToModel = (dbCase: DbCasefile): Casefile => ({
  id: dbCase.id,
  stage: dbCase.stage as Casefile['stage'],
  status: dbCase.status as Casefile['status'],
  clientCount: dbCase.client_count,
  defendantCount: dbCase.defendant_count,
  dateOfLoss: dbCase.date_of_loss,
  timeOfWreck: dbCase.time_of_wreck,
  wreckType: dbCase.wreck_type,
  wreckStreet: dbCase.wreck_street,
  wreckCity: dbCase.wreck_city,
  wreckState: dbCase.wreck_state,
  wreckCounty: dbCase.wreck_county,
  wreckDescription: dbCase.wreck_description,
  isPoliceInvolved: dbCase.is_police_involved,
  policeForce: dbCase.police_force,
  isPoliceReport: dbCase.is_police_report,
  policeReportNumber: dbCase.police_report_number,
  vehicleDescription: dbCase.vehicle_description,
  damageLevel: dbCase.damage_level,
  wreckNotes: dbCase.wreck_notes,
  signUpDate: (dbCase as any).sign_up_date || '',
  statuteDeadline: (dbCase as any).statute_deadline || '',
  daysUntilStatute: (dbCase as any).days_until_statute || 0,
  createdAt: dbCase.created_at,
  updatedAt: dbCase.updated_at
});

const mapDbClientToModel = (dbClient: DbClient): Client => ({
  id: dbClient.id,
  casefileId: dbClient.casefile_id,
  clientNumber: dbClient.client_number,
  clientOrder: dbClient.client_order,
  isDriver: dbClient.is_driver,
  firstName: dbClient.first_name,
  middleName: dbClient.middle_name,
  lastName: dbClient.last_name,
  dateOfBirth: dbClient.date_of_birth,
  ssn: dbClient.ssn,
  streetAddress: dbClient.street_address,
  city: dbClient.city,
  state: dbClient.state,
  zipCode: dbClient.zip_code,
  primaryPhone: dbClient.primary_phone,
  secondaryPhone: dbClient.secondary_phone,
  email: dbClient.email,
  maritalStatus: dbClient.marital_status,
  injuryDescription: dbClient.injury_description,
  priorAccidents: dbClient.prior_accidents,
  priorInjuries: dbClient.prior_injuries,
  workImpact: dbClient.work_impact,
  referrer: dbClient.referrer,
  referrerRelationship: dbClient.referrer_relationship,
  hasHealthInsurance: dbClient.has_health_insurance
});

const mapDbDefendantToModel = (dbDefendant: DbDefendant): Defendant => ({
  id: dbDefendant.id,
  casefileId: dbDefendant.casefile_id,
  defendantNumber: dbDefendant.defendant_number,
  firstName: dbDefendant.first_name,
  lastName: dbDefendant.last_name,
  isPolicyholder: dbDefendant.is_policyholder,
  policyholderFirstName: dbDefendant.policyholder_first_name,
  policyholderLastName: dbDefendant.policyholder_last_name,
  autoInsuranceId: dbDefendant.auto_insurance_id,
  policyNumber: dbDefendant.policy_number,
  liabilityPercentage: dbDefendant.liability_percentage,
  notes: dbDefendant.notes
});

const mapDbWorkLogToModel = (dbLog: DbWorkLog): WorkLogEntry => ({
  id: dbLog.id,
  casefileId: dbLog.casefile_id,
  description: dbLog.description,
  timestamp: dbLog.timestamp,
  userName: dbLog.user_name
});

export const initDatabase = async (): Promise<void> => {
  // Database is already initialized with migration and seed data
  // This function can be used for any initialization logic if needed
};

export const getAllCases = async (): Promise<Casefile[]> => {
  const { data, error } = await supabase
    .from('casefiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
    return [];
  }

  return (data as DbCasefile[]).map(mapDbCasefileToModel);
};

export const getCaseById = async (id: number): Promise<CasefileWithDetails | null> => {
  const { data: caseData, error: caseError } = await supabase
    .from('casefiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (caseError || !caseData) {
    console.error('Error fetching case:', caseError);
    return null;
  }

  const { data: clientsData } = await supabase
    .from('clients')
    .select('*')
    .eq('casefile_id', id);

  const { data: defendantsData } = await supabase
    .from('defendants')
    .select('*')
    .eq('casefile_id', id);

  const { data: workLogsData } = await supabase
    .from('work_logs')
    .select('*')
    .eq('casefile_id', id)
    .order('timestamp', { ascending: false });

  return {
    ...mapDbCasefileToModel(caseData as DbCasefile),
    clients: (clientsData as DbClient[] || []).map(mapDbClientToModel),
    defendants: (defendantsData as DbDefendant[] || []).map(mapDbDefendantToModel),
    workLogs: (workLogsData as DbWorkLog[] || []).map(mapDbWorkLogToModel),
    medicalBills: [],
    autoAdjusters: [],
    generatedDocuments: []
  };
};

export const createCase = async (data: Omit<Casefile, 'id' | 'createdAt' | 'updatedAt'>): Promise<Casefile | null> => {
  const dbData = {
    stage: data.stage,
    status: data.status,
    client_count: data.clientCount,
    defendant_count: data.defendantCount,
    date_of_loss: data.dateOfLoss,
    time_of_wreck: data.timeOfWreck,
    wreck_type: data.wreckType,
    wreck_street: data.wreckStreet,
    wreck_city: data.wreckCity,
    wreck_state: data.wreckState,
    wreck_county: data.wreckCounty,
    wreck_description: data.wreckDescription,
    is_police_involved: data.isPoliceInvolved,
    police_force: data.policeForce,
    is_police_report: data.isPoliceReport,
    police_report_number: data.policeReportNumber,
    vehicle_description: data.vehicleDescription,
    damage_level: data.damageLevel,
    wreck_notes: data.wreckNotes
  };

  const { data: result, error } = await supabase
    .from('casefiles')
    .insert([dbData])
    .select()
    .single();

  if (error) {
    console.error('Error creating case:', error);
    return null;
  }

  return mapDbCasefileToModel(result as DbCasefile);
};

export const updateCase = async (id: number, data: Partial<Casefile>): Promise<Casefile | null> => {
  const dbData: Record<string, unknown> = {};

  if (data.stage !== undefined) dbData.stage = data.stage;
  if (data.status !== undefined) dbData.status = data.status;
  if (data.clientCount !== undefined) dbData.client_count = data.clientCount;
  if (data.defendantCount !== undefined) dbData.defendant_count = data.defendantCount;
  if (data.dateOfLoss !== undefined) dbData.date_of_loss = data.dateOfLoss;
  if (data.timeOfWreck !== undefined) dbData.time_of_wreck = data.timeOfWreck;
  if (data.wreckType !== undefined) dbData.wreck_type = data.wreckType;
  if (data.wreckStreet !== undefined) dbData.wreck_street = data.wreckStreet;
  if (data.wreckCity !== undefined) dbData.wreck_city = data.wreckCity;
  if (data.wreckState !== undefined) dbData.wreck_state = data.wreckState;
  if (data.wreckCounty !== undefined) dbData.wreck_county = data.wreckCounty;
  if (data.wreckDescription !== undefined) dbData.wreck_description = data.wreckDescription;
  if (data.isPoliceInvolved !== undefined) dbData.is_police_involved = data.isPoliceInvolved;
  if (data.policeForce !== undefined) dbData.police_force = data.policeForce;
  if (data.isPoliceReport !== undefined) dbData.is_police_report = data.isPoliceReport;
  if (data.policeReportNumber !== undefined) dbData.police_report_number = data.policeReportNumber;
  if (data.vehicleDescription !== undefined) dbData.vehicle_description = data.vehicleDescription;
  if (data.damageLevel !== undefined) dbData.damage_level = data.damageLevel;
  if (data.wreckNotes !== undefined) dbData.wreck_notes = data.wreckNotes;

  dbData.updated_at = new Date().toISOString();

  const { data: result, error } = await supabase
    .from('casefiles')
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating case:', error);
    return null;
  }

  return mapDbCasefileToModel(result as DbCasefile);
};

export const deleteCase = async (id: number): Promise<boolean> => {
  const { error } = await supabase
    .from('casefiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting case:', error);
    return false;
  }

  return true;
};

// Fetch medical providers from whichever table exists, normalized to a common shape
export async function fetchMedicalProviders(): Promise<MedicalProviderCatalog[]> {
  // Fetch from canonical medical_providers table only (has all columns including notes, phone_1, etc.)
  const { data, error } = await supabase
    .from('medical_providers' as any)
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching medical providers:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Map to MedicalProviderCatalog interface
  return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
    street_address: row.street_address,
    city: row.city,
    state: row.state,
    zip_code: row.zip_code,
    phone: row.phone || row.phone_1,
    fax: row.fax || row.fax_1,
    email: row.email || row.email_1,
    request_method: row.request_method,
    notes: row.notes
  }));
}

export async function createMedicalProvider(provider: Partial<MedicalProviderCatalog> & {
  phone_1?: string | null;
  phone_1_type?: string | null;
  phone_2?: string | null;
  phone_2_type?: string | null;
  phone_3?: string | null;
  phone_3_type?: string | null;
  fax_1?: string | null;
  fax_1_type?: string | null;
  fax_2?: string | null;
  fax_2_type?: string | null;
  fax_3?: string | null;
  fax_3_type?: string | null;
  email_1?: string | null;
  email_1_type?: string | null;
  email_2?: string | null;
  email_2_type?: string | null;
  street_address_2?: string | null;
  notes?: string | null;
}): Promise<MedicalProviderCatalog> {
  // Insert into canonical medical_providers table only (has all columns)
  const insertData = {
      name: provider.name,
      type: provider.type || 'Other',
      street_address: provider.street_address || '',
    street_address_2: provider.street_address_2 || null,
      city: provider.city || '',
      state: provider.state || 'OK',
      zip_code: provider.zip_code || '',
    phone: provider.phone || provider.phone_1 || '',
    fax: provider.fax || provider.fax_1 || '',
    email: provider.email || provider.email_1 || '',
    request_method: provider.request_method || 'Email',
    notes: provider.notes || null,
    phone_1_type: provider.phone_1_type || null,
    phone_1: provider.phone_1 || null,
    phone_2_type: provider.phone_2_type || null,
    phone_2: provider.phone_2 || null,
    phone_3_type: provider.phone_3_type || null,
    phone_3: provider.phone_3 || null,
    fax_1_type: provider.fax_1_type || null,
    fax_1: provider.fax_1 || null,
    fax_2_type: provider.fax_2_type || null,
    fax_2: provider.fax_2 || null,
    fax_3_type: provider.fax_3_type || null,
    fax_3: provider.fax_3 || null,
    email_1_type: provider.email_1_type || null,
    email_1: provider.email_1 || null,
    email_2_type: provider.email_2_type || null,
    email_2: provider.email_2 || null
  };

  const { data, error } = await supabase
    .from('medical_providers' as any)
    .insert(insertData)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to create medical provider:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to create provider: No data returned');
  }

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        street_address: data.street_address,
        city: data.city,
        state: data.state,
        zip_code: data.zip_code,
        phone: data.phone,
        fax: data.fax,
        email: data.email,
    request_method: data.request_method,
    notes: data.notes
      };
}

export async function fetchHealthInsurers(): Promise<any[]> {
  const { data, error } = await supabase.from('health_insurance' as any).select('*').order('name');
  if (error) return [];
  if (!data) return [];
  
  // Deduplicate by ID to prevent duplicate key warnings
  const seen = new Map<number, any>();
  for (const item of data) {
    if (!seen.has(item.id)) {
      seen.set(item.id, item);
    }
  }
  return Array.from(seen.values());
}

export async function createHealthInsurer(insurer: any): Promise<any> {
  // Ensure all required fields are provided with defaults
  const insertData = {
    name: insurer.name || '',
    phone: insurer.phone || insurer.phone_1 || '',
    city: insurer.city || '',
    state: insurer.state || 'OK',
    street_address: insurer.street_address || null,
    street_address_2: insurer.street_address_2 || null,
    zip_code: insurer.zip_code || null,
    phone_1_type: insurer.phone_1_type || null,
    phone_1: insurer.phone_1 || null,
    phone_2_type: insurer.phone_2_type || null,
    phone_2: insurer.phone_2 || null,
    fax_1_type: insurer.fax_1_type || null,
    fax_1: insurer.fax_1 || insurer.fax || null,
    fax_2_type: insurer.fax_2_type || null,
    fax_2: insurer.fax_2 || null,
    email_1_type: insurer.email_1_type || null,
    email_1: insurer.email_1 || insurer.email || null,
    email_2_type: insurer.email_2_type || null,
    email_2: insurer.email_2 || null,
    notes: insurer.notes || null
  };
  const { data, error } = await supabase.from('health_insurance' as any).insert(insertData).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteHealthInsurer(id: number): Promise<boolean> {
  const { error } = await supabase.from('health_insurance' as any).delete().eq('id', id);
  if (error) {
    console.error('Failed to delete health insurer', error);
    return false;
  }
  return true;
}

export async function fetchAutoInsurers(): Promise<any[]> {
  // Fetch from canonical auto_insurance table only (has all columns including notes, email, address, etc.)
  const { data, error } = await supabase
    .from('auto_insurance' as any)
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching auto insurers:', error);
    return [];
    }

  return data || [];
}

export async function createAutoInsurer(insurer: any): Promise<any> {
  // Ensure all required fields are provided with defaults
  const insertData = {
    name: insurer.name || '',
    phone: insurer.phone || insurer.phone_1 || '',
    city: insurer.city || '',
    state: insurer.state || 'OK',
    street_address: insurer.street_address || null,
    street_address_2: insurer.street_address_2 || null,
    zip_code: insurer.zip_code || null,
    phone_1_type: insurer.phone_1_type || null,
    phone_1: insurer.phone_1 || null,
    phone_2_type: insurer.phone_2_type || null,
    phone_2: insurer.phone_2 || null,
    fax_1_type: insurer.fax_1_type || null,
    fax_1: insurer.fax_1 || insurer.fax || null,
    fax_2_type: insurer.fax_2_type || null,
    fax_2: insurer.fax_2 || null,
    email_1_type: insurer.email_1_type || null,
    email_1: insurer.email_1 || insurer.email || null,
    email_2_type: insurer.email_2_type || null,
    email_2: insurer.email_2 || null,
    notes: insurer.notes || null
  };
  
  // Insert into auto_insurance table (has required NOT NULL fields)
  const { data, error } = await supabase
    .from('auto_insurance' as any)
    .insert(insertData)
    .select('*')
    .single();
  
  if (error) {
    console.error('Failed to create auto insurer:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Failed to create auto insurer: No data returned');
  }
  
  return data;
}

export async function updateAutoInsurer(id: number, insurer: any): Promise<any> {
  // Prepare update data with all fields
  const updateData: any = {
    name: insurer.name || '',
    phone: insurer.phone || insurer.phone_1 || '',
    city: insurer.city || '',
    state: insurer.state || 'OK',
    street_address: insurer.street_address || null,
    street_address_2: insurer.street_address_2 || null,
    zip_code: insurer.zip_code || null,
    phone_1_type: insurer.phone_1_type || null,
    phone_1: insurer.phone_1 || null,
    phone_2_type: insurer.phone_2_type || null,
    phone_2: insurer.phone_2 || null,
    fax_1_type: insurer.fax_1_type || null,
    fax_1: insurer.fax_1 || insurer.fax || null,
    fax_2_type: insurer.fax_2_type || null,
    fax_2: insurer.fax_2 || null,
    email_1_type: insurer.email_1_type || null,
    email_1: insurer.email_1 || insurer.email || null,
    email_2_type: insurer.email_2_type || null,
    email_2: insurer.email_2 || null,
    notes: insurer.notes || null,
    updated_at: new Date().toISOString()
  };
  
  // Update auto_insurance table
  const { data, error } = await supabase
    .from('auto_insurance' as any)
    .update(updateData)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) {
    console.error('Failed to update auto insurer:', error);
    throw error;
  }
  
  if (!data) {
    throw new Error('Failed to update auto insurer: No data returned');
  }
  
  return data;
}

export async function deleteAutoInsurer(id: number, source?: string): Promise<{ success: boolean; error?: string }> {
  // Try deleting from auto_insurance table (the canonical table)
  // Check both tables if needed, but prioritize auto_insurance
  const tables = ['auto_insurance'];
  
  console.log(`Attempting to delete auto insurer id=${id}, source=${source || 'auto_insurance'}, tables=${tables.join(',')}`);
  
  let deletedAny = false;
  let lastError: any = null;
  let lastErrorMessage = '';
  let lastData: any = null;
  
  for (const t of tables) {
    console.log(`Trying to delete from table: ${t}`);
    const { data, error } = await supabase.from(t as any).delete().eq('id', id).select('id');
    
    console.log(`Delete result from ${t}:`, { data, error });
    
    if (error) {
      console.error(`Failed to delete from ${t}:`, error);
      lastError = error;
      lastErrorMessage = error.message || JSON.stringify(error);
      // If it's an RLS error, we know the table exists but permission is missing
      if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
        return { 
          success: false, 
          error: `Permission denied: Missing DELETE policy on ${t}. Please run the SQL migration to add delete policies.` 
        };
      }
      // If it's a foreign key constraint error, provide helpful message
      if (error.message?.includes('foreign key') || error.message?.includes('constraint')) {
        return {
          success: false,
          error: `Cannot delete: This insurance company is linked to existing records (adjusters, claims, etc.). Please remove those links first.`
        };
      }
      continue;
    }
    
    // Check if data was returned (indicating a row was deleted)
    if (data) {
      const rowsDeleted = Array.isArray(data) ? data.length : (data ? 1 : 0);
      console.log(`Rows deleted from ${t}:`, rowsDeleted);
      if (rowsDeleted > 0) {
        deletedAny = true;
        lastData = data;
        break; // Success, no need to try other tables
      }
    }
  }
  
  if (!deletedAny) {
    // If we have data but no rows, the ID doesn't exist
    if (lastData && Array.isArray(lastData) && lastData.length === 0) {
      return { 
        success: false, 
        error: `Record with ID ${id} not found. It may have already been deleted.` 
      };
    }
    
    const errorMsg = lastError 
      ? lastErrorMessage 
      : `No rows were deleted. ID ${id} not found in table: ${tables.join(', ')}. The record may not exist or you may not have permission.`;
    console.error('Delete auto insurer failed:', lastError || errorMsg);
    return { success: false, error: errorMsg };
  }
  
  console.log('Delete successful:', lastData);
  return { success: true };
}

export async function deleteMedicalProvider(id: number): Promise<boolean> {
  const tables = ['medical_providers', 'medical_providers_complete', 'medical_providers_simple'];
  for (const t of tables) {
    const { error } = await supabase.from(t as any).delete().eq('id', id);
    if (!error) return true;
  }
  return false;
}

// Health Adjusters
export async function fetchHealthAdjusters(): Promise<any[]> {
  try {
    // Try with relationship query first
    const { data, error } = await supabase
      .from('health_adjusters' as any)
      .select('*, health_insurance:health_insurance_id(name)')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });
    
    if (error) {
      // Fallback: fetch without relationship and join manually
      const { data: adjustersData, error: adjustersError } = await supabase
        .from('health_adjusters' as any)
        .select('*')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });
      
      if (adjustersError) {
        console.error('Error fetching health adjusters:', adjustersError);
        return [];
      }
      
      // Fetch insurance companies and map them
      if (adjustersData && adjustersData.length > 0) {
        const insuranceIds = adjustersData
          .map(a => a.health_insurance_id)
          .filter(id => id != null);
        
        if (insuranceIds.length > 0) {
          const { data: insuranceData } = await supabase
            .from('health_insurance' as any)
            .select('id, name')
            .in('id', insuranceIds);
          
          const insuranceMap = new Map((insuranceData || []).map(ins => [ins.id, ins]));
          
          return (adjustersData || []).map(adj => ({
            ...adj,
            health_insurance: insuranceMap.get(adj.health_insurance_id) || null
          }));
        }
      }
      
      return adjustersData || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching health adjusters:', error);
    return [];
  }
}

export async function fetchHealthAdjusterById(id: number): Promise<any | null> {
  try {
    // Try with relationship query first
    const { data, error } = await supabase
      .from('health_adjusters' as any)
      .select('*, health_insurance:health_insurance_id(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      // Fallback: fetch without relationship and join manually
      const { data: adjusterData, error: adjusterError } = await supabase
        .from('health_adjusters' as any)
        .select('*')
        .eq('id', id)
        .single();
      
      if (adjusterError) {
        console.error('Error fetching health adjuster:', adjusterError);
        return null;
      }
      
      // Fetch insurance company if exists
      if (adjusterData && adjusterData.health_insurance_id) {
        const { data: insuranceData } = await supabase
          .from('health_insurance' as any)
          .select('*')
          .eq('id', adjusterData.health_insurance_id)
          .single();
        
        return {
          ...adjusterData,
          health_insurance: insuranceData || null
        };
      }
      
      return adjusterData;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching health adjuster:', error);
    return null;
  }
}

export async function createHealthAdjuster(adjuster: any): Promise<any> {
  const { data, error } = await supabase
    .from('health_adjusters' as any)
    .insert(adjuster)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateHealthAdjuster(id: number, adjuster: any): Promise<any> {
  const { data, error } = await supabase
    .from('health_adjusters' as any)
    .update({ ...adjuster, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHealthAdjuster(id: number): Promise<boolean> {
  const { error } = await supabase.from('health_adjusters' as any).delete().eq('id', id);
  if (error) {
    console.error('Failed to delete health adjuster', error);
    return false;
  }
  return true;
}

// Medical Provider Adjusters
export async function fetchMedicalProviderAdjusters(medicalProviderId?: number): Promise<any[]> {
  try {
    let query = supabase
      .from('medical_provider_adjusters' as any)
      .select('*, medical_provider:medical_provider_id(id, name)');
    
    if (medicalProviderId) {
      query = query.eq('medical_provider_id', medicalProviderId);
    }
    
    const { data, error } = await query
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });
    
    if (error) {
      // Fallback: fetch without relationship and join manually
      let fallbackQuery = supabase
        .from('medical_provider_adjusters' as any)
        .select('*');
      
      if (medicalProviderId) {
        fallbackQuery = fallbackQuery.eq('medical_provider_id', medicalProviderId);
      }
      
      const { data: adjustersData, error: adjustersError } = await fallbackQuery
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });
      
      if (adjustersError) {
        console.error('Error fetching medical provider adjusters:', adjustersError);
        return [];
      }
      
      // Fetch medical providers and map them
      if (adjustersData && adjustersData.length > 0) {
        const providerIds = adjustersData
          .map(a => a.medical_provider_id)
          .filter(id => id != null);
        
        if (providerIds.length > 0) {
          const { data: providerData } = await supabase
            .from('medical_providers' as any)
            .select('id, name')
            .in('id', providerIds);
          
          const providerMap = new Map((providerData || []).map(p => [p.id, p]));
          
          return (adjustersData || []).map(adj => ({
            ...adj,
            medical_provider: providerMap.get(adj.medical_provider_id) || null
          }));
        }
      }
      
      return adjustersData || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching medical provider adjusters:', error);
    return [];
  }
}

export async function fetchMedicalProviderAdjusterById(id: number): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('medical_provider_adjusters' as any)
      .select('*, medical_provider:medical_provider_id(id, name)')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching medical provider adjuster:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching medical provider adjuster:', error);
    return null;
  }
}

export async function createMedicalProviderAdjuster(adjuster: any): Promise<any> {
  const { data, error } = await supabase
    .from('medical_provider_adjusters' as any)
    .insert(adjuster)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateMedicalProviderAdjuster(id: number, adjuster: any): Promise<any> {
  const { data, error } = await supabase
    .from('medical_provider_adjusters' as any)
    .update(adjuster)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMedicalProviderAdjuster(id: number): Promise<boolean> {
  const { error } = await supabase.from('medical_provider_adjusters' as any).delete().eq('id', id);
  if (error) {
    console.error('Failed to delete medical provider adjuster', error);
    return false;
  }
  return true;
}

// Auto Adjusters
export async function fetchAutoAdjusters(includeArchived: boolean = false): Promise<any[]> {
  try {
    // Build query
    let query = supabase
      .from('auto_adjusters' as any)
      .select('*, auto_insurance:auto_insurance_id(name)');
    
    // Filter out archived by default
    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }
    
    // Try with relationship query first
    // Order by first_name first (since last_name can be null), then last_name
    const { data, error } = await query
      .order('first_name', { ascending: true, nullsFirst: false })
      .order('last_name', { ascending: true, nullsLast: true });
    
    if (error) {
      // Fallback: fetch without relationship and join manually
      let fallbackQuery = supabase
        .from('auto_adjusters' as any)
        .select('*');
      
      // Filter out archived by default
      if (!includeArchived) {
        fallbackQuery = fallbackQuery.eq('is_archived', false);
      }
      
      const { data: adjustersData, error: adjustersError } = await fallbackQuery
        .order('first_name', { ascending: true, nullsFirst: false })
        .order('last_name', { ascending: true, nullsLast: true });
      
      if (adjustersError) {
        console.error('Error fetching auto adjusters:', adjustersError);
        return [];
      }
      
      // Fetch insurance companies and map them
      if (adjustersData && adjustersData.length > 0) {
        const insuranceIds = adjustersData
          .map(a => a.auto_insurance_id)
          .filter(id => id != null);
        
        if (insuranceIds.length > 0) {
          const { data: insuranceData } = await supabase
            .from('auto_insurance' as any)
            .select('id, name')
            .in('id', insuranceIds);
          
          const insuranceMap = new Map((insuranceData || []).map(ins => [ins.id, ins]));
          
          return (adjustersData || []).map(adj => ({
            ...adj,
            auto_insurance: insuranceMap.get(adj.auto_insurance_id) || null
          }));
        }
      }
      
      return adjustersData || [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching auto adjusters:', error);
    return [];
  }
}

export async function fetchAutoAdjusterById(id: number): Promise<any | null> {
  try {
    // Try with relationship query first
    const { data, error } = await supabase
      .from('auto_adjusters' as any)
      .select('*, auto_insurance:auto_insurance_id(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      // Fallback: fetch without relationship and join manually
      const { data: adjusterData, error: adjusterError } = await supabase
        .from('auto_adjusters' as any)
        .select('*')
        .eq('id', id)
        .single();
      
      if (adjusterError) {
        console.error('Error fetching auto adjuster:', adjusterError);
        return null;
      }
      
      // Fetch insurance company if exists
      if (adjusterData && adjusterData.auto_insurance_id) {
        const { data: insuranceData } = await supabase
          .from('auto_insurance' as any)
          .select('*')
          .eq('id', adjusterData.auto_insurance_id)
          .single();
        
        return {
          ...adjusterData,
          auto_insurance: insuranceData || null
        };
      }
      
      return adjusterData;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching auto adjuster:', error);
    return null;
  }
}

export async function createAutoAdjuster(adjuster: any): Promise<any> {
  const { data, error } = await supabase
    .from('auto_adjusters' as any)
    .insert(adjuster)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateAutoAdjuster(id: number, adjuster: any): Promise<any> {
  const { data, error } = await supabase
    .from('auto_adjusters' as any)
    .update({ ...adjuster, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAutoAdjuster(id: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('auto_adjusters' as any)
      .delete()
      .eq('id', id)
      .select();
    
  if (error) {
      console.error('Failed to delete auto adjuster:', error);
      throw error;
    }
    
    // Check if any rows were actually deleted
    if (data && data.length > 0) {
      return true;
    }
    
    // No rows deleted - adjuster might not exist
    console.warn(`No adjuster found with id ${id} to delete`);
    return false;
  } catch (error: any) {
    console.error('Exception deleting auto adjuster:', error);
    throw error; // Re-throw to let caller handle
  }
}

export async function archiveAutoAdjuster(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('auto_adjusters' as any)
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Failed to archive auto adjuster:', error);
      throw error;
    }
    
  return true;
  } catch (error: any) {
    console.error('Exception archiving auto adjuster:', error);
    throw error;
  }
}

export async function unarchiveAutoAdjuster(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('auto_adjusters' as any)
      .update({
        is_archived: false,
        archived_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Failed to unarchive auto adjuster:', error);
      throw error;
    }
    
    return true;
  } catch (error: any) {
    console.error('Exception unarchiving auto adjuster:', error);
    throw error;
  }
}
