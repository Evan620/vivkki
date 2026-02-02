import { supabase } from '@/lib/supabaseClient';

export async function fetchHealthInsurers() {
    const { data, error } = await supabase
        .from('health_insurance')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching health insurers:', error);
        return [];
    }

    if (!data) return [];

    // Deduplicate by ID
    const seen = new Map();
    for (const item of data) {
        if (!seen.has(item.id)) {
            seen.set(item.id, item);
        }
    }
    return Array.from(seen.values());
}

export async function fetchAutoInsurers() {
    const { data, error } = await supabase
        .from('auto_insurance')
        .select('*')
        .order('name');

    if (error) {
        console.error('Error fetching auto insurers:', error);
        return [];
    }

    return data || [];
}

export async function fetchHealthAdjusters() {
    try {
        const { data, error } = await supabase
            .from('health_adjusters')
            .select('*, health_insurance:health_insurance_id(name)')
            .order('last_name', { ascending: true })
            .order('first_name', { ascending: true });

        if (error) {
            console.error('Error fetching health adjusters:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error fetching health adjusters:', error);
        return [];
    }
}

export async function fetchAutoAdjusters(someBool = false) {
    // The legacy code had an argument "someBool" likely for filtering, ignoring for now as the usage in ClientFormSection passed false.
    try {
        const { data, error } = await supabase
            .from('auto_adjusters')
            .select('*, auto_insurance:auto_insurance_id(name)')
            .order('last_name', { ascending: true })
            .order('first_name', { ascending: true });

        if (error) {
            console.error('Error fetching auto adjusters:', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Error fetching auto adjusters:', error);
        return [];
    }
}

export async function fetchMedicalProviders() {
    const { data, error } = await supabase
        .from('medical_providers')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching medical providers:', error);
        return [];
    }

    return (data || []).map((row: any) => ({
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

export async function createMedicalProvider(provider: any) {
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
        .from('medical_providers')
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

export async function createHealthInsurer(insurer: any) {
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
    const { data, error } = await supabase.from('health_insurance').insert(insertData).select('*').single();
    if (error) throw error;
    return data;
}

export async function createAutoInsurer(insurer: any) {
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

    const { data, error } = await supabase
        .from('auto_insurance')
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

export async function createHealthAdjuster(adjuster: any) {
    const { data, error } = await supabase
        .from('health_adjusters')
        .insert(adjuster)
        .select('*')
        .single();
    if (error) throw error;
    return data;
}

export async function createAutoAdjuster(adjuster: any) {
    const { data, error } = await supabase
        .from('auto_adjusters')
        .insert(adjuster)
        .select('*')
        .single();
    if (error) throw error;
    return data;
}
