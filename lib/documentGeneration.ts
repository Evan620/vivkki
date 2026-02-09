// Document Generation Utilities
// Handles payload preparation and n8n webhook integration

import { supabase } from '@/lib/supabaseClient';
import { formatDate, formatSSN, formatCurrency, getRecipientEmail, generateCaseName } from '@/lib/utils/documentHelpers';
import { DOCUMENT_STAGE_MAP, DOCUMENT_STATUS_MAP } from '@/lib/config/documentTemplates';
import type { GenerationType } from '@/lib/config/documentTemplates';

export interface CaseData {
  casefile: any;
  client?: any;
  defendant?: any;
  medicalBills: any[];
  workLogs: any[];
  firstPartyClaim?: any;
  healthClaim?: any;
  thirdPartyClaim?: any;
}

export interface DocumentPayload {
  [key: string]: any;
}

/**
 * Prepare comprehensive document payload for n8n webhook
 */
export async function prepareDocumentPayload(
  casefileId: number,
  templateType: string,
  caseData: CaseData,
  clients: any[],
  specificProviderId?: number,
  selectedParty?: 'first' | 'third'
): Promise<DocumentPayload> {
  const { casefile, client, defendant, medicalBills, firstPartyClaim, thirdPartyClaim } = caseData;

  // Filter medical providers if specific provider is requested
  let relevantProviders = medicalBills;
  if (specificProviderId) {
    relevantProviders = medicalBills.filter(bill => bill.medical_provider_id === specificProviderId);
  }

  const currentDate = new Date();
  const fullDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Build complete payload with ALL data - let n8n decide what to use
  let payload: DocumentPayload = {
    template_type: templateType,
    case_id: casefileId,
    case_number: `Case #${casefileId}`,
    fullDate: fullDate,
    requestDate: fullDate,
    '$$fullDate': fullDate,
    '$$requestDate': fullDate,

    // Law Firm Info (always included)
    'LawFirm::name': 'The Cotton Law Firm, PLLC',
    'LawFirm::attorney': 'Eric D. Cotton',
    'LawFirm::processingCompany': 'PI Associates LLC',
    'LawFirm::mailingAddress': 'P.O. Box 890070',
    'LawFirm::city': 'Oklahoma City',
    'LawFirm::state': 'OK',
    'LawFirm::zip': '73189',
    'LawFirm::phone': '1-877-299-8393',
    'LawFirm::fax': '1-877-299-8393',
    'LawFirm::email': 'admin@injuryok.com',
    'LawFirm::logoUrl': 'https://via.placeholder.com/150x150.png?text=Logo',

    // Client Info (always included) - Handle both camelCase and snake_case
    'Client::fullName': `${client?.firstName || client?.first_name || ''} ${client?.middleName || client?.middle_name || ''} ${client?.lastName || client?.last_name || ''}`.trim(),
    'Client::firstName': client?.firstName || client?.first_name || 'N/A',
    'Client::middleName': client?.middleName || client?.middle_name || '',
    'Client::lastName': client?.lastName || client?.last_name || 'N/A',
    'Client::dateOfBirth': formatDate(client?.dateOfBirth || client?.date_of_birth),
    'Client::socialSecurityNumber': formatSSN(client?.ssn),
    'Client::streetAddress': client?.streetAddress || client?.street_address || 'N/A',
    'Client::city': client?.city || 'N/A',
    'Client::state': client?.state || 'OK',
    'Client::zip': client?.zipCode || client?.zip_code || client?.zip || 'N/A',
    'Client::phone': client?.primaryPhone || client?.primary_phone || client?.phone || 'N/A',
    'Client::secondaryPhone': client?.secondaryPhone || client?.secondary_phone || 'N/A',
    'Client::email': client?.email || 'N/A',
    'Client::isDriver': (client?.isDriver || client?.is_driver) ? 'Yes' : 'No',
    'Client::maritalStatus': client?.maritalStatus || client?.marital_status || 'N/A',
    'Client::injuryDescription': client?.injuryDescription || client?.injury_description || 'N/A',

    // Wreck Info (always included)
    'Wreck::date': formatDate(casefile?.date_of_loss),
    'Wreck::time': casefile?.time_of_wreck || 'N/A',
    'Wreck::type': casefile?.wreck_type || 'N/A',
    'Wreck::location': casefile?.wreck_street || 'N/A',
    'Wreck::city': casefile?.wreck_city || 'N/A',
    'Wreck::state': casefile?.wreck_state || 'OK',
    'Wreck::county': casefile?.wreck_county || 'N/A',
    'Wreck::policeReport': casefile?.police_report_number || 'N/A',
    'Wreck::description': casefile?.wreck_description || 'N/A',

    // Defendant Info (always included)
    'Defendant::fullName': `${defendant?.firstName || defendant?.first_name || ''} ${defendant?.lastName || defendant?.last_name || ''}`.trim() || 'N/A',
    'Defendant::firstName': defendant?.firstName || defendant?.first_name || 'N/A',
    'Defendant::lastName': defendant?.lastName || defendant?.last_name || 'N/A',
    'Defendant::isPolicyholder': (defendant?.isPolicyholder || defendant?.is_policyholder) ? 'Yes' : 'No',
    'Defendant::policyholderName': (defendant?.isPolicyholder || defendant?.is_policyholder)
      ? `${defendant?.firstName || defendant?.first_name || ''} ${defendant?.lastName || defendant?.last_name || ''}`.trim()
      : `${defendant?.policyholderFirstName || defendant?.policyholder_first_name || ''} ${defendant?.policyholderLastName || defendant?.policyholder_last_name || ''}`.trim() || 'N/A',

    // First Party Claim Info
    'ClientsAutoInsurer::name': firstPartyClaim?.auto_insurance?.name || 'N/A',
    'ClientsClaim::claimNumber': firstPartyClaim?.claim_number || 'N/A',
    'ClientsAdjuster::fullName': firstPartyClaim?.adjuster_name || firstPartyClaim?.auto_adjusters?.[0] ? `${firstPartyClaim.auto_adjusters[0].first_name} ${firstPartyClaim.auto_adjusters[0].last_name}` : 'N/A',
    'ClientsAdjuster::phone': firstPartyClaim?.adjuster_phone || firstPartyClaim?.auto_adjusters?.[0]?.phone || 'N/A',
    'ClientsAdjuster::email': firstPartyClaim?.adjuster_email || firstPartyClaim?.auto_adjusters?.[0]?.email || 'N/A',
    'ClientsAdjuster::fax': firstPartyClaim?.adjuster_fax || firstPartyClaim?.auto_adjusters?.[0]?.fax || 'N/A',
    'FirstParty::carrier': firstPartyClaim?.auto_insurance?.name || 'N/A',
    'FirstParty::claimNumber': firstPartyClaim?.claim_number || 'N/A',
    'FirstParty::adjuster': firstPartyClaim?.adjuster_name || firstPartyClaim?.auto_adjusters?.[0] ? `${firstPartyClaim.auto_adjusters[0].first_name} ${firstPartyClaim.auto_adjusters[0].last_name}` : 'N/A',
    'FirstParty::adjusterPhone': firstPartyClaim?.adjuster_phone || firstPartyClaim?.auto_adjusters?.[0]?.phone || 'N/A',
    'FirstParty::adjusterEmail': firstPartyClaim?.adjuster_email || firstPartyClaim?.auto_adjusters?.[0]?.email || 'N/A',
    'FirstParty::adjusterFax': firstPartyClaim?.adjuster_fax || firstPartyClaim?.auto_adjusters?.[0]?.fax || 'N/A',
    'FirstParty::policyNumber': firstPartyClaim?.policy_number || 'N/A',
    'FirstParty::policyLimits': firstPartyClaim?.policy_limits || 'N/A',

    // Third Party Claim Info
    'DefendantsAutoInsurer::name': thirdPartyClaim?.auto_insurance?.name || 'N/A',
    'DefendantsClaim::claimNumber': thirdPartyClaim?.claim_number || 'N/A',
    'DefendantsAdjuster::fullName': thirdPartyClaim?.adjuster_name || thirdPartyClaim?.auto_adjusters?.[0] ? `${thirdPartyClaim.auto_adjusters[0].first_name} ${thirdPartyClaim.auto_adjusters[0].last_name}` : 'N/A',
    'DefendantsAdjuster::phone': thirdPartyClaim?.adjuster_phone || thirdPartyClaim?.auto_adjusters?.[0]?.phone || 'N/A',
    'DefendantsAdjuster::email': thirdPartyClaim?.adjuster_email || thirdPartyClaim?.auto_adjusters?.[0]?.email || 'N/A',
    'DefendantsAdjuster::fax': thirdPartyClaim?.adjuster_fax || thirdPartyClaim?.auto_adjusters?.[0]?.fax || 'N/A',
    'ThirdParty::carrier': thirdPartyClaim?.auto_insurance?.name || 'N/A',
    'ThirdParty::claimNumber': thirdPartyClaim?.claim_number || 'N/A',
    'ThirdParty::adjuster': thirdPartyClaim?.adjuster_name || thirdPartyClaim?.auto_adjusters?.[0] ? `${thirdPartyClaim.auto_adjusters[0].first_name} ${thirdPartyClaim.auto_adjusters[0].last_name}` : 'N/A',
    'ThirdParty::adjusterPhone': thirdPartyClaim?.adjuster_phone || thirdPartyClaim?.auto_adjusters?.[0]?.phone || 'N/A',
    'ThirdParty::adjusterEmail': thirdPartyClaim?.adjuster_email || thirdPartyClaim?.auto_adjusters?.[0]?.email || 'N/A',
    'ThirdParty::adjusterFax': thirdPartyClaim?.adjuster_fax || thirdPartyClaim?.auto_adjusters?.[0]?.fax || 'N/A',
    'ThirdParty::policyNumber': thirdPartyClaim?.policy_number || 'N/A',
    'ThirdParty::policyLimits': thirdPartyClaim?.policy_limits || 'N/A',
    'adjuster_street_address': thirdPartyClaim?.adjuster_address || firstPartyClaim?.adjuster_address || 'N/A',
    'adjuster_city': thirdPartyClaim?.adjuster_city || firstPartyClaim?.adjuster_city || 'Oklahoma City',
    'adjuster_state': thirdPartyClaim?.adjuster_state || firstPartyClaim?.adjuster_state || 'OK',
    'adjuster_zip_code': thirdPartyClaim?.adjuster_zip || firstPartyClaim?.adjuster_zip || '73102',

    // Medical Provider Info
    'MedicalProvider::name': relevantProviders?.[0]?.medical_provider?.name || relevantProviders?.[0]?.medical_provider?.provider_name || 'N/A',
    'MedicalProvider::streetAddress': relevantProviders?.[0]?.medical_provider?.address || relevantProviders?.[0]?.medical_provider?.street_address || 'N/A',
    'MedicalProvider::city': relevantProviders?.[0]?.medical_provider?.city || 'Oklahoma City',
    'MedicalProvider::state': relevantProviders?.[0]?.medical_provider?.state || 'Oklahoma',
    'MedicalProvider::zip': relevantProviders?.[0]?.medical_provider?.zip || relevantProviders?.[0]?.medical_provider?.zip_code || '73102',
    'MedicalProvider::phone': relevantProviders?.[0]?.medical_provider?.phone || 'N/A',
    'MedicalProvider::fax': relevantProviders?.[0]?.medical_provider?.fax || 'N/A',
  };

  // Add date helpers
  Object.assign(payload, {
    'current_date': fullDate,
    'current_day': String(currentDate.getDate()),
    'current_month': currentDate.toLocaleDateString('en-US', { month: 'long' }),
    'current_year': String(currentDate.getFullYear()),
    'date_of_loss': formatDate(casefile?.date_of_loss),
    
    // Additional wreck fields
    'wreck_street': casefile?.wreck_street || '',
    'wreck_city': casefile?.wreck_city || '',
    'wreck_state': casefile?.wreck_state || '',
    'wreck_county': casefile?.wreck_county || '',
    'wreck_type': casefile?.wreck_type || '',
    'wreck_description': casefile?.wreck_description || '',
    'police_report_number': casefile?.police_report_number || '',
    'vehicle_description': casefile?.vehicle_description || '',
    'damage_level': casefile?.damage_level || '',
    'wreck_notes': casefile?.wreck_notes || '',
    
    // Client aliases
    'client_list': '',
    'client.list': '',
    'client.fullName': payload['Client::fullName'],
    'client_full_name': payload['Client::fullName'],
    'client.dob': payload['Client::dateOfBirth'],
    'client_dob': payload['Client::dateOfBirth'],
    
    // Defendant aliases
    'defendant.full_name': payload['Defendant::fullName'],
    'defendant_full_name': payload['Defendant::fullName'],
    
    // First Party aliases
    'Clients_AutoInsurer::name': payload['ClientsAutoInsurer::name'],
    'Clients_Claim::claimNumber': payload['ClientsClaim::claimNumber'],
    'Clients_Adjuster::fullName': payload['ClientsAdjuster::fullName'],
    'Clients_Adjuster::phone': payload['ClientsAdjuster::phone'],
    'Clients_Adjuster::email': payload['ClientsAdjuster::email'],
    'Clients_Adjuster::fax': payload['ClientsAdjuster::fax'],
    
    // Third Party aliases
    'Defendants_AutoInsurer::name': payload['DefendantsAutoInsurer::name'],
    'Defendants_Claim::claimNumber': payload['DefendantsClaim::claimNumber'],
    'Defendants_Adjuster::fullName': payload['DefendantsAdjuster::fullName'],
    'Defendants_Adjuster::phone': payload['DefendantsAdjuster::phone'],
    'Defendants_Adjuster::email': payload['DefendantsAdjuster::email'],
    'Defendants_Adjuster::fax': payload['DefendantsAdjuster::fax'],
    'auto_insurance.name': thirdPartyClaim?.auto_insurance?.name || firstPartyClaim?.auto_insurance?.name || '',
    'claim_number': thirdPartyClaim?.claim_number || '',
    'adjuster_full_name': thirdPartyClaim?.adjuster_name || firstPartyClaim?.adjuster_name || '',
    'adjuster_fax': thirdPartyClaim?.adjuster_fax || firstPartyClaim?.adjuster_fax || '',
    'adjuster_email': thirdPartyClaim?.adjuster_email || firstPartyClaim?.adjuster_email || '',
    'first_party_adjuster_fax': firstPartyClaim?.adjuster_fax || '',
    'first_party_adjuster_email': firstPartyClaim?.adjuster_email || '',
    'third_party_adjuster_fax': thirdPartyClaim?.adjuster_fax || '',
    'third_party_adjuster_email': thirdPartyClaim?.adjuster_email || '',
    
    // Medical Provider aliases
    'MedicalProvider::type': relevantProviders?.[0]?.service_type || '',
    'medical_provider.name': payload['MedicalProvider::name'],
    'medical_provider_name': payload['MedicalProvider::name'],
    'medical_provider_street_address': payload['MedicalProvider::streetAddress'],
    'medical_provider_city': payload['MedicalProvider::city'],
    'medical_provider_state': payload['MedicalProvider::state'],
    'medical_provider_zip_code': payload['MedicalProvider::zip'],
    'medical_provider.list': '',
    'medical_provider_list': '',
    'medical_bills_table': '',
    'MedicalProvider::requestMethod': '',
    
    // Financial fields - start with zeros
    'total_billed': 0,
    'insurance_paid': 0,
    'insurance_adjusted': 0,
    'mp_paid': 0,
    'patient_paid': 0,
    'reduction_amount': 0,
    'expense': 0,
    'total_medical_bills': 0,
    'medical_total': 0,
    '$total_due': 0,
    
    // General damages
    'general_damages_emotional_distress': 0,
    'general_damages_duties_under_duress': 0,
    'general_damages_pain_and_suffering': 0,
    'general_damages_loss_of_enjoyment': 0,
    'general_damages_loss_of_consortium': 0,
    'Emotional Distress': 0,
    'Duties Under Duress': 0,
    'Pain and Suffering': 0,
    'Loss of Enjoyment of Life': 0,
    'Loss of Consortium': 0,
    'general_damages_table': '',
    'total_general_damages': 0,
    'general_damages_total': 0,
    'Total amount of general damages': 0,
    
    // Mileage
    'mileage_total': 0,
    'mileage_amount': 0,
    'Mileage': 0,
    
    // Special damages and totals
    'special_damages_total': 0,
    'total_special_damages': 0,
    'Total amount of specials': 0,
    'total_damages': 0,
    'TOTAL DAMAGES': 0,
    
    // Settlement
    'settlement_amount': 0,
    'settlement_amount_formatted': 0,
    'settlement_offer_amount': 0,
    'attorney_fee': 0,
    'attorney_fee_formatted': 0,
    'case_expenses': 0,
    'case_expenses_formatted': 0,
    'client_net_amount': 0,
    'client_net_amount_formatted': 0,
    
    // Third party claim aliases
    'third_party_claim_auto_insurance_name': thirdPartyClaim?.auto_insurance?.name || '',
    'third_party_claim.auto_insurance.name': thirdPartyClaim?.auto_insurance?.name || '',
    'third_party_claim_claim_number': thirdPartyClaim?.claim_number || '',
    'third_party_claim.claim_number': thirdPartyClaim?.claim_number || '',
    
    // Health insurance
    'health_insurance_name': '',
    'health_claim.health_insurance.name': '',
    'health_claim_member_id': '',
    'health_claim.member_id': '',
    'health_adjuster_email': '',
    'health_claim.health_adjuster.email': '',
    'health_claim.health_adjuster.fax': '',
    
    // Other fields
    'statute_of_limitations_date': casefile?.statute_deadline ? formatDate(casefile.statute_deadline) : '',
    'county_name': casefile?.wreck_county || '',
  });

  // Calculate statute date (2 years after accident)
  let statuteDateTwoYears = '';
  if (casefile?.date_of_loss) {
    try {
      const accidentDate = new Date(casefile.date_of_loss);
      if (!isNaN(accidentDate.getTime())) {
        accidentDate.setFullYear(accidentDate.getFullYear() + 2);
        statuteDateTwoYears = formatDate(accidentDate.toISOString().split('T')[0]);
      }
    } catch (e) {
      console.warn('Failed to calculate 2 years after accident date:', e);
    }
  }

  Object.assign(payload, {
    'statute_date_2_years': statuteDateTwoYears,
    'statute_date_two_years': statuteDateTwoYears,
    'statute_of_limitations_date_2_years': statuteDateTwoYears,
    'statute_of_limitations_2_years': statuteDateTwoYears,
    'accident_date_plus_2_years': statuteDateTwoYears,
    'date_2_years_after_accident': statuteDateTwoYears,
    '2_years_after_accident': statuteDateTwoYears,
    'Statute Date (2 Years)': statuteDateTwoYears,
    'Statute Deadline (Auto)': statuteDateTwoYears,
  });

  // Populate health insurance from health claim
  if (caseData.healthClaim) {
    const healthClaim = caseData.healthClaim;
    const healthInsName = healthClaim?.health_insurance?.name || '';
    const memberId = healthClaim?.member_id || '';
    const adjEmail = healthClaim?.health_adjuster?.email || healthClaim?.health_adjusters?.[0]?.email || '';
    const adjFax = healthClaim?.health_adjuster?.fax || healthClaim?.health_adjusters?.[0]?.fax || '';
    Object.assign(payload, {
      'health_insurance_name': healthInsName,
      'health_claim.health_insurance.name': healthInsName,
      'health_claim_member_id': memberId,
      'health_claim.member_id': memberId,
      'health_adjuster_email': adjEmail,
      'health_claim.health_adjuster.email': adjEmail,
      'health_claim.health_adjuster.fax': adjFax,
    });
    if (healthClaim?.health_insurance) {
      const hi = healthClaim.health_insurance;
      payload['health_insurance_fax'] = hi.fax_1 || hi.fax || '';
      payload['health_insurance_email'] = hi.email_1 || hi.email || '';
    }
  }

  // Build client list
  try {
    const clientFullNames = (clients || [])
      .map((c) => `${(c.firstName || c.first_name || '').toString().trim()} ${(c.lastName || c.last_name || '').toString().trim()}`.trim())
      .filter((n) => n && n !== '' && n !== 'N/A');
    const clientList = clientFullNames.join(', ');
    payload['client.list'] = clientList;
    payload['client_list'] = clientList;
    payload['Client::list'] = clientList;
  } catch (e) {
    console.warn('Failed building client.list', e);
  }

  // Build medical providers list
  try {
    const usedProviders = medicalBills
      .map(bill => bill.medical_provider)
      .filter(Boolean)
      .filter((provider, index, self) => 
        index === self.findIndex(p => p?.id === provider?.id)
      );
    payload.providers_catalog = usedProviders;
    const providerListString = usedProviders
      .map((p: any) => p?.name || p?.provider_name || 'Unknown')
      .filter(Boolean)
      .join('\n');
    payload['medical_provider.list'] = providerListString;
    payload['medical_provider_list'] = providerListString;
  } catch (e) {
    console.warn('Failed to filter medical providers', e);
    payload.providers_catalog = [];
  }

  // Build auto insurance list
  try {
    const autoInsurers: any[] = [];
    if (firstPartyClaim?.auto_insurance) {
      autoInsurers.push(firstPartyClaim.auto_insurance);
    }
    if (thirdPartyClaim?.auto_insurance) {
      const existing = autoInsurers.find(a => a?.id === thirdPartyClaim.auto_insurance?.id);
      if (!existing) {
        autoInsurers.push(thirdPartyClaim.auto_insurance);
      }
    }
    payload.auto_insurance_list = autoInsurers;
  } catch (e) {
    console.warn('Failed to build auto insurance list', e);
    payload.auto_insurance_list = [];
  }

  // Build health insurance list
  try {
    const clientIds = clients.map(c => c.id);
    const { data: allHealthClaims } = await supabase
      .from('health_claims')
      .select('*, health_insurance:health_insurance(*)')
      .in('client_id', clientIds);

    const healthInsurers = (allHealthClaims || [])
      .map(claim => claim.health_insurance)
      .filter(Boolean)
      .filter((insurer, index, self) => 
        index === self.findIndex(i => i?.id === insurer?.id)
      );
    payload.health_insurance_list = healthInsurers;
  } catch (e) {
    console.warn('Failed to build health insurance list', e);
    payload.health_insurance_list = [];
  }

  // Fetch comprehensive data (general damages, mileage, medical bills, settlement)
  try {
    // Fetch general damages
    const { data: generalDamages } = await supabase
      .from('general_damages')
      .select('*')
      .eq('casefile_id', casefileId)
      .maybeSingle();

    // Fetch mileage log
    const { data: mileageLogs } = await supabase
      .from('mileage_log')
      .select('*')
      .eq('casefile_id', casefileId);

    const mileageTotal = mileageLogs?.reduce((sum, log) => sum + (log.total || 0), 0) || 0;

    // Calculate medical bill financials
    const totalBilled = medicalBills.reduce((sum, bill) => sum + (bill.amount_billed || bill.total_billed || 0), 0);
    const totalInsurancePaid = medicalBills.reduce((sum, bill) => sum + (bill.insurance_paid || 0), 0);
    const totalInsuranceAdjusted = medicalBills.reduce((sum, bill) => sum + (bill.insurance_adjusted || 0), 0);
    const totalMedpayPaid = medicalBills.reduce((sum, bill) => sum + (bill.medpay_paid || 0), 0);
    const totalPatientPaid = medicalBills.reduce((sum, bill) => sum + (bill.patient_paid || 0), 0);
    const totalReduction = medicalBills.reduce((sum, bill) => sum + (bill.reduction_amount || 0), 0);
    const totalExpense = medicalBills.reduce((sum, bill) => sum + (bill.pi_expense || 0), 0);
    const totalBalanceDue = medicalBills.reduce((sum, bill) => sum + (bill.balance_due || 0), 0);
    
    // Build medical bills table
    const medicalBillsTable = medicalBills.map(bill => {
      const providerName = bill.medical_provider?.name || bill.medical_provider?.provider_name || 'Unknown';
      const amount = bill.amount_billed || bill.total_billed || 0;
      return `${providerName}\t$${amount.toFixed(2)}`;
    }).join('\n');
    
    // Populate general damages
    const emotionalDistress = generalDamages?.emotional_distress || 0;
    const dutiesUnderDuress = generalDamages?.duties_under_duress || 0;
    const painAndSuffering = generalDamages?.pain_and_suffering || 0;
    const lossOfEnjoyment = generalDamages?.loss_of_enjoyment || 0;
    const lossOfConsortium = generalDamages?.loss_of_consortium || 0;
    
    // Build general damages table
    const generalDamagesTable = `Emotional Distress\t$${emotionalDistress.toFixed(2)}
Duties Under Duress\t$${dutiesUnderDuress.toFixed(2)}
Pain and Suffering\t$${painAndSuffering.toFixed(2)}
Loss of Enjoyment of Life\t$${lossOfEnjoyment.toFixed(2)}
Loss of Consortium\t$${lossOfConsortium.toFixed(2)}`;
    
    const generalDamagesTotal = emotionalDistress + dutiesUnderDuress + painAndSuffering + lossOfEnjoyment + lossOfConsortium;
    const specialDamagesTotal = totalBilled + totalInsuranceAdjusted + mileageTotal;
    const totalDamages = specialDamagesTotal + generalDamagesTotal;

    // Build medical bills array
    const medicalBillsArray = medicalBills.map(bill => {
      const providerName = bill.medical_provider?.name || bill.medical_provider?.provider_name || 'Unknown Provider';
      const amount = bill.amount_billed || bill.total_billed || 0;
      return {
        provider: providerName,
        amount: amount,
        service_type: bill.service_type || ''
      };
    });

    // General damages object
    const generalDamagesObject = {
      emotional_distress: emotionalDistress,
      duties_under_duress: dutiesUnderDuress,
      pain_and_suffering: painAndSuffering,
      loss_of_enjoyment: lossOfEnjoyment,
      loss_of_consortium: lossOfConsortium
    };

    Object.assign(payload, {
      'medical_bills': medicalBillsArray,
      'general_damages': generalDamagesObject,
      'total_billed': totalBilled,
      'insurance_paid': totalInsurancePaid,
      'insurance_adjusted': totalInsuranceAdjusted,
      'mp_paid': totalMedpayPaid,
      'patient_paid': totalPatientPaid,
      'reduction_amount': totalReduction,
      'expense': totalExpense,
      'total_medical_bills': totalBilled,
      'medical_total': totalBilled,
      '$total_due': totalBalanceDue,
      'mileage_total': mileageTotal,
      'mileage_amount': mileageTotal,
      'Mileage': mileageTotal,
      'general_damages_emotional_distress': emotionalDistress,
      'general_damages_duties_under_duress': dutiesUnderDuress,
      'general_damages_pain_and_suffering': painAndSuffering,
      'general_damages_loss_of_enjoyment': lossOfEnjoyment,
      'general_damages_loss_of_consortium': lossOfConsortium,
      'Emotional Distress': emotionalDistress,
      'Duties Under Duress': dutiesUnderDuress,
      'Pain and Suffering': painAndSuffering,
      'Loss of Enjoyment of Life': lossOfEnjoyment,
      'Loss of Consortium': lossOfConsortium,
      'general_damages_table': generalDamagesTable,
      'total_general_damages': generalDamagesTotal,
      'general_damages_total': generalDamagesTotal,
      'Total amount of general damages': generalDamagesTotal,
      'special_damages_total': specialDamagesTotal,
      'total_special_damages': specialDamagesTotal,
      'Total amount of specials': specialDamagesTotal,
      'total_damages': totalDamages,
      'TOTAL DAMAGES': totalDamages,
      'medical_bills_table': medicalBillsTable,
    });
  } catch (error) {
    console.warn('⚠️ Error fetching comprehensive document data:', error);
  }

  // Fetch settlement data
  try {
    const { data: settlementData } = await supabase
      .from('settlements')
      .select('*')
      .eq('casefile_id', casefileId)
      .order('settlement_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (settlementData) {
      const settlementAmount = settlementData.gross_settlement || 0;
      const attorneyFee = settlementData.attorney_fee || 0;
      const caseExpenses = settlementData.case_expenses || 0;
      const medicalTotal = settlementData.medical_liens || 0;
      const clientNet = settlementData.client_net || 0;
      
      Object.assign(payload, {
        'settlement_amount': settlementAmount,
        'settlement_amount_formatted': formatCurrency(settlementAmount),
        'settlement_offer_amount': settlementAmount,
        'gross_settlement': settlementAmount,
        'gross_settlement_formatted': formatCurrency(settlementAmount),
        'attorney_fee': attorneyFee,
        'attorney_fee_percentage': settlementData.attorney_fee_percentage || 33.33,
        'attorney_fee_formatted': formatCurrency(attorneyFee),
        'Attorney Fee': formatCurrency(attorneyFee),
        'Attorney Fee Percentage': `${settlementData.attorney_fee_percentage || 33.33}%`,
        'case_expenses': caseExpenses,
        'case_expenses_formatted': formatCurrency(caseExpenses),
        'Case Expenses': formatCurrency(caseExpenses),
        'medical_total': medicalTotal,
        'medical_liens': medicalTotal,
        'medical_liens_formatted': formatCurrency(medicalTotal),
        'Medical Liens': formatCurrency(medicalTotal),
        'client_net': clientNet,
        'client_net_amount': clientNet,
        'client_net_amount_formatted': formatCurrency(clientNet),
        'Client Net': formatCurrency(clientNet),
        'Client Net Amount': formatCurrency(clientNet),
        'settlement_date': settlementData.settlement_date ? formatDate(settlementData.settlement_date) : '',
        'Settlement Date': settlementData.settlement_date ? formatDate(settlementData.settlement_date) : '',
        'settlement_status': settlementData.status || 'pending',
        'Settlement Status': settlementData.status || 'pending',
      });
    }
  } catch (error) {
    console.warn('⚠️ Error fetching settlement data:', error);
  }

  // Get recipient email
  const recipientEmail = getRecipientEmail(
    templateType,
    {
      client,
      firstPartyClaim,
      thirdPartyClaim,
      healthClaim: caseData.healthClaim,
      healthAdjuster: caseData.healthClaim?.health_adjuster || caseData.healthClaim?.health_adjusters?.[0],
      medicalProvider: relevantProviders?.[0]?.medical_provider
    },
    selectedParty
  );

  payload.recipient_email = recipientEmail;

  console.log('📋 Prepared complete payload for', templateType);
  console.log('📋 Payload size:', JSON.stringify(payload).length, 'bytes');
  console.log('📋 Payload fields:', Object.keys(payload).length, 'fields');
  
  return payload;
}

