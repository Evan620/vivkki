import { supabase } from './database';
import type { IntakeFormData } from '../types/intake';

// Helper function to process temporary IDs and create real records
// Returns the real ID, or null if the ID is invalid
async function processTemporaryId(tempId: any, name: string, table: 'health_insurance' | 'auto_insurance' | 'medical_providers'): Promise<number | null> {
  // If it's already a valid positive number, return it
  if (typeof tempId === 'number' && tempId > 0) return tempId;
  
  // If it's a string and starts with 'temp-', create a real record
  if (typeof tempId === 'string' && tempId.startsWith('temp-')) {
    const insertData = table === 'medical_providers' 
      ? { name: name || 'New Medical Provider', request_method: 'Email', city: '', type: 'Other' }
      : table === 'health_insurance'
      ? { name: name || 'New Health Insurance', phone: '', city: '', state: 'OK' } // All required fields
      : { name: name || 'New Auto Insurance', phone: '', city: '', state: 'OK' }; // All required fields
    
    const { data, error } = await supabase.from(table).insert(insertData).select().single();
    if (error) {
      console.error(`Error creating ${table} record:`, error);
      throw new Error(`Failed to save ${name || table}`);
    }
    return data.id;
  }
  
  // Try to parse as number - must be a valid positive integer
  if (typeof tempId === 'string') {
    const parsed = parseInt(tempId, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  
  // Invalid ID - return null instead of 0 to avoid foreign key violations
  console.warn(`Invalid ${table} ID encountered:`, tempId);
  return null;
}

export async function submitCase(formData: IntakeFormData): Promise<number> {
  // Calculate statute deadline
  const statuteDeadline = formData.dateOfLoss ? 
    new Date(new Date(formData.dateOfLoss).getTime() + (2 * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : 
    null;

  // Calculate days until statute (dynamic - updates daily)
  const daysUntilStatute = statuteDeadline ? 
    Math.floor((new Date(statuteDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
    null;

  // Create casefile
  const { data: casefileData, error: casefileError } = await supabase
    .from('casefiles')
    .insert({
      stage: 'Intake',
      status: 'New',
      client_count: formData.clients.length,
      defendant_count: formData.defendants.length,
      date_of_loss: formData.dateOfLoss,
      time_of_wreck: formData.timeOfWreck,
      wreck_type: formData.wreckType,
      wreck_street: formData.wreckStreet,
      wreck_city: formData.wreckCity,
      wreck_county: formData.wreckCounty,
      wreck_state: formData.wreckState,
      is_police_involved: formData.isPoliceInvolved,
      police_force: formData.policeForce,
      is_police_report: formData.isPoliceReport,
      police_report_number: formData.policeReportNumber,
      vehicle_description: formData.vehicleDescription,
      damage_level: formData.damageLevel,
      wreck_description: formData.wreckDescription,
      sign_up_date: formData.signUpDate,
      statute_deadline: statuteDeadline,
      days_until_statute: daysUntilStatute,
      is_archived: false
    })
    .select()
    .single();

  if (casefileError) throw new Error(`Failed to create case: ${casefileError.message}`);
  const casefileId = casefileData.id;

  // Create all clients
  const clientInserts = formData.clients.map((client, index) => ({
    casefile_id: casefileId,
    client_number: index + 1,
    client_order: index + 1,
    is_driver: client.isDriver,
    first_name: client.firstName,
    middle_name: client.middleName,
    last_name: client.lastName,
    date_of_birth: client.dateOfBirth,
    ssn: client.ssn,
    street_address: client.streetAddress,
    city: client.city,
    state: client.state,
    zip_code: client.zipCode,
    primary_phone: client.primaryPhone,
    secondary_phone: client.secondaryPhone,
    email: client.email,
    marital_status: client.maritalStatus,
    referrer: client.referrer,
    referrer_relationship: client.referrerRelationship,
    injury_description: client.injuryDescription,
    prior_accidents: client.priorAccidents,
    prior_injuries: client.priorInjuries,
    work_impact: client.workImpact,
    has_health_insurance: client.hasHealthInsurance,
    // Client relationship fields
    relationship_to_primary: client.relationshipToPrimary || null,
    uses_primary_address: client.usesPrimaryAddress || false,
    uses_primary_phone: client.usesPrimaryPhone || false
  }));

  const { data: clientsData, error: clientsError } = await supabase
    .from('clients')
    .insert(clientInserts)
    .select();

  if (clientsError) throw new Error(`Failed to create clients: ${clientsError.message}`);

  // Create medical bills for each client using their selected providers
  const medicalBills = [];
  for (let clientIndex = 0; clientIndex < clientsData.length; clientIndex++) {
    const client = clientsData[clientIndex];
    const clientData = formData.clients[clientIndex];
    const clientProviders = clientData?.selectedProviders || [];
    
    console.log(`Processing providers for client ${client.id}:`, clientProviders);
    
    // Process each provider (convert temporary IDs to real ones)
    for (const providerId of clientProviders) {
      console.log(`Processing provider ID:`, providerId, `type:`, typeof providerId);
      const realProviderId = await processTemporaryId(providerId, '', 'medical_providers');
      console.log(`Real provider ID:`, realProviderId);
      
      // Skip invalid provider IDs to avoid foreign key violations
      if (realProviderId === null) {
        console.warn(`Skipping invalid provider ID for client ${client.id}:`, providerId);
        continue;
      }
      
      // Verify the provider exists in the database before adding
      const { data: providerExists, error: checkError } = await supabase
        .from('medical_providers')
        .select('id')
        .eq('id', realProviderId)
        .single();
      
      if (checkError || !providerExists) {
        console.warn(`Provider ID ${realProviderId} does not exist in database, skipping`);
        continue;
      }

      medicalBills.push({
        client_id: client.id,
        medical_provider_id: realProviderId,
        hipaa_sent: false,
        bill_received: false,
        records_received: false,
        lien_filed: false,
        in_collections: false
      });
    }
  }

  console.log(`Medical bills to insert:`, medicalBills);

  // Insert medical bills
  if (medicalBills.length > 0) {
    const { data: billsData, error: billsError } = await supabase
      .from('medical_bills')
      .insert(medicalBills)
      .select();

    if (billsError) throw new Error(`Failed to create medical bills: ${billsError.message}`);
  }

  // Create health insurance claims and adjusters for clients who have health insurance
  const healthClaims = [];
  const healthAdjustersToCreate: Array<{ clientIndex: number; adjusterData: any; healthInsuranceId: number }> = [];
  
  for (let clientIndex = 0; clientIndex < clientsData.length; clientIndex++) {
    const client = clientsData[clientIndex];
    const clientData = formData.clients[clientIndex];
    
    if (clientData && clientData.hasHealthInsurance && clientData.healthInsuranceId) {
      const realHealthInsuranceId = await processTemporaryId(clientData.healthInsuranceId, '', 'health_insurance');
      // Skip invalid health insurance IDs
      if (realHealthInsuranceId === null) {
        console.warn(`Skipping invalid health insurance ID for client ${client.id}:`, clientData.healthInsuranceId);
        continue;
      }

      let healthAdjusterId: number | null = null;

      // Handle health adjuster
      if (clientData.healthAdjusterId) {
        // Use existing adjuster
        healthAdjusterId = clientData.healthAdjusterId;
      } else if (clientData.healthAdjusterInfo) {
        // Create new adjuster (will be created after health claims)
        const adjusterData = {
          health_insurance_id: realHealthInsuranceId,
          first_name: clientData.healthAdjusterInfo.first_name || '',
          middle_name: clientData.healthAdjusterInfo.middle_name || null,
          last_name: clientData.healthAdjusterInfo.last_name || '',
          email: clientData.healthAdjusterInfo.email || null,
          phone: clientData.healthAdjusterInfo.phone || null,
          fax: clientData.healthAdjusterInfo.fax || null,
          street_address: clientData.healthAdjusterInfo.street_address || null,
          city: clientData.healthAdjusterInfo.city || null,
          state: clientData.healthAdjusterInfo.state || null,
          zip_code: clientData.healthAdjusterInfo.zip_code || null
        };
        healthAdjustersToCreate.push({ clientIndex, adjusterData, healthInsuranceId: realHealthInsuranceId });
      }

      healthClaims.push({
        client_id: client.id,
        health_insurance_id: realHealthInsuranceId,
        member_id: clientData.healthMemberId || null,
        health_adjuster_id: healthAdjusterId,
        hipaa_sent: false,
        lor_sent: false,
        log_received: false
      });
    }
  }

  // Insert health claims first
  let createdHealthClaims: any[] = [];
  if (healthClaims.length > 0) {
    const { data: healthClaimsData, error: healthClaimError } = await supabase
      .from('health_claims')
      .insert(healthClaims)
      .select();

    if (healthClaimError) throw new Error(`Failed to create health claims: ${healthClaimError.message}`);
    createdHealthClaims = healthClaimsData || [];
  }

  // Create new health adjusters and link them to health claims
  if (healthAdjustersToCreate.length > 0) {
    for (let i = 0; i < healthAdjustersToCreate.length; i++) {
      const { clientIndex, adjusterData, healthInsuranceId } = healthAdjustersToCreate[i];
      try {
        const { data: newAdjuster, error: adjusterError } = await supabase
          .from('health_adjusters')
          .insert(adjusterData)
          .select()
          .single();

        if (adjusterError) {
          console.error('Failed to create health adjuster:', adjusterError);
          // Continue without adjuster - don't block case creation
        } else if (newAdjuster) {
          // Find the corresponding health claim and update it
          const client = clientsData[clientIndex];
          const healthClaim = createdHealthClaims.find(
            hc => hc.client_id === client.id && hc.health_insurance_id === healthInsuranceId
          );
          
          if (healthClaim) {
            const { error: updateError } = await supabase
              .from('health_claims')
              .update({ health_adjuster_id: newAdjuster.id })
              .eq('id', healthClaim.id);

            if (updateError) {
              console.error('Failed to update health claim with adjuster:', updateError);
            }
          }
        }
      } catch (error) {
        console.error('Error creating health adjuster:', error);
      }
    }
  }

  // Create first party claims for each client who has auto insurance
  const firstPartyClaims = [];
  for (let clientIndex = 0; clientIndex < clientsData.length; clientIndex++) {
    const client = clientsData[clientIndex];
    const clientData = formData.clients[clientIndex];
    
    if (clientData && clientData.hasAutoInsurance && clientData.autoInsuranceId) {
      const realAutoInsuranceId = await processTemporaryId(clientData.autoInsuranceId, '', 'auto_insurance');
      // Skip invalid auto insurance IDs
      if (realAutoInsuranceId === null) {
        console.warn(`Skipping invalid auto insurance ID for client ${client.id}:`, clientData.autoInsuranceId);
        continue;
      }
      
      firstPartyClaims.push({
        casefile_id: casefileId,
        client_id: client.id, // Link to specific client
        auto_insurance_id: realAutoInsuranceId,
        policy_number: clientData.autoPolicyNumber || null,
        claim_number: clientData.autoClaimNumber || null,
        has_medpay: clientData.hasMedpay || false,
        medpay_amount: clientData.medpayAmount || null,
        has_um_coverage: clientData.hasUmCoverage || false,
        um_amount: clientData.umAmount || null,
        um_uim_coverage: clientData.umAmount || null, // Synchronize with um_amount
        lor_sent: false,
        loa_received: false,
        dec_sheets_received: false
      });
    }
  }

  if (firstPartyClaims.length > 0) {
    const { error: firstPartyError } = await supabase
      .from('first_party_claims')
      .insert(firstPartyClaims);

    if (firstPartyError) {
      console.warn('Failed to create first party claims:', firstPartyError);
      // Don't throw - first party claims are optional
    }
  }

  // Create all defendants (without relationships first)
  const defendantInserts = formData.defendants.map((defendant, index) => ({
    casefile_id: casefileId,
    defendant_number: index + 1,
    first_name: defendant.firstName,
    last_name: defendant.lastName,
    is_policyholder: defendant.isPolicyholder,
    policyholder_first_name: defendant.policyholderFirstName,
    policyholder_last_name: defendant.policyholderLastName,
    auto_insurance_id: defendant.autoInsuranceId,
    policy_number: defendant.policyNumber,
    liability_percentage: defendant.liabilityPercentage,
    notes: defendant.notes
  }));

  const { data: defendantsData, error: defendantsError } = await supabase
    .from('defendants')
    .insert(defendantInserts)
    .select();

  if (defendantsError) throw new Error(`Failed to create defendants: ${defendantsError.message}`);

  // Update relationships after defendants are created (so we have IDs)
  for (let i = 0; i < formData.defendants.length; i++) {
    const defendantData = formData.defendants[i];
    const defendant = defendantsData[i];

    if (defendantData.relatedToDefendantId !== null && defendantData.relatedToDefendantId !== undefined) {
      const relatedDefendant = defendantsData[defendantData.relatedToDefendantId];
      
      if (relatedDefendant) {
        const { error: updateError } = await supabase
          .from('defendants')
          .update({
            related_to_defendant_id: relatedDefendant.id,
            relationship_type: defendantData.relationshipType || ''
          })
          .eq('id', defendant.id);

        if (updateError) {
          console.warn('Failed to update defendant relationship:', updateError);
          // Don't throw - relationships are optional
        }
      }
    }
  }

  // Create third party claims for defendants with insurance
  const thirdPartyClaims = [];
  for (let index = 0; index < defendantsData.length; index++) {
    const defendant = defendantsData[index];
    const defendantData = formData.defendants[index];
    if (defendantData.autoInsuranceId) {
      const realAutoInsuranceId = await processTemporaryId(defendantData.autoInsuranceId, '', 'auto_insurance');
      // Skip invalid auto insurance IDs
      if (realAutoInsuranceId === null) {
        console.warn(`Skipping invalid auto insurance ID for defendant ${defendant.id}:`, defendantData.autoInsuranceId);
        continue;
      }
      thirdPartyClaims.push({
        defendant_id: defendant.id,
        auto_insurance_id: realAutoInsuranceId,
        claim_number: defendantData.claimNumber || null, // Use claim number from form
        lor_sent: false,
        loa_received: false
      });
    }
  }

  let createdThirdPartyClaims: any[] = [];
  if (thirdPartyClaims.length > 0) {
    const { data: thirdPartyData, error: thirdPartyError } = await supabase
      .from('third_party_claims')
      .insert(thirdPartyClaims)
      .select();

    if (thirdPartyError) throw new Error(`Failed to create third party claims: ${thirdPartyError.message}`);
    
    createdThirdPartyClaims = thirdPartyData || [];

    // Handle auto adjusters for defendants - link existing or create new
    const adjustersToLink: Array<{ adjusterId: number; claimId: number }> = [];
    const adjustersToCreate: any[] = [];
    
    for (let index = 0; index < createdThirdPartyClaims.length; index++) {
      const createdClaim = createdThirdPartyClaims[index];
      const defendantData = formData.defendants[index];
      
      // If an existing adjuster ID is provided, link it to the claim
      if (defendantData?.autoAdjusterId) {
        adjustersToLink.push({
          adjusterId: defendantData.autoAdjusterId,
          claimId: createdClaim.id
        });
      } else {
        // Otherwise, check if adjuster information is provided to create a new one
        const hasAdjusterInfo = defendantData && (
          defendantData.adjusterFirstName?.trim() ||
          defendantData.adjusterLastName?.trim() ||
          defendantData.adjusterEmail?.trim() ||
          defendantData.adjusterPhone?.trim() ||
          defendantData.adjusterMailingAddress?.trim() ||
          defendantData.adjusterCity?.trim() ||
          defendantData.adjusterState?.trim() ||
          defendantData.adjusterZipCode?.trim()
        );
        
        if (hasAdjusterInfo) {
          adjustersToCreate.push({
            third_party_claim_id: createdClaim.id,
            auto_insurance_id: createdClaim.auto_insurance_id,
            first_name: defendantData.adjusterFirstName?.trim() || null,
            last_name: defendantData.adjusterLastName?.trim() || null,
            email: defendantData.adjusterEmail?.trim() || null,
            phone: defendantData.adjusterPhone?.trim() || null,
            mailing_address: defendantData.adjusterMailingAddress?.trim() || null,
            city: defendantData.adjusterCity?.trim() || null,
            state: defendantData.adjusterState?.trim() || null,
            zip_code: defendantData.adjusterZipCode?.trim() || null
          });
        }
      }
    }

    // Link existing adjusters to third party claims
    if (adjustersToLink.length > 0) {
      for (const { adjusterId, claimId } of adjustersToLink) {
        const { error: linkError } = await supabase
          .from('auto_adjusters')
          .update({ third_party_claim_id: claimId })
          .eq('id', adjusterId);
        
        if (linkError) {
          console.error(`Failed to link adjuster ${adjusterId} to claim ${claimId}:`, linkError);
          // Log but don't throw - adjusters are optional
        }
      }
      console.log(`Successfully linked ${adjustersToLink.length} adjuster(s) to third party claims`);
    }

    // Create new adjusters
    if (adjustersToCreate.length > 0) {
      const { data: insertedAdjusters, error: adjusterError } = await supabase
        .from('auto_adjusters')
        .insert(adjustersToCreate)
        .select();

      if (adjusterError) {
        console.error('Failed to create auto adjusters:', adjusterError);
        // Log but don't throw - adjusters are optional and shouldn't block case creation
      } else if (insertedAdjusters) {
        console.log(`Successfully created ${insertedAdjusters.length} auto adjuster(s)`);
      }
    }
  }

  // Create work log entry
  const { error: workLogError } = await supabase
    .from('work_logs')
    .insert({
      casefile_id: casefileId,
      description: `Case created through intake form with ${formData.clients.length} client(s) and ${formData.defendants.length} defendant(s)`,
      user_name: 'Admin'
    });

  if (workLogError) throw new Error(`Failed to create work log: ${workLogError.message}`);

  return casefileId;
}
