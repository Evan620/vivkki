/**
 * Determines the recipient email address for document generation based on document type
 * @param templateType - The document template type (e.g., 'cotton_1st_party_lor')
 * @param caseData - Case data containing client, claims, and provider information
 * @param selectedParty - For documents that can go to either party, specifies which one ('first' or 'third')
 * @returns The recipient email address or empty string if not available
 */
export function getRecipientEmail(
  templateType: string,
  caseData: {
    client?: any;
    firstPartyClaim?: any;
    thirdPartyClaim?: any;
    healthClaim?: any;
    healthAdjuster?: any;
    medicalProvider?: any;
  },
  selectedParty?: 'first' | 'third'
): string {
  // Helper to safely extract email from various field names
  const getEmail = (obj: any, ...fieldNames: string[]): string => {
    if (!obj) return '';
    for (const field of fieldNames) {
      const value = obj[field];
      if (value && typeof value === 'string' && value.trim() !== '' && value !== 'N/A') {
        return value.trim();
      }
    }
    return '';
  };

  switch (templateType) {
    // 1st Party LOR - goes to 1st Party auto insurance adjuster
    case 'cotton_1st_party_lor':
      return getEmail(caseData.firstPartyClaim, 'adjuster_email');

    // 3rd Party LOR - goes to 3rd Party auto insurance adjuster
    case 'cotton_3rd_party_lor':
      return getEmail(caseData.thirdPartyClaim, 'adjuster_email');

    // HIPAA - medical provider email
    case 'cotton_hipaa_request':
      return getEmail(caseData.medicalProvider, 'email', 'email_1');

    // Engagement Letter - client email
    case 'cotton_engagement_letter':
      return getEmail(caseData.client, 'email');

    // Proposed Settlement Statement - client email
    case 'proposed_settlement_statement':
      return getEmail(caseData.client, 'email');

    // Withdrawal Letter - client email
    case 'cotton_withdrawal_letter':
      return getEmail(caseData.client, 'email');

    // Subrogation - 1st party health insurance adjuster email
    case 'cotton_subro_letter':
      // Try healthAdjuster first (direct object), then healthClaim.health_adjuster (relationship)
      if (caseData.healthAdjuster) {
        return getEmail(caseData.healthAdjuster, 'email');
      }
      if (caseData.healthClaim?.health_adjuster) {
        return getEmail(caseData.healthClaim.health_adjuster, 'email');
      }
      return '';

    // Settlement demands (rear end, lane change, t-bone) - Third-party insurance adjuster email
    case 'cotton_demand_rear_end':
    case 'cotton_demand_lane_change':
    case 'cotton_demand_t_bone':
      return getEmail(caseData.thirdPartyClaim, 'adjuster_email');

    // UM/UIM demand and MedPay demand - First-party auto insurance adjuster email
    case 'cotton_um_uim_demand':
    case 'cotton_med_pay_demand':
      return getEmail(caseData.firstPartyClaim, 'adjuster_email');

    // Counter-demand - depends on selectedParty parameter
    case 'cotton_counter_demand':
      if (selectedParty === 'first') {
        return getEmail(caseData.firstPartyClaim, 'adjuster_email');
      } else if (selectedParty === 'third') {
        return getEmail(caseData.thirdPartyClaim, 'adjuster_email');
      }
      // Default to third party if no selection
      return getEmail(caseData.thirdPartyClaim, 'adjuster_email');

    // Offer Acceptance - depends on selectedParty parameter
    case 'cotton_offer_acceptance':
      if (selectedParty === 'first') {
        return getEmail(caseData.firstPartyClaim, 'adjuster_email');
      } else if (selectedParty === 'third') {
        return getEmail(caseData.thirdPartyClaim, 'adjuster_email');
      }
      // Default to third party if no selection
      return getEmail(caseData.thirdPartyClaim, 'adjuster_email');

    // Payment Instructions - depends on selectedParty parameter
    case 'cotton_payment_instructions':
      if (selectedParty === 'first') {
        return getEmail(caseData.firstPartyClaim, 'adjuster_email');
      } else if (selectedParty === 'third') {
        return getEmail(caseData.thirdPartyClaim, 'adjuster_email');
      }
      // Default to third party if no selection
      return getEmail(caseData.thirdPartyClaim, 'adjuster_email');

    // Bill reduction - Medical Provider email
    case 'cotton_reduction_request':
      return getEmail(caseData.medicalProvider, 'email', 'email_1');

    default:
      console.warn(`No recipient email mapping for document type: ${templateType}`);
      return '';
  }
}