/**
 * Prepare document payload with generation mode
 */
export async function prepareDocumentPayloadWithMode(
  casefileId: number,
  templateType: string,
  generationMode: GenerationType,
  caseData: CaseData,
  clients: any[],
  targetClientId?: number,
  documentTypeName?: string,
  specificProviderId?: number,
  selectedParty?: 'first' | 'third'
): Promise<DocumentPayload> {
  const basePayload = await prepareDocumentPayload(
    casefileId,
    templateType,
    caseData,
    clients,
    specificProviderId,
    selectedParty
  );

  let documentName = '';
  const docTypeDisplayName = documentTypeName || 'Document';

  if (generationMode === 'per_client' && targetClientId) {
    const targetClient = clients.find(c => c.id === targetClientId);
    if (targetClient) {
      const firstName = targetClient.firstName || targetClient.first_name || 'Client';
      const lastName = targetClient.lastName || targetClient.last_name || '';
      documentName = `${docTypeDisplayName} - ${firstName} ${lastName}`.trim();
    }
  } else if (generationMode === 'all_clients') {
    const caseName = generateCaseName(clients);
    documentName = `${docTypeDisplayName} - ${caseName}`;
  } else {
    documentName = `${docTypeDisplayName} - Case #${casefileId}`;
  }

  return {
    ...basePayload,
    generation_mode: generationMode,
    document_name: documentName,
  };
}

