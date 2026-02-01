import { useState, useEffect } from 'react';
import { supabase } from '../utils/database';

export interface CaseData {
  casefile: any;
  clients: any[];
  client: any; // Keep for backwards compatibility
  defendants: any[];
  defendant: any; // Keep for backwards compatibility
  medicalBills: any[];
  workLogs: any[];
  firstPartyClaim?: any;
  healthClaim?: any;
  thirdPartyClaim?: any;
  firstPartyClaimsByClient?: Record<number, any[]>;
  healthClaimsByClient?: Record<number, any[]>;
  thirdPartyClaimsByDefendant?: Record<number, any>;
}

export function useCaseData(caseId: string) {
  const [data, setData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: casefile, error: casefileError } = await supabase
        .from('casefiles')
        .select('*')
        .eq('id', caseId)
        .maybeSingle();

      if (casefileError) throw casefileError;
      if (!casefile) throw new Error('Case not found');

      // Update days_until_statute dynamically (recalculate on every page load)
      if (casefile.statute_deadline) {
        const deadline = new Date(casefile.statute_deadline);
        const today = new Date();
        const daysRemaining = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Update in database (async, don't block)
        supabase
          .from('casefiles')
          .update({ days_until_statute: daysRemaining })
          .eq('id', caseId)
          .then(() => console.log('Updated days_until_statute for case', caseId));
        
        // Update in memory immediately
        casefile.days_until_statute = daysRemaining;
      }

      // Load all clients for this case
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('casefile_id', caseId)
        .order('client_order');

      if (clientsError) throw clientsError;

      // Map database fields to model - preserve both snake_case and camelCase for compatibility
      const clients = clientsData?.map(client => ({
        id: client.id,
        casefileId: client.casefile_id,
        clientNumber: client.client_number,
        clientOrder: client.client_order,
        isDriver: client.is_driver,
        firstName: client.first_name,
        lastName: client.last_name,
        // Preserve snake_case for database compatibility
        first_name: client.first_name,
        last_name: client.last_name,
        middleName: client.middle_name,
        middle_name: client.middle_name,
        dateOfBirth: client.date_of_birth,
        ssn: client.ssn,
        streetAddress: client.street_address,
        city: client.city,
        state: client.state,
        zipCode: client.zip_code,
        primaryPhone: client.primary_phone,
        secondaryPhone: client.secondary_phone,
        email: client.email,
        maritalStatus: client.marital_status,
        injuryDescription: client.injury_description,
        priorAccidents: client.prior_accidents,
        priorInjuries: client.prior_injuries,
        workImpact: client.work_impact,
        referrer: client.referrer,
        referrerRelationship: client.referrer_relationship,
        hasHealthInsurance: client.has_health_insurance
      })) || [];

      // Load all defendants for this case with auto_insurance relationship
      // Try with relationship first, fallback to basic select if relationship fails
      let defendantsData: any[] | null = null;
      
      const { data: defendantsWithRelation, error: relationError } = await supabase
        .from('defendants')
        .select('*, auto_insurance:auto_insurance(*)')
        .eq('casefile_id', caseId)
        .order('defendant_number');
      
      if (relationError) {
        // If relationship query fails, try without relationship
        console.warn('Relationship query failed, trying basic select:', relationError);
        const { data: basicData, error: basicError } = await supabase
          .from('defendants')
          .select('*')
          .eq('casefile_id', caseId)
          .order('defendant_number');
        
        if (basicError) throw basicError;
        defendantsData = basicData;
      } else {
        defendantsData = defendantsWithRelation;
      }

      // Map database fields to model - preserve both snake_case and camelCase for compatibility
      const defendants = defendantsData?.map(defendant => {
        // Get auto_insurance from relationship
        let autoInsurance = defendant.auto_insurance || null;
        
        return {
          id: defendant.id,
          casefileId: defendant.casefile_id,
          defendantNumber: defendant.defendant_number,
          firstName: defendant.first_name,
          lastName: defendant.last_name,
          // Preserve snake_case for database compatibility
          first_name: defendant.first_name,
          last_name: defendant.last_name,
          isPolicyholder: defendant.is_policyholder,
          policyholderFirstName: defendant.policyholder_first_name,
          policyholderLastName: defendant.policyholder_last_name,
          autoInsuranceId: defendant.auto_insurance_id,
          auto_insurance_id: defendant.auto_insurance_id,
          policyNumber: defendant.policy_number,
          policy_number: defendant.policy_number,
          liabilityPercentage: defendant.liability_percentage,
          liability_percentage: defendant.liability_percentage,
          notes: defendant.notes,
          relatedToDefendantId: defendant.related_to_defendant_id,
          relationshipType: defendant.relationship_type,
          // Include auto_insurance relationship
          autoInsurance: autoInsurance,
          auto_insurance: autoInsurance
        };
      }) || [];
      
      // If auto_insurance relationship is null, try to fetch from auto_insurance_complete
      // Do this in parallel for all defendants to avoid blocking
      try {
        const insuranceFetchPromises = defendants
          .filter(defendant => !defendant.autoInsurance && defendant.auto_insurance_id)
          .map(async (defendant) => {
            try {
              const { data: insuranceData } = await supabase
                .from('auto_insurance_complete')
                .select('id, name, phone, city, state')
                .eq('id', defendant.auto_insurance_id)
                .maybeSingle();
              if (insuranceData) {
                defendant.autoInsurance = insuranceData;
                defendant.auto_insurance = insuranceData;
              }
            } catch (err) {
              console.warn(`Failed to fetch insurance for defendant ${defendant.id}:`, err);
              // Don't throw - continue with other defendants
            }
          });
        await Promise.all(insuranceFetchPromises);
      } catch (err) {
        console.warn('Error fetching insurance data for defendants:', err);
        // Don't throw - continue with data loading
      }

      // For backwards compatibility, get the first client
      const client = clients && clients.length > 0 ? clients[0] : null;
      const defendant = defendants && defendants.length > 0 ? defendants[0] : null;

      let medicalBills: any[] = [];
      if (clients && clients.length > 0) {
        // Load medical bills for all clients with client data
        const { data: bills, error: billsError } = await supabase
          .from('medical_bills')
          .select(`
            *,
            medical_provider:medical_providers(*),
            client:clients(id, first_name, last_name)
          `)
          .in('client_id', clients.map(c => c.id));

        if (billsError) throw billsError;
        // Map client data to camelCase for consistency
        medicalBills = (bills || []).map(bill => ({
          ...bill,
          client: bill.client ? {
            id: bill.client.id,
            firstName: bill.client.first_name || '',
            lastName: bill.client.last_name || '',
            first_name: bill.client.first_name,
            last_name: bill.client.last_name
          } : null
        }));
      }

      const { data: workLogs, error: logsError } = await supabase
        .from('work_logs')
        .select('*')
        .eq('casefile_id', caseId)
        .order('timestamp', { ascending: false });

      if (logsError) throw logsError;

      console.log('useCaseData - Fetched work logs:', workLogs);
      console.log('useCaseData - Work logs count:', workLogs?.length);

      // Fetch first party claim with auto_insurance relationship
      const { data: firstPartyClaim, error: firstPartyClaimError } = await supabase
        .from('first_party_claims')
        .select('*, auto_insurance:auto_insurance(*)')
        .eq('casefile_id', caseId)
        .maybeSingle();

      if (firstPartyClaimError && !firstPartyClaimError.message.includes('does not exist')) {
        console.warn('Error fetching first party claim:', firstPartyClaimError);
      }

      const { data: healthClaim } = client ? await supabase
        .from('health_claims')
        .select('*, health_insurance:health_insurance(*)')
        .eq('client_id', client.id)
        .maybeSingle() : { data: null };

      const { data: thirdPartyClaim } = defendant ? await supabase
        .from('third_party_claims')
        .select('*, auto_insurance:auto_insurance(*)')
        .eq('defendant_id', defendant.id)
        .maybeSingle() : { data: null };

      // Fetch ALL third party claims for all defendants (for per-defendant display)
      const defendantIds = defendants.map((d: any) => d.id);
      const { data: allThirdPartyClaims, error: thirdPartyError } = defendantIds.length > 0 ? await supabase
        .from('third_party_claims')
        .select('*, auto_insurance:auto_insurance(*)')
        .in('defendant_id', defendantIds) : { data: [] };
      
      if (thirdPartyError) {
        console.warn('Error fetching third party claims:', thirdPartyError);
      }
      
      // If auto_insurance relationship is null, try to fetch from auto_insurance_complete
      if (allThirdPartyClaims && allThirdPartyClaims.length > 0) {
        try {
          const insuranceFetchPromises = allThirdPartyClaims
            .filter(claim => !claim.auto_insurance && claim.auto_insurance_id)
            .map(async (claim) => {
              try {
                const { data: insuranceData } = await supabase
                  .from('auto_insurance_complete')
                  .select('id, name, phone, city, state')
                  .eq('id', claim.auto_insurance_id)
                  .maybeSingle();
                if (insuranceData) {
                  claim.auto_insurance = insuranceData;
                }
              } catch (err) {
                console.warn(`Failed to fetch insurance for claim ${claim.id}:`, err);
                // Don't throw - continue with other claims
              }
            });
          await Promise.all(insuranceFetchPromises);
        } catch (err) {
          console.warn('Error fetching insurance data for third party claims:', err);
          // Don't throw - continue with data loading
        }
      }

      // Group third party claims by defendant_id
      const thirdPartyClaimsByDefendant: Record<number, any> = {};
      if (allThirdPartyClaims) {
        allThirdPartyClaims.forEach((claim: any) => {
          if (claim.defendant_id) {
            thirdPartyClaimsByDefendant[claim.defendant_id] = claim;
          }
        });
      }

      // Fetch auto adjusters for third party claims
      const thirdPartyClaimIds = allThirdPartyClaims?.map((c: any) => c.id).filter(Boolean) || [];
      if (thirdPartyClaimIds.length > 0) {
        const { data: adjustersData, error: adjustersError } = await supabase
          .from('auto_adjusters')
          .select('*')
          .in('third_party_claim_id', thirdPartyClaimIds);
        
        if (adjustersError) {
          console.warn('Error fetching adjusters for third party claims:', adjustersError);
        } else if (adjustersData && adjustersData.length > 0) {
          // Associate adjusters with their claims
          adjustersData.forEach((adjuster: any) => {
            const claimDefendantId = Object.keys(thirdPartyClaimsByDefendant).find(
              defId => thirdPartyClaimsByDefendant[parseInt(defId)]?.id === adjuster.third_party_claim_id
            );
            if (claimDefendantId) {
              const claim = thirdPartyClaimsByDefendant[parseInt(claimDefendantId)];
              if (claim) {
                // Build adjuster name if not set
                if (!claim.adjuster_name && (adjuster.first_name || adjuster.last_name)) {
                  claim.adjuster_name = [adjuster.first_name, adjuster.last_name].filter(Boolean).join(' ');
                }
                // Also store full adjuster data
                if (!claim.adjusters) claim.adjusters = [];
                claim.adjusters.push({
                  id: adjuster.id,
                  firstName: adjuster.first_name,
                  lastName: adjuster.last_name,
                  email: adjuster.email,
                  phone: adjuster.phone,
                  fax: adjuster.fax,
                  mailingAddress: adjuster.mailing_address || adjuster.street_address,
                  city: adjuster.city,
                  state: adjuster.state,
                  zipCode: adjuster.zip_code
                });
              }
            }
          });
        }
      }

      // Also fetch auto adjusters by auto_insurance_id for defendants
      const autoInsuranceIds = defendants.map((d: any) => d.auto_insurance_id).filter(Boolean);
      if (autoInsuranceIds.length > 0) {
        const { data: insuranceAdjusters, error: insAdjError } = await supabase
          .from('auto_adjusters')
          .select('*')
          .in('auto_insurance_id', autoInsuranceIds);
        
        if (insAdjError) {
          console.warn('Error fetching adjusters by insurance:', insAdjError);
        } else if (insuranceAdjusters && insuranceAdjusters.length > 0) {
          // Associate adjusters with defendants via auto_insurance_id
          defendants.forEach((defendant: any) => {
            const defAdjusters = insuranceAdjusters.filter(
              (adj: any) => adj.auto_insurance_id === defendant.auto_insurance_id
            );
            if (defAdjusters.length > 0) {
              // Map adjusters to camelCase format
              const mappedAdjusters = defAdjusters.map((adj: any) => ({
                id: adj.id,
                firstName: adj.first_name,
                lastName: adj.last_name,
                email: adj.email,
                phone: adj.phone,
                fax: adj.fax,
                mailingAddress: adj.mailing_address || adj.street_address,
                city: adj.city,
                state: adj.state,
                zipCode: adj.zip_code
              }));
              
              // Merge with existing adjusters (from third_party_claim_id) to avoid duplicates
              const existingAdjusterIds = (defendant.autoAdjusters || []).map((a: any) => a.id);
              const newAdjusters = mappedAdjusters.filter((adj: any) => !existingAdjusterIds.includes(adj.id));
              defendant.autoAdjusters = [...(defendant.autoAdjusters || []), ...newAdjusters];
              
              // Also add adjusters to the third party claim if it exists
              const claim = thirdPartyClaimsByDefendant[defendant.id];
              if (claim) {
                // Merge adjusters into claim.adjusters, avoiding duplicates
                const claimAdjusterIds = (claim.adjusters || []).map((a: any) => a.id);
                const claimNewAdjusters = mappedAdjusters.filter((adj: any) => !claimAdjusterIds.includes(adj.id));
                if (!claim.adjusters) claim.adjusters = [];
                claim.adjusters.push(...claimNewAdjusters);
                
                // Update adjuster_name if not set
                if (!claim.adjuster_name && defAdjusters.length > 0) {
                  const firstAdj = defAdjusters[0];
                  claim.adjuster_name = [firstAdj.first_name, firstAdj.last_name].filter(Boolean).join(' ');
                }
              }
            }
          });
        }
      }
      
      // Also ensure adjusters linked to third party claims appear for defendants
      // This handles the reverse direction - adjusters from claims should appear for defendants
      Object.keys(thirdPartyClaimsByDefendant).forEach((defendantIdStr) => {
        const defendantId = parseInt(defendantIdStr);
        const claim = thirdPartyClaimsByDefendant[defendantId];
        const defendant = defendants.find((d: any) => d.id === defendantId);
        
        if (claim && claim.adjusters && claim.adjusters.length > 0 && defendant) {
          // Merge claim adjusters into defendant adjusters, avoiding duplicates
          const existingDefAdjusterIds = (defendant.autoAdjusters || []).map((a: any) => a.id);
          const newDefAdjusters = claim.adjusters.filter((adj: any) => !existingDefAdjusterIds.includes(adj.id));
          if (newDefAdjusters.length > 0) {
            if (!defendant.autoAdjusters) defendant.autoAdjusters = [];
            defendant.autoAdjusters.push(...newDefAdjusters);
          }
        }
      });

      // Fetch ALL first party claims for all clients (for per-client display)
      const { data: allFirstPartyClaims, error: firstPartyError } = await supabase
        .from('first_party_claims')
        .select('*, auto_insurance:auto_insurance(*)')
        .eq('casefile_id', caseId);
      
      if (firstPartyError) {
        console.warn('Error fetching first party claims:', firstPartyError);
      }
      
      // If auto_insurance relationship is null, try to fetch from auto_insurance_complete
      if (allFirstPartyClaims && allFirstPartyClaims.length > 0) {
        try {
          const insuranceFetchPromises = allFirstPartyClaims
            .filter(claim => !claim.auto_insurance && claim.auto_insurance_id)
            .map(async (claim) => {
              try {
                const { data: insuranceData } = await supabase
                  .from('auto_insurance_complete')
                  .select('id, name, phone, city, state')
                  .eq('id', claim.auto_insurance_id)
                  .maybeSingle();
                if (insuranceData) {
                  claim.auto_insurance = insuranceData;
                }
              } catch (err) {
                console.warn(`Failed to fetch insurance for first party claim ${claim.id}:`, err);
                // Don't throw - continue with other claims
              }
            });
          await Promise.all(insuranceFetchPromises);
        } catch (err) {
          console.warn('Error fetching insurance data for first party claims:', err);
          // Don't throw - continue with data loading
        }
      }

      // Group first party claims by client_id
      const firstPartyClaimsByClient: Record<number, any[]> = {};
      if (allFirstPartyClaims) {
        allFirstPartyClaims.forEach((claim: any) => {
          const clientId = claim.client_id || clients[0]?.id; // Fallback to first client if no client_id
          if (clientId) {
            if (!firstPartyClaimsByClient[clientId]) {
              firstPartyClaimsByClient[clientId] = [];
            }
            firstPartyClaimsByClient[clientId].push(claim);
          }
        });
      }

      // Fetch ALL health claims for all clients with adjuster info
      const clientIds = clients.map((c: any) => c.id);
      const { data: allHealthClaims } = clientIds.length > 0 ? await supabase
        .from('health_claims')
        .select('*, health_insurance:health_insurance(*), health_adjuster:health_adjusters(*)')
        .in('client_id', clientIds) : { data: [] };

      // Group health claims by client_id
      const healthClaimsByClient: Record<number, any[]> = {};
      if (allHealthClaims) {
        allHealthClaims.forEach((claim: any) => {
          if (claim.client_id) {
            if (!healthClaimsByClient[claim.client_id]) {
              healthClaimsByClient[claim.client_id] = [];
            }
            healthClaimsByClient[claim.client_id].push(claim);
          }
        });
      }

      setData({
        casefile,
        clients: clients || [],
        client, // Backwards compatibility
        defendants: defendants || [],
        defendant, // Backwards compatibility
        medicalBills: medicalBills || [],
        workLogs: workLogs || [],
        firstPartyClaim,
        healthClaim,
        thirdPartyClaim,
        firstPartyClaimsByClient,
        healthClaimsByClient,
        thirdPartyClaimsByDefendant
      });
    } catch (err) {
      console.error('Error fetching case data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load case data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchCaseData();
    }
  }, [caseId]);

  return { data, loading, error, refetch: fetchCaseData };
}
