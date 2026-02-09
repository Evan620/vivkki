// Document Template Configuration
// Defines generation rules for each document template

export type GenerationType = 'per_client' | 'all_clients' | 'case_level';
export type DefaultSelection = 'all' | 'manual' | 'driver_only';

export interface TemplateRule {
  generationType: GenerationType;
  allowsClientSelection: boolean;
  defaultSelection: DefaultSelection;
}

export const DOCUMENT_TEMPLATES: Record<string, TemplateRule> = {
  // Letters of Representation
  'cotton_1st_party_lor': {
    generationType: 'per_client',
    allowsClientSelection: true,
    defaultSelection: 'driver_only' // Usually only driver has 1st party claim
  },
  'cotton_3rd_party_lor': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },

  // Medical Records
  'cotton_hipaa_request': {
    generationType: 'per_client',
    allowsClientSelection: true,
    defaultSelection: 'all'
  },
};

// Document type to status mapping for automatic status updates
export const DOCUMENT_STATUS_MAP: Record<string, string> = {
  'cotton_demand_rear_end': 'Demand Sent',
  'cotton_demand_lane_change': 'Demand Sent',
  'cotton_demand_t_bone': 'Demand Sent',
  'cotton_um_uim_demand': 'Demand Sent',
  'cotton_med_pay_demand': 'Demand Sent',
  'cotton_counter_demand': 'Counter Sent',
  'cotton_reduction_request': 'Reduction Sent',
  'proposed_settlement_statement': 'Proposed Settlement Statement Sent',
  'cotton_offer_acceptance': 'Release Sent',
  'cotton_payment_instructions': 'Payment Instructions Sent',
};

// Document type to stage/status mapping for automatic stage transitions
export const DOCUMENT_STAGE_MAP: Record<string, { stage: string; status: string }> = {
  // LORs, Engagement, HIPAA -> Processing - Treating
  'cotton_1st_party_lor': { stage: 'Processing', status: 'Treating' },
  'cotton_3rd_party_lor': { stage: 'Processing', status: 'Treating' },
  'cotton_engagement_letter': { stage: 'Processing', status: 'Treating' },
  'cotton_hipaa_request': { stage: 'Processing', status: 'Treating' },
  // Subro -> Processing - Awaiting Subro
  'cotton_subro_letter': { stage: 'Processing', status: 'Awaiting Subro' },
};