/**
 * Call n8n webhook to generate document
 */
export async function callN8nWebhook(
  webhookUrl: string,
  payload: DocumentPayload
): Promise<{ pdfBase64: string; filename: string }> {
  console.log('📤 Sending payload to n8n:', payload);
  console.log('🔗 Webhook URL:', webhookUrl);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, application/pdf, */*'
    },
    body: JSON.stringify(payload),
  });

  console.log('📊 Response status:', response.status);
  console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

  const contentType = response.headers.get('content-type');
  console.log('📄 Content-Type:', contentType);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error response:', errorText);
    
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.message) {
        errorMessage = errorJson.message;
        if (errorJson.code === 404 && errorMessage.includes('not registered')) {
          errorMessage = 'Webhook not active. Please activate the n8n workflow and try again.';
        }
      }
    } catch (e) {
      // Use default error message
    }
    
    throw new Error(errorMessage);
  }

  let result: any;
  if (contentType?.includes('application/json')) {
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      throw new Error('Received empty response from webhook. The n8n workflow may not be active or configured correctly.');
    }
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Invalid JSON response from webhook. Please check n8n workflow configuration.');
    }
  } else if (contentType?.includes('application/pdf')) {
    const pdfBlob = await response.blob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);
    result = { pdf_base64: base64, filename: `${payload.template_type}_${Date.now()}.pdf` };
  } else {
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Received empty response from webhook. The n8n workflow may not be active or configured correctly.');
    }
    try {
      result = JSON.parse(text);
    } catch (e) {
      throw new Error('Response is not JSON or PDF: ' + text.substring(0, 100));
    }
  }

  let pdfBase64: string | null = null;
  let filename = `${payload.template_type}_${Date.now()}.pdf`;

  if (result.pdf_base64) {
    pdfBase64 = result.pdf_base64;
    filename = result.filename || filename;
  } else if (result.pdf) {
    pdfBase64 = result.pdf;
    filename = result.filename || filename;
  } else if (result.data) {
    pdfBase64 = result.data;
    filename = result.filename || filename;
  } else if (result.pdf_url || result.url) {
    const pdfUrl = result.pdf_url || result.url;
    const pdfResponse = await fetch(pdfUrl);
    const pdfBlob = await pdfResponse.blob();
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    pdfBase64 = btoa(binary);
  } else if (result.file && result.file.data) {
    pdfBase64 = result.file.data;
    filename = result.file.filename || filename;
  } else {
    console.error('❌ NO PDF FOUND IN RESPONSE');
    console.error('📦 Full response structure:', JSON.stringify(result, null, 2));
    throw new Error('PDF not found in n8n response. Check console for full response structure.');
  }

  if (!pdfBase64) {
    throw new Error('Failed to extract PDF from n8n response');
  }

  return { pdfBase64, filename };
}

/**
 * Save PDF to Supabase storage and create document record
 */
export async function savePDFToStorage(
  casefileId: number,
  base64Data: string,
  filename: string,
  documentName: string
): Promise<string> {
  try {
    const base64WithoutPrefix = base64Data.replace(/^data:.*?;base64,/, '');
    const binaryString = atob(base64WithoutPrefix);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'application/pdf' });
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `case-${casefileId}/${sanitizedFilename}_${timestamp}.pdf`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('case-documents')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('case-documents')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email || 'Admin';

    const documentRecord = {
      casefile_id: casefileId,
      file_name: filename,
      file_type: 'application/pdf',
      file_size: blob.size,
      file_url: publicUrl,
      storage_path: filePath,
      category: 'Letters',
      uploaded_by: userName,
      notes: `Generated: ${documentName}`
    };

    const { error: dbError } = await supabase
      .from('documents')
      .insert(documentRecord);

    if (dbError) {
      throw dbError;
    }

    return publicUrl;
  } catch (error) {
    console.error('Error saving PDF:', error);
    throw error;
  }
}

