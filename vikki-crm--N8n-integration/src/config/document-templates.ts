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

  // Demand Letters
  'cotton_demand_rear_end': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },
  'cotton_demand_lane_change': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },
  'cotton_demand_t_bone': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },
  'cotton_um_uim_demand': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },
  'cotton_med_pay_demand': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },
  'cotton_counter_demand': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },

  // Settlement Documents
  'cotton_offer_acceptance': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },
  'cotton_payment_instructions': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },
  'settlement_statement': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },
  'proposed_settlement_statement': {
    generationType: 'all_clients',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },

  // Client Communications
  'cotton_engagement_letter': {
    generationType: 'per_client',
    allowsClientSelection: true,
    defaultSelection: 'all'
  },
  'cotton_withdrawal_letter': {
    generationType: 'per_client',
    allowsClientSelection: true,
    defaultSelection: 'all'
  },

  // Medical Provider Communications
  'cotton_reduction_request': {
    generationType: 'case_level',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },
  'cotton_subro_letter': {
    generationType: 'case_level',
    allowsClientSelection: false,
    defaultSelection: 'all'
  },

  // Generic template (fallback)
  'hipaa_template': {
    generationType: 'per_client',
    allowsClientSelection: true,
    defaultSelection: 'all'
  },

  // State of the Union Report
  'state_of_union': {
    generationType: 'case_level',
    allowsClientSelection: false,
    defaultSelection: 'all'
  }
};

