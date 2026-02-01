import { supabase } from '../utils/database'

export interface UpdateResult<T> {
  ok: boolean
  data?: T
  message?: string
}

export async function updateDefendant(defendantId: number, payload: Record<string, any>): Promise<UpdateResult<any>> {
  try {
    const { data, error } = await supabase
      .from('defendants')
      .update(payload)
      .eq('id', defendantId)
      .select()

    if (error) return { ok: false, message: error.message }
    return { ok: true, data }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Unknown error' }
  }
}

export async function updateThirdPartyClaim(thirdPartyClaimId: number, payload: Record<string, any>): Promise<UpdateResult<any>> {
  try {
    const { data, error } = await supabase
      .from('third_party_claims')
      .update(payload)
      .eq('id', thirdPartyClaimId)
      .select()

    if (error) return { ok: false, message: error.message }
    return { ok: true, data }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Unknown error' }
  }
}

export async function updateHealthClaimByClient(clientId: number, payload: Record<string, any>): Promise<UpdateResult<any>> {
  try {
    const { data, error } = await supabase
      .from('health_claims')
      .update(payload)
      .eq('client_id', clientId)
      .select()

    if (error) return { ok: false, message: error.message }
    return { ok: true, data }
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Unknown error' }
  }
}

export async function updateFirstPartyClaimByClient(clientId: number, casefileId: number, payload: Record<string, any>): Promise<UpdateResult<any>> {
  try {
    // First check if a record exists for this client
    const { data: existing, error: checkError } = await supabase
      .from('first_party_claims')
      .select('id, auto_insurance_id')
      .eq('client_id', clientId)
      .eq('casefile_id', casefileId)
      .maybeSingle();

    if (checkError && !checkError.message.includes('does not exist')) {
      console.warn('Error checking for existing first party claim:', checkError);
    }

    let result;

    if (existing) {
      // Update existing record - preserve auto_insurance_id if not in payload
      if (!payload.auto_insurance_id && existing.auto_insurance_id) {
        payload.auto_insurance_id = existing.auto_insurance_id;
      }

      // Remove null/undefined values that might cause issues
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined)
      );

      const { data, error } = await supabase
        .from('first_party_claims')
        .update(cleanPayload)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating first party claim:', error);
        return { ok: false, message: error.message || 'Failed to update first party claim' };
      }
      result = data;
    } else {
      // Insert new record - need auto_insurance_id
      if (!payload.auto_insurance_id) {
        return { ok: false, message: 'Auto insurance is required. Please select an insurance company first.' };
      }

      // Remove null/undefined values that might cause issues
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined)
      );

      const { data, error } = await supabase
        .from('first_party_claims')
        .insert({
          casefile_id: casefileId,
          client_id: clientId,
          ...cleanPayload
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting first party claim:', error);
        return { ok: false, message: error.message || 'Failed to create first party claim' };
      }
      result = data;
    }

    return { ok: true, data: result };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Unknown error' };
  }
}

export async function updateFirstPartyClaimByCase(casefileId: number, payload: Record<string, any>): Promise<UpdateResult<any>> {
  try {
    // First check if a record exists
    const { data: existing, error: checkError } = await supabase
      .from('first_party_claims')
      .select('id, auto_insurance_id')
      .eq('casefile_id', casefileId)
      .maybeSingle();

    if (checkError && !checkError.message.includes('does not exist')) {
      console.warn('Error checking for existing first party claim:', checkError);
    }

    let result;

    if (existing) {
      // Update existing record - preserve auto_insurance_id if not in payload
      if (!payload.auto_insurance_id && existing.auto_insurance_id) {
        payload.auto_insurance_id = existing.auto_insurance_id;
      }

      // Remove null/undefined values that might cause issues
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined)
      );

      const { data, error } = await supabase
        .from('first_party_claims')
        .update(cleanPayload)
        .eq('casefile_id', casefileId)
        .select()
        .single();

      if (error) {
        console.error('Error updating first party claim:', error);
        return { ok: false, message: error.message || 'Failed to update first party claim' };
      }
      result = data;
    } else {
      // Insert new record - need auto_insurance_id
      if (!payload.auto_insurance_id) {
        // Get auto_insurance_id from auto_insurance table (FK constraint references this table)
        const { data: insuranceData } = await supabase
          .from('auto_insurance')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (!insuranceData) {
          return { ok: false, message: 'No auto insurance found. Please add an insurance company first.' };
        }
        payload.auto_insurance_id = insuranceData.id;
      }

      // Remove null/undefined values that might cause issues
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, v]) => v !== null && v !== undefined)
      );

      const { data, error } = await supabase
        .from('first_party_claims')
        .insert({
          casefile_id: casefileId,
          ...cleanPayload
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting first party claim:', error);
        return { ok: false, message: error.message || 'Failed to create first party claim' };
      }
      result = data;
    }

    return { ok: true, data: result };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Unknown error' };
  }
}