/**
 * Create work log entry for document generation
 */
export async function createWorkLogEntry(
  casefileId: number,
  documentName: string,
  notes?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email || 'Admin';

    const description = notes?.trim()
      ? `Generated ${documentName}. Notes: ${notes.trim()}`
      : `Generated ${documentName}`;

    await supabase.from('work_logs').insert({
      casefile_id: casefileId,
      description: description,
      timestamp: new Date().toISOString(),
      user_name: userName
    });
  } catch (error) {
    console.error('Error creating work log:', error);
    throw error;
  }
}

/**
 * Update case status/stage based on document type
 */
export async function updateCaseStatus(
  casefileId: number,
  documentType: string
): Promise<void> {
  try {
    const stageUpdate = DOCUMENT_STAGE_MAP[documentType];
    const demandStatus = DOCUMENT_STATUS_MAP[documentType];

    if (!stageUpdate && !demandStatus) {
      return; // No status update needed
    }

    const { data: currentCase } = await supabase
      .from('casefiles')
      .select('stage, status')
      .eq('id', casefileId)
      .single();

    if (!currentCase) return;

    let newStage = currentCase.stage;
    let newStatus = currentCase.status;

    if (stageUpdate) {
      newStage = stageUpdate.stage;
      newStatus = stageUpdate.status;
    } else if (demandStatus) {
      newStatus = demandStatus;
      const demandStatuses = [
        'Ready for Demand',
        'Demand Sent',
        'Counter Received',
        'Counter Sent',
        'Reduction Sent',
        'Proposed Settlement Statement Sent',
        'Release Sent',
        'Payment Instructions Sent'
      ];
      if (demandStatuses.includes(newStatus)) {
        newStage = 'Demand';
      }
    }

    const { error: updateError } = await supabase
      .from('casefiles')
      .update({
        status: newStatus,
        stage: newStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', casefileId);

    if (updateError) {
      console.error('Error updating case status:', updateError);
      return;
    }

    // Log status change
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.email || 'Admin';

    await supabase.from('work_logs').insert({
      casefile_id: casefileId,
      description: `Stage/status automatically updated to "${newStage} - ${newStatus}"`,
      timestamp: new Date().toISOString(),
      user_name: userName
    });
  } catch (error) {
    console.error('Error updating case status:', error);
    // Don't throw - status update failure shouldn't fail document generation
  }
}

/**
 * Update third party claim LOR tracking
 */
export async function updateThirdPartyClaimLOR(
  thirdPartyClaimId: number
): Promise<void> {
  try {
    await supabase
      .from('third_party_claims')
      .update({
        lor_sent: true,
        lor_date: new Date().toISOString()
      })
      .eq('id', thirdPartyClaimId);
  } catch (error) {
    console.error('Error updating third party claim LOR:', error);
    // Don't throw - LOR tracking failure shouldn't fail document generation
  }
}
