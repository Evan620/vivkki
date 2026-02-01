import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Loader2, AlertCircle, Users } from 'lucide-react';
import Modal from '../common/Modal';
import { supabase, fetchMedicalProviders } from '../../utils/database';
import { DOCUMENT_TEMPLATES } from '../../config/document-templates';
import { generateCaseName } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { getRecipientEmail } from '../../utils/documentRecipientEmail';

// Document type to status mapping for automatic status updates
const DOCUMENT_STATUS_MAP: Record<string, string> = {
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
const DOCUMENT_STAGE_MAP: Record<string, { stage: string; status: string }> = {
  // LORs, Engagement, HIPAA -> Processing - Treating
  'cotton_1st_party_lor': { stage: 'Processing', status: 'Treating' },
  'cotton_3rd_party_lor': { stage: 'Processing', status: 'Treating' },
  'cotton_engagement_letter': { stage: 'Processing', status: 'Treating' },
  'cotton_hipaa_request': { stage: 'Processing', status: 'Treating' },
  // Subro -> Processing - Awaiting Subro
  'cotton_subro_letter': { stage: 'Processing', status: 'Awaiting Subro' },
};

interface GenerateDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  casefileId: number;
  clients?: any[];
  defendants?: any[];
  onSuccess: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  medicalBills?: any[];
  selectedProviders?: number[];
  onProviderSelectionChange?: (providers: number[]) => void;
}

interface CaseData {
  casefile: any;
  client: any;
  defendant: any;
  medicalBills: any[];
  workLogs: any[];
  firstPartyClaim?: any;
  healthClaim?: any;
  thirdPartyClaim?: any;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  template_type: string;
  icon: string;
}

interface GenerationStatus {
  documentId: string;
  documentName: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
  providerId?: number;
  providerName?: string;
}

interface MedicalProvider {
  id: number;
  name: string;
  provider_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  type?: string;
}

const documentTypes: DocumentType[] = [
  {
    id: '1st-party-lor',
    name: '1st Party Letter of Representation',
    description: 'Letter to client\'s insurance company',
    template_type: 'cotton_1st_party_lor',
    icon: '📄'
  },
  {
    id: '3rd-party-lor',
    name: '3rd Party Letter of Representation',
    description: 'Letter to at-fault party\'s insurance',
    template_type: 'cotton_3rd_party_lor',
    icon: '📝'
  },
  {
    id: 'hipaa-request',
    name: 'HIPAA Records Request',
    description: 'Medical records authorization form',
    template_type: 'cotton_hipaa_request',
    icon: '🏥'
  },
  {
    id: 'offer-acceptance',
    name: 'Offer Acceptance Letter',
    description: 'Letter accepting settlement offer',
    template_type: 'cotton_offer_acceptance',
    icon: '✅'
  },
  {
    id: 'demand-rear-end',
    name: 'Settlement Demand - Rear End',
    description: 'Demand letter for rear-end collision',
    template_type: 'cotton_demand_rear_end',
    icon: '💰'
  },
  {
    id: 'demand-lane-change',
    name: 'Settlement Demand - Side Swipe',
    description: 'Demand letter for improper lane change',
    template_type: 'cotton_demand_lane_change',
    icon: '💰'
  },
  {
    id: 'demand-t-bone',
    name: 'Settlement Demand - T-Bone',
    description: 'Demand letter for T-bone collision',
    template_type: 'cotton_demand_t_bone',
    icon: '💰'
  },
  {
    id: 'demand-um-uim',
    name: 'UM/UIM Demand',
    description: 'Underinsured motorist demand',
    template_type: 'cotton_um_uim_demand',
    icon: '🏛️'
  },
  {
    id: 'demand-med-pay',
    name: 'Med Pay Demand',
    description: 'Medical payments demand letter',
    template_type: 'cotton_med_pay_demand',
    icon: '💊'
  },
  {
    id: 'proposed-settlement-statement',
    name: 'Proposed Settlement Statement',
    description: 'Detailed proposed settlement breakdown',
    template_type: 'proposed_settlement_statement',
    icon: '📊'
  },
  {
    id: 'payment-instructions',
    name: 'Payment Instructions',
    description: 'Provider payment breakdown',
    template_type: 'cotton_payment_instructions',
    icon: '💳'
  },
  {
    id: 'withdrawal-letter',
    name: 'Withdrawal Letter',
    description: 'Letter declining or withdrawing from case',
    template_type: 'cotton_withdrawal_letter',
    icon: '✉️'
  },
  {
    id: 'subro-letter',
    name: 'Subrogation Letter',
    description: 'Letter to health insurance for subrogation',
    template_type: 'cotton_subro_letter',
    icon: '🏥'
  },
  {
    id: 'reduction-request',
    name: 'Bill Reduction Request',
    description: 'Request medical bill reduction from provider',
    template_type: 'cotton_reduction_request',
    icon: '💸'
  },
  {
    id: 'engagement-letter',
    name: 'Engagement Letter',
    description: 'Client welcome and engagement letter',
    template_type: 'cotton_engagement_letter',
    icon: '🤝'
  },
  {
    id: 'counter-demand',
    name: 'Counter Demand',
    description: 'Counter demand letter for settlement',
    template_type: 'cotton_counter_demand',
    icon: '↔️'
  }
];

export default function GenerateDocumentsModal({
  isOpen,
  onClose,
  casefileId,
  clients = [],
  defendants = [],
  onSuccess,
  onShowToast,
  medicalBills = [],
  selectedProviders = [],
  onProviderSelectionChange
}: GenerateDocumentsModalProps) {
  const [documentNotes, setDocumentNotes] = useState('');
  type GenerationType = 'per_client' | 'all_clients' | 'case' | 'case_level';
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null); // Single selection
  const [generating, setGenerating] = useState(false);
  const [generationStatuses, setGenerationStatuses] = useState<GenerationStatus[]>([]);
  const [providers, setProviders] = useState<MedicalProvider[]>([]);
  const [localSelectedProviders, setLocalSelectedProviders] = useState<number[]>(selectedProviders);
  // Selected client/defendant can be added later; default to first
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]); // For per-client selection
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedPartyForDocument, setSelectedPartyForDocument] = useState<'first' | 'third' | null>(null);
  const [showPartySelectionModal, setShowPartySelectionModal] = useState(false);
  const [pendingDocumentType, setPendingDocumentType] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDocumentId(null);
      setSelectedClientIds(clients.length > 0 ? clients.map(c => c.id) : []);
      setDocumentNotes('');
      setSelectedPartyForDocument(null);
      setShowPartySelectionModal(false);
      setPendingDocumentType(null);
      fetchAllCaseData();
    }
  }, [isOpen, casefileId, clients]);

  // Sync local selected providers with parent
  useEffect(() => {
    setLocalSelectedProviders(selectedProviders);
  }, [selectedProviders]);

  // HIPAA provider list should include ONLY providers for selected clients' bills.
  // Fall back to catalog only if no providers found in bills.
  useEffect(() => {
    const rebuildProviders = async () => {
      if (selectedDocumentId !== 'hipaa-request') return;
      if (!caseData) return;

      // Filter medical bills by currently selected clients
      const filteredBills = (caseData.medicalBills || []).filter(b =>
        selectedClientIds.length === 0 ? true : selectedClientIds.includes(b.client_id)
      );

      // Build providers from filtered bills
      const fromBills: MedicalProvider[] = filteredBills
        .filter(b => !!b.medical_provider_id)
        .map(b => ({
          id: b.medical_provider_id,
          name: b.medical_provider?.name || b.medical_provider?.provider_name || 'Unknown Provider',
          provider_name: b.medical_provider?.provider_name,
          address: b.medical_provider?.address || b.medical_provider?.street_address,
          city: b.medical_provider?.city,
          state: b.medical_provider?.state,
          zip: b.medical_provider?.zip || b.medical_provider?.zip_code,
          phone: b.medical_provider?.phone,
          type: b.medical_provider?.type || ''
        }));

      const uniqueFromBills = fromBills.filter((p, i, self) => i === self.findIndex(q => q.id === p.id));

      if (uniqueFromBills.length > 0) {
        setProviders(uniqueFromBills);
        // Remove any selected providers that are no longer present
        setLocalSelectedProviders(prev => prev.filter(id => uniqueFromBills.some(p => p.id === id)));
        onProviderSelectionChange?.(uniqueFromBills.filter(p => localSelectedProviders.includes(p.id)).map(p => p.id));
        return;
      }

      // Fallback: load catalog if no providers tied to bills
      try {
        const catalog = await fetchMedicalProviders();
        const mapped: MedicalProvider[] = (catalog || []).map(p => ({
          id: p.id,
          name: p.name,
          address: p.street_address,
          city: p.city,
          state: p.state,
          zip: p.zip_code,
          phone: p.phone,
          type: p.type
        }));
        setProviders(mapped);
        setLocalSelectedProviders([]);
        onProviderSelectionChange?.([]);
      } catch (e) {
        console.warn('Failed to load provider catalog', e);
        setProviders([]);
        setLocalSelectedProviders([]);
        onProviderSelectionChange?.([]);
      }
    };

    rebuildProviders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocumentId, JSON.stringify(selectedClientIds), !!caseData]);

  const fetchAllCaseData = async () => {
    try {
      setLoadingData(true);
      console.log('🔍 Fetching all case data for case ID:', casefileId);

      // Fetch casefile
      const { data: casefile, error: casefileError } = await supabase
        .from('casefiles')
        .select('*')
        .eq('id', casefileId)
        .maybeSingle();

      if (casefileError) throw casefileError;
      if (!casefile) throw new Error('Case not found');

      // Use selected client/defendant or first one
      const selectedClient = clients?.[0] || null;
      const selectedDefendant = defendants?.[0] || null;

      // Fetch ALL medical bills with providers for the case
      let medicalBillsList: any[] = [];
        const { data: bills, error: billsError } = await supabase
          .from('medical_bills')
          .select(`
            *,
            medical_provider:medical_providers(*)
          `)
        .in('client_id', clients.map(c => c.id));

        if (billsError) throw billsError;
      medicalBillsList = bills || [];

      // If providers are missing from join, try alternative provider tables
      const missingProviders = (medicalBillsList || []).every(b => !b.medical_provider || !b.medical_provider.name);
      if (missingProviders && (medicalBillsList || []).length > 0) {
        const alt1 = await supabase
          .from('medical_bills')
          .select(`*, medical_provider:medical_providers_complete(*)`)
          .in('client_id', clients.map(c => c.id));
        if (!alt1.error && alt1.data?.length) medicalBillsList = alt1.data;
        const stillMissing = (medicalBillsList || []).every(b => !b.medical_provider || !b.medical_provider.name);
        if (stillMissing) {
          const alt2 = await supabase
            .from('medical_bills')
            .select(`*, medical_provider:medical_providers_simple(*)`)
            .in('client_id', clients.map(c => c.id));
          if (!alt2.error && alt2.data?.length) medicalBillsList = alt2.data;
        }
      }

      // Fetch work logs
      const { data: workLogs, error: logsError } = await supabase
        .from('work_logs')
        .select('*')
        .eq('casefile_id', casefileId)
        .order('timestamp', { ascending: false });

      if (logsError) throw logsError;

      // Fetch first party claim
      const { data: firstPartyClaim } = await supabase
        .from('first_party_claims')
        .select('*, auto_insurance:auto_insurance(*)')
        .eq('casefile_id', casefileId)
        .maybeSingle();

      // Fetch health claims for ALL clients in the case (will be used in payload preparation below)
      // Note: Individual healthClaim is kept for backwards compatibility
      // Include health adjuster relationship for subrogation email
      const { data: healthClaim } = selectedClient ? await supabase
        .from('health_claims')
        .select('*, health_insurance:health_insurance(*), health_adjuster:health_adjusters(*)')
        .eq('client_id', selectedClient.id)
        .maybeSingle() : { data: null };

      // Fetch third party claim
      const { data: thirdPartyClaim } = selectedDefendant ? await supabase
        .from('third_party_claims')
        .select('*, auto_insurance:auto_insurance(*)')
        .eq('defendant_id', selectedDefendant.id)
        .maybeSingle() : { data: null };

      const fullCaseData: CaseData = {
        casefile,
        client: selectedClient,
        defendant: selectedDefendant,
        medicalBills: medicalBillsList || [],
        workLogs: workLogs || [],
        firstPartyClaim,
        healthClaim,
        thirdPartyClaim
      };

      setCaseData(fullCaseData);
      
      // Extract providers from the fetched medical bills
      extractProvidersFromBills(medicalBillsList);
      
      console.log('✅ Successfully fetched all case data:', fullCaseData);
      console.log('📋 Medical bills count:', medicalBillsList.length);
      console.log('📋 Sample bill structure:', medicalBillsList[0]);
      console.log('📋 Clients data:', clients);
    } catch (error) {
      console.error('❌ Error fetching case data:', error);
      onShowToast('Failed to load case data', 'error');
    } finally {
      setLoadingData(false);
    }
  };

  const extractProvidersFromBills = (bills: any[] = medicalBills) => {
    const providersFromBills = bills.map(bill => ({
      id: bill.medical_provider_id,
      name: bill.medical_provider?.name || bill.medical_provider?.provider_name || 'Unknown Provider',
      provider_name: bill.medical_provider?.provider_name,
      address: bill.medical_provider?.address || bill.medical_provider?.street_address,
      city: bill.medical_provider?.city,
      state: bill.medical_provider?.state,
      zip: bill.medical_provider?.zip || bill.medical_provider?.zip_code,
      phone: bill.medical_provider?.phone,
      type: bill.medical_provider?.type || ''
    }));

    // Remove duplicates based on ID
    const uniqueProviders = providersFromBills.filter((provider, index, self) =>
      index === self.findIndex((p) => p.id === provider.id)
    );

    setProviders(uniqueProviders);
    console.log('📋 Extracted providers:', uniqueProviders);
  };

  const handleToggleDocument = (docId: string) => {
    // Single document selection - toggle off previous if selecting new one
    setSelectedDocumentId(prev => prev === docId ? null : docId);
  };

  const handleToggleClient = (clientId: number) => {
    setSelectedClientIds(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleToggleProvider = (providerId: number) => {
    const newSelection = localSelectedProviders.includes(providerId)
      ? localSelectedProviders.filter(id => id !== providerId)
      : [...localSelectedProviders, providerId];
    
    setLocalSelectedProviders(newSelection);
    onProviderSelectionChange?.(newSelection);
  };

  const handleSelectAllProviders = () => {
    if (localSelectedProviders.length === providers.length) {
      setLocalSelectedProviders([]);
      onProviderSelectionChange?.([]);
    } else {
      setLocalSelectedProviders(providers.map(p => p.id));
      onProviderSelectionChange?.(providers.map(p => p.id));
    }
  };

  const handleSelectAllClients = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(clients.map(c => c.id));
    }
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatSSN = (ssn: string | null | undefined): string => {
    if (!ssn) return 'N/A';
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return ssn;
  };

  const prepareDocumentPayload = async (templateType: string, specificProviderId?: number) => {
    if (!caseData) {
      throw new Error('Case data not loaded');
    }

    console.log('🔍 Using fetched case data for template:', templateType);
    console.log('📊 Case data:', caseData);
    console.log('👤 Client:', caseData?.client);
    console.log('👤 Defendant:', caseData?.defendant);
    // Clients/Defendants arrays are not part of CaseData; logging omitted

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
    let payload = {
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

      // Defendant Info (always included) - Handle both camelCase and snake_case
      'Defendant::fullName': `${defendant?.firstName || defendant?.first_name || ''} ${defendant?.lastName || defendant?.last_name || ''}`.trim() || 'N/A',
      'Defendant::firstName': defendant?.firstName || defendant?.first_name || 'N/A',
      'Defendant::lastName': defendant?.lastName || defendant?.last_name || 'N/A',
      'Defendant::isPolicyholder': (defendant?.isPolicyholder || defendant?.is_policyholder) ? 'Yes' : 'No',
      'Defendant::policyholderName': (defendant?.isPolicyholder || defendant?.is_policyholder)
        ? `${defendant?.firstName || defendant?.first_name || ''} ${defendant?.lastName || defendant?.last_name || ''}`.trim()
        : `${defendant?.policyholderFirstName || defendant?.policyholder_first_name || ''} ${defendant?.policyholderLastName || defendant?.policyholder_last_name || ''}`.trim() || 'N/A',

      // First Party Claim Info (always included)
      // Use auto_insurance.name from relationship, fallback to N/A
      'ClientsAutoInsurer::name': firstPartyClaim?.auto_insurance?.name || 'N/A',
      'ClientsClaim::claimNumber': firstPartyClaim?.claim_number || 'N/A',
      'ClientsAdjuster::fullName': firstPartyClaim?.adjuster_name || 'N/A',
      'ClientsAdjuster::phone': firstPartyClaim?.adjuster_phone || 'N/A',
      'ClientsAdjuster::email': firstPartyClaim?.adjuster_email || 'N/A',
      'ClientsAdjuster::fax': firstPartyClaim?.adjuster_fax || 'N/A',
      'FirstParty::carrier': firstPartyClaim?.auto_insurance?.name || 'N/A',
      'FirstParty::claimNumber': firstPartyClaim?.claim_number || 'N/A',
      'FirstParty::adjuster': firstPartyClaim?.adjuster_name || 'N/A',
      'FirstParty::adjusterPhone': firstPartyClaim?.adjuster_phone || 'N/A',
      'FirstParty::adjusterEmail': firstPartyClaim?.adjuster_email || 'N/A',
      'FirstParty::adjusterFax': firstPartyClaim?.adjuster_fax || 'N/A',
      'FirstParty::policyNumber': firstPartyClaim?.policy_number || 'N/A',
      'FirstParty::policyLimits': firstPartyClaim?.policy_limits || 'N/A',

      // Third Party Claim Info (always included)
      // Use auto_insurance.name from relationship, fallback to N/A
      'DefendantsAutoInsurer::name': thirdPartyClaim?.auto_insurance?.name || 'N/A',
      'DefendantsClaim::claimNumber': thirdPartyClaim?.claim_number || 'N/A',
      'DefendantsAdjuster::fullName': thirdPartyClaim?.adjuster_name || 'N/A',
      'DefendantsAdjuster::phone': thirdPartyClaim?.adjuster_phone || 'N/A',
      'DefendantsAdjuster::email': thirdPartyClaim?.adjuster_email || 'N/A',
      'DefendantsAdjuster::fax': thirdPartyClaim?.adjuster_fax || 'N/A',
      'ThirdParty::carrier': thirdPartyClaim?.auto_insurance?.name || 'N/A',
      'ThirdParty::claimNumber': thirdPartyClaim?.claim_number || 'N/A',
      'ThirdParty::adjuster': thirdPartyClaim?.adjuster_name || 'N/A',
      'ThirdParty::adjusterPhone': thirdPartyClaim?.adjuster_phone || 'N/A',
      'ThirdParty::adjusterEmail': thirdPartyClaim?.adjuster_email || 'N/A',
      'ThirdParty::adjusterFax': thirdPartyClaim?.adjuster_fax || 'N/A',
      'ThirdParty::policyNumber': thirdPartyClaim?.policy_number || 'N/A',
      'ThirdParty::policyLimits': thirdPartyClaim?.policy_limits || 'N/A',
      'adjuster_street_address': thirdPartyClaim?.adjuster_address || firstPartyClaim?.adjuster_address || 'N/A',
      'adjuster_city': thirdPartyClaim?.adjuster_city || firstPartyClaim?.adjuster_city || 'Oklahoma City',
      'adjuster_state': thirdPartyClaim?.adjuster_state || firstPartyClaim?.adjuster_state || 'OK',
      'adjuster_zip_code': thirdPartyClaim?.adjuster_zip || firstPartyClaim?.adjuster_zip || '73102',

      // Medical Provider Info (always included)
      'MedicalProvider::name': relevantProviders?.[0]?.medical_provider?.name || relevantProviders?.[0]?.medical_provider?.provider_name || 'N/A',
      'MedicalProvider::streetAddress': relevantProviders?.[0]?.medical_provider?.address || relevantProviders?.[0]?.medical_provider?.street_address || 'N/A',
      'MedicalProvider::city': relevantProviders?.[0]?.medical_provider?.city || 'Oklahoma City',
      'MedicalProvider::state': relevantProviders?.[0]?.medical_provider?.state || 'Oklahoma',
      'MedicalProvider::zip': relevantProviders?.[0]?.medical_provider?.zip || relevantProviders?.[0]?.medical_provider?.zip_code || '73102',
      'MedicalProvider::phone': relevantProviders?.[0]?.medical_provider?.phone || 'N/A',
      'MedicalProvider::fax': relevantProviders?.[0]?.medical_provider?.fax || 'N/A',
    } as any;

    // Add date helpers
    Object.assign(payload, {
      'current_date': fullDate,
      'current_day': String(currentDate.getDate()),
      'current_month': currentDate.toLocaleDateString('en-US', { month: 'long' }),
      'current_year': String(currentDate.getFullYear()),
      'date_of_loss': formatDate(casefile?.date_of_loss),
      
      // Additional wreck fields (underscore format)
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
      
      // Client aliases (dot and underscore format)
      'client_list': '', // will be populated below
      'client.list': '', // will be populated below
      'client.fullName': payload['Client::fullName'],
      'client_full_name': payload['Client::fullName'],
      'client.dob': payload['Client::dateOfBirth'],
      'client_dob': payload['Client::dateOfBirth'],
      
      // Defendant aliases
      'defendant.full_name': payload['Defendant::fullName'],
      'defendant_full_name': payload['Defendant::fullName'],
      
      // First Party aliases (underscore format)
      'Clients_AutoInsurer::name': payload['ClientsAutoInsurer::name'],
      'Clients_Claim::claimNumber': payload['ClientsClaim::claimNumber'],
      'Clients_Adjuster::fullName': payload['ClientsAdjuster::fullName'],
      'Clients_Adjuster::phone': payload['ClientsAdjuster::phone'],
      'Clients_Adjuster::email': payload['ClientsAdjuster::email'],
      'Clients_Adjuster::fax': payload['ClientsAdjuster::fax'],
      
      // Third Party aliases (underscore format)
      'Defendants_AutoInsurer::name': payload['DefendantsAutoInsurer::name'],
      'Defendants_Claim::claimNumber': payload['DefendantsClaim::claimNumber'],
      'Defendants_Adjuster::fullName': payload['DefendantsAdjuster::fullName'],
      'Defendants_Adjuster::phone': payload['DefendantsAdjuster::phone'],
      'Defendants_Adjuster::email': payload['DefendantsAdjuster::email'],
      'Defendants_Adjuster::fax': payload['DefendantsAdjuster::fax'],
      'auto_insurance.name': thirdPartyClaim?.auto_insurance?.name || firstPartyClaim?.auto_insurance?.name || '',
      'claim_number': thirdPartyClaim?.claim_number || '',
      'adjuster_full_name': thirdPartyClaim?.adjuster_name || '',
      'adjuster_fax': thirdPartyClaim?.adjuster_fax || '',
      
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
      
      // Financial fields - start with zeros (will be populated if data exists)
      'total_billed': 0,
      'insurance_paid': 0,
      'insurance_adjusted': 0,
      'mp_paid': 0, // MedPay paid
      'patient_paid': 0,
      'reduction_amount': 0,
      'expense': 0,
      'total_medical_bills': 0,
      'medical_total': 0,
      '$total_due': 0,
      'is_hipaa_sent': '',
      'is_bill_received': '',
      'is_record_received': '',
      'is_lien_filed': '',
      'is_in_collections': '',
      'last_request_date': '',
      
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
      
      // Provider payment
      'requested_reduction_amount': 0,
      'provider_payment_table': '',
      'medical_providers_table': '',
      
      // Health insurance
      'health_insurance_name': '',
      'health_claim.health_insurance.name': '',
      'health_claim_member_id': '',
      'health_claim.member_id': '',
      'health_adjuster_email': '',
      'health_claim.health_adjuster.email': '',
      'health_claim.health_adjuster.fax': '',
      
      // Team (empty placeholders)
      'team_intake_coordinator_name': '',
      'team_intake_coordinator_email': '',
      'team_legal_assistant_name': '',
      'team_case_manager_name': '',
      'team_office_operations_manager_name': '',
      'team_office_operations_manager_email': '',
      'team_receptionist_name': '',
      'team_receptionist_email': '',
      
      // Other fields
      'statute_of_limitations_date': casefile?.statute_deadline ? formatDate(casefile.statute_deadline) : '',
      'county_name': casefile?.wreck_county || '',
    });

    // Calculate date that is 2 years after accident date (auto-populated)
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

    // Add statute date (2 years after accident) to payload with multiple aliases
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

    // Build comma-separated list of all client full names for webhook templates
    try {
      const clientFullNames = (clients || [])
        .map((c) => `${(c.firstName || c.first_name || '').toString().trim()} ${(c.lastName || c.last_name || '').toString().trim()}`.trim())
        .filter((n) => n && n !== '' && n !== 'N/A');
      const clientList = clientFullNames.join(', ');
      payload['client.list'] = clientList;
      payload['client_list'] = clientList;
      // Also provide Pascal aliases if needed by templates
      payload['Client::list'] = clientList;
      console.log('🧾 Client list built:', clientList);
    } catch (e) {
      console.warn('Failed building client.list', e);
    }

    // Include only medical providers used in this case's medical bills (not all providers from catalog)
    try {
      const usedProviders = medicalBills
        .map(bill => bill.medical_provider)
        .filter(Boolean)
        .filter((provider, index, self) => 
          index === self.findIndex(p => p?.id === provider?.id)
        );
      payload.providers_catalog = usedProviders;
      console.log('🏥 Medical providers from case bills:', usedProviders.length);
    } catch (e) {
      console.warn('Failed to filter medical providers', e);
      payload.providers_catalog = [];
    }

    // Build auto insurance list from claims used in this case
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
      console.log('🚗 Filtered auto insurance from claims:', autoInsurers.length);
    } catch (e) {
      console.warn('Failed to build auto insurance list', e);
      payload.auto_insurance_list = [];
    }

    // Fetch and build health insurance list from ALL health claims for this case
    try {
      // Fetch all health claims for all clients in this case
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
      console.log('🏥 Filtered health insurance from claims:', healthInsurers.length);
    } catch (e) {
      console.warn('Failed to build health insurance list', e);
      payload.health_insurance_list = [];
    }

    // Fetch comprehensive data for ALL documents (uniform structure like demand letters)
    try {
      // Fetch general damages
      const { data: generalDamages, error: damagesError } = await supabase
        .from('general_damages')
        .select('*')
        .eq('casefile_id', casefileId)
        .maybeSingle();

      if (damagesError) {
        console.warn('⚠️ Failed to load general damages:', damagesError.message);
    }

    // Fetch mileage log
      const { data: mileageLogs, error: mileageError } = await supabase
      .from('mileage_log')
      .select('*')
      .eq('casefile_id', casefileId);

      if (mileageError) {
        console.warn('⚠️ Failed to load mileage log:', mileageError.message);
      }

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

      // Build medical bills array with proper amount extraction (prioritize amount_billed)
      const medicalBillsArray = medicalBills.map(bill => {
        const providerName = bill.medical_provider?.name || bill.medical_provider?.provider_name || 'Unknown Provider';
        const amount = bill.amount_billed || bill.total_billed || 0;
        
        // Log warning if amount is 0 to help debug
        if (amount === 0 && providerName !== 'Unknown Provider') {
          console.warn(`⚠️ Medical bill has 0 amount for provider: ${providerName}`, {
            bill_id: bill.id,
            amount_billed: bill.amount_billed,
            total_billed: bill.total_billed,
            bill_data: bill
          });
        }
        
        return {
          provider: providerName,
          amount: amount,
          service_type: bill.service_type || ''
        };
      });

      // Always create general_damages object (never null) with all 5 fields
      const generalDamagesObject = {
        emotional_distress: emotionalDistress,
        duties_under_duress: dutiesUnderDuress,
        pain_and_suffering: painAndSuffering,
        loss_of_enjoyment: lossOfEnjoyment,
        loss_of_consortium: lossOfConsortium
      };

      // Debug logging
      console.log('💰 Medical Bills Extraction:', {
        totalBills: medicalBills.length,
        billsWithAmounts: medicalBillsArray.map(b => ({ provider: b.provider, amount: b.amount })),
        totalBilled,
        specialDamagesTotal
      });

      console.log('💼 General Damages Extraction:', {
        generalDamagesFromDB: generalDamages ? 'Found' : 'Not found (using 0s)',
        generalDamagesObject,
        generalDamagesTotal,
        totalDamages
      });

      Object.assign(payload, {
        'medical_bills': medicalBillsArray,
        'general_damages': generalDamagesObject,
        // Financial fields (raw numbers, no formatting)
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
        // General damages
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
        // Special damages and totals
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

    // Settlement data - fetch for all documents (available if settlement exists)
    // Documents that might use settlement data: settlement_statement, payment_instructions, offer_acceptance, demands, etc.
    try {
      const { data: settlementData, error: settlementError } = await supabase
        .from('settlements')
        .select('*')
        .eq('casefile_id', casefileId)
        .order('settlement_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (settlementError) {
        console.warn('⚠️ Failed to load settlement data:', settlementError.message);
        // Don't throw - just log and continue without settlement data
      }
      
      if (settlementData) {
        const settlementAmount = settlementData.gross_settlement || 0;
        const attorneyFee = settlementData.attorney_fee || 0;
        const caseExpenses = settlementData.case_expenses || 0;
        const medicalTotal = settlementData.medical_liens || 0;
        const clientNet = settlementData.client_net || 0;
        
        Object.assign(payload, {
          // Settlement amounts
          'settlement_amount': settlementAmount,
          'settlement_amount_formatted': formatCurrency(settlementAmount),
          'settlement_offer_amount': settlementAmount,
          'gross_settlement': settlementAmount,
          'gross_settlement_formatted': formatCurrency(settlementAmount),
          
          // Attorney fee
          'attorney_fee': attorneyFee,
          'attorney_fee_percentage': settlementData.attorney_fee_percentage || 33.33,
          'attorney_fee_formatted': formatCurrency(attorneyFee),
          'Attorney Fee': formatCurrency(attorneyFee),
          'Attorney Fee Percentage': `${settlementData.attorney_fee_percentage || 33.33}%`,
          
          // Case expenses
          'case_expenses': caseExpenses,
          'case_expenses_formatted': formatCurrency(caseExpenses),
          'Case Expenses': formatCurrency(caseExpenses),
          
          // Medical liens/total
          'medical_total': medicalTotal,
          'medical_liens': medicalTotal,
          'medical_liens_formatted': formatCurrency(medicalTotal),
          'Medical Liens': formatCurrency(medicalTotal),
          
          // Client net
          'client_net': clientNet,
          'client_net_amount': clientNet,
          'client_net_amount_formatted': formatCurrency(clientNet),
          'Client Net': formatCurrency(clientNet),
          'Client Net Amount': formatCurrency(clientNet),
          
          // Settlement date
          'settlement_date': settlementData.settlement_date ? formatDate(settlementData.settlement_date) : '',
          'Settlement Date': settlementData.settlement_date ? formatDate(settlementData.settlement_date) : '',
          
          // Settlement status
          'settlement_status': settlementData.status || 'pending',
          'Settlement Status': settlementData.status || 'pending',
          
          // Settlement type (if provided)
          'settlement_type': settlementData.settlement_type || '',
          'Settlement Type': settlementData.settlement_type || '',
          
          // Notes (if provided)
          'settlement_notes': settlementData.notes || '',
          'Settlement Notes': settlementData.notes || ''
        });
        
        console.log('💰 Settlement data added to payload:', {
          gross_settlement: settlementAmount,
          attorney_fee: attorneyFee,
          case_expenses: caseExpenses,
          medical_liens: medicalTotal,
          client_net: clientNet
        });
      } else {
        console.log('⚠️ No settlement data found for case', casefileId);
      }
    } catch (error) {
      console.warn('⚠️ Error fetching settlement data:', error);
      // Don't throw - continue without settlement data
    }

    // Get recipient email based on document type
    const recipientEmail = getRecipientEmail(
      templateType,
      {
        client,
        firstPartyClaim,
        thirdPartyClaim,
        healthClaim: caseData.healthClaim,
        healthAdjuster: caseData.healthClaim?.health_adjuster,
        medicalProvider: relevantProviders?.[0]?.medical_provider
      },
      selectedPartyForDocument || undefined
    );

    // Add recipient_email to payload (static key, dynamic value)
    payload.recipient_email = recipientEmail;

    if (recipientEmail) {
      console.log('📧 Recipient email:', recipientEmail);
    } else {
      console.warn('⚠️ No recipient email found for document type:', templateType);
    }

    console.log('📋 Prepared complete payload for', templateType);
    console.log('📋 Payload size:', JSON.stringify(payload).length, 'bytes');
    console.log('📋 Payload fields:', Object.keys(payload).length, 'fields');
    console.log('📋 Payload:', payload);
    
    return payload;
  };

  const prepareDocumentPayloadWithMode = async (
    templateType: string,
    generationMode: GenerationType,
    targetClientId?: number,
    documentTypeName?: string
  ) => {
    // Always call the original prepareDocumentPayload which sends ALL case data
    const basePayload = await prepareDocumentPayload(templateType);
    
    // Add generation_mode and document_name based on mode
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
    
    // Add generation_mode and document_name to the existing full payload
    const payload = {
      ...basePayload,
      generation_mode: generationMode,
      document_name: documentName,
    };
    
    console.log('📦 Prepared payload with generation mode:', generationMode);
    console.log('📋 Document name:', documentName);
    
    return payload;
  };

  const savePDFToStorage = async (base64Data: string, filename: string, documentName: string) => {
    try {
      console.log('💾 Starting PDF save process...');
      console.log('💾 Filename:', filename);
      console.log('💾 Document:', documentName);

      const base64WithoutPrefix = base64Data.replace(/^data:.*?;base64,/, '');
      const binaryString = atob(base64WithoutPrefix);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      console.log('💾 Blob created, size:', blob.size, 'bytes');

      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `case-${casefileId}/${sanitizedFilename}_${timestamp}.pdf`;

      console.log('💾 Uploading to storage path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ PDF uploaded to storage successfully:', uploadData);

      const { data: urlData } = supabase.storage
        .from('case-documents')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 Public URL generated:', publicUrl);

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

      console.log('💾 Inserting document record:', documentRecord);

      const { error: dbError } = await supabase
        .from('documents')
        .insert(documentRecord);

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        throw dbError;
      }

      console.log('✅ PDF saved to documents table');

      // PDF is saved to database and storage - no automatic download
      console.log('✅ PDF available in documents tab for manual download');

      return publicUrl;
    } catch (error) {
      console.error('Error saving/downloading PDF:', error);
      throw error;
    }
  };

  const createWorkLogEntry = async (documentName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'Admin';

      const description = documentNotes.trim()
        ? `Generated ${documentName}. Notes: ${documentNotes.trim()}`
        : `Generated ${documentName}`;

      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: description,
        timestamp: new Date().toISOString(),
        user_name: userName
      });

      console.log('✅ Work log entry created for', documentName);
    } catch (error) {
      console.error('Error creating work log:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedDocumentId) {
      onShowToast('Please select a document type', 'error');
      return;
    }

    const selectedDoc = documentTypes.find(doc => doc.id === selectedDocumentId);
    if (!selectedDoc) {
      onShowToast('Document type not found', 'error');
      return;
    }

    const templateRule = DOCUMENT_TEMPLATES[selectedDoc.template_type];
    if (!templateRule) {
      onShowToast('Template configuration not found', 'error');
      return;
    }

    // Validate client selection for per_client templates
    if (templateRule.generationType === 'per_client' && selectedClientIds.length === 0) {
      onShowToast('Please select at least one client', 'error');
      return;
    }

    // Check if document requires party selection
    const requiresPartySelection = [
      'cotton_counter_demand',
      'cotton_offer_acceptance',
      'cotton_payment_instructions'
    ].includes(selectedDoc.template_type);

    if (requiresPartySelection && !selectedPartyForDocument) {
      setPendingDocumentType(selectedDoc.template_type);
      setShowPartySelectionModal(true);
      return;
    }

    // Proceed with generation
    await proceedWithGeneration(selectedDoc, templateRule);
  };

  const proceedWithGeneration = async (selectedDoc: DocumentType, templateRule: any) => {
    console.log('🚀 Starting document generation...');
    console.log('📋 Selected document:', selectedDoc);
    console.log('📊 Template rule:', templateRule);
    console.log('👥 Selected clients:', selectedClientIds);
    if (selectedPartyForDocument) {
      console.log('🎯 Selected party:', selectedPartyForDocument);
    }
    
    setGenerating(true);

    const statuses: GenerationStatus[] = [];

    // Handle generation based on template rule
    if (templateRule.generationType === 'per_client') {
      // Create one status per selected client
      selectedClientIds.forEach(clientId => {
        const client = clients.find(c => c.id === clientId);
        const firstName = client?.firstName || client?.first_name || '';
        const lastName = client?.lastName || client?.last_name || '';
          statuses.push({
          documentId: `${selectedDoc.id}-${clientId}`,
          documentName: `${selectedDoc.name} - ${firstName} ${lastName}`.trim(),
          status: 'pending' as const
        });
      });
    } else if (templateRule.generationType === 'all_clients') {
      // Single status for all-clients document
      statuses.push({
        documentId: selectedDoc.id,
        documentName: selectedDoc.name,
        status: 'pending' as const
        });
      } else {
      // Case-level document
        statuses.push({
        documentId: selectedDoc.id,
        documentName: selectedDoc.name,
          status: 'pending' as const
        });
      }

    setGenerationStatuses(statuses);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statuses.length; i++) {
      const status = statuses[i];
      const doc = selectedDoc; // We're only processing one document type

      if (!doc) {
        console.error('Document not found for status:', status);
        continue;
      }

      // Extract client ID from documentId if per_client mode
      let targetClientId: number | undefined;
      if (templateRule.generationType === 'per_client') {
        const match = status.documentId.match(/-(\d+)$/);
        if (match) {
          targetClientId = parseInt(match[1]);
        }
      }

      setGenerationStatuses(prev =>
        prev.map(s =>
          s.documentId === status.documentId
            ? { ...s, status: 'generating' }
            : s
        )
      );

      try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📄 Processing document:', status.documentName);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 Generation mode:', templateRule.generationType);
        console.log('👤 Target client ID:', targetClientId);

        const payload = await prepareDocumentPayloadWithMode(
          doc.template_type,
          templateRule.generationType,
          targetClientId,
          doc.name // Pass document type name for proper naming
        );

        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

        if (!webhookUrl) {
          throw new Error('Webhook URL not configured');
        }

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
        console.log('📊 Response status text:', response.statusText);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

        const contentType = response.headers.get('content-type');
        console.log('📄 Content-Type:', contentType);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          
          // Parse error response
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMessage = errorJson.message;
              
              // Special handling for webhook not registered error
              if (errorJson.code === 404 && errorMessage.includes('not registered')) {
                errorMessage = 'Webhook not active. Please activate the n8n workflow and try again.';
              }
            }
          } catch (e) {
            // Use default error message
          }
          
          throw new Error(errorMessage);
        }

        let result;
        if (contentType?.includes('application/json')) {
          console.log('📦 Response is JSON');
          const responseText = await response.text();
          console.log('📥 Raw response text:', responseText);
          
          if (!responseText || responseText.trim() === '') {
            console.error('❌ Empty JSON response from n8n');
            throw new Error('Received empty response from webhook. The n8n workflow may not be active or configured correctly.');
          }
          
          try {
            result = JSON.parse(responseText);
          console.log('📥 JSON Response:', result);
          console.log('📥 Response keys:', Object.keys(result));
          } catch (parseError) {
            console.error('❌ Failed to parse JSON:', parseError);
            console.error('📦 Response text:', responseText);
            throw new Error('Invalid JSON response from webhook. Please check n8n workflow configuration.');
          }
        } else if (contentType?.includes('application/pdf')) {
          console.log('📦 Response is direct PDF');
          const pdfBlob = await response.blob();
          console.log('📏 PDF Blob size:', pdfBlob.size);
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64 = btoa(binary);
          result = { pdf_base64: base64, filename: `${doc.template_type}_${Date.now()}.pdf` };
          console.log('✅ Converted PDF blob to base64');
        } else {
          const text = await response.text();
          console.log('📦 Response is text/unknown:', text.substring(0, 200));
          
          if (!text || text.trim() === '') {
            console.error('❌ Empty text response from n8n');
            throw new Error('Received empty response from webhook. The n8n workflow may not be active or configured correctly.');
          }
          
          try {
            result = JSON.parse(text);
            console.log('✅ Parsed text as JSON:', result);
          } catch (e) {
            console.error('❌ Failed to parse as JSON:', e);
            throw new Error('Response is not JSON or PDF: ' + text.substring(0, 100));
          }
        }

        let pdfBase64 = null;
        let filename = `${doc.template_type}_${Date.now()}.pdf`;

        if (result.pdf_base64) {
          console.log('✅ Found pdf_base64');
          pdfBase64 = result.pdf_base64;
          filename = result.filename || filename;
        } else if (result.pdf) {
          console.log('✅ Found pdf');
          pdfBase64 = result.pdf;
          filename = result.filename || filename;
        } else if (result.data) {
          console.log('✅ Found data');
          pdfBase64 = result.data;
          filename = result.filename || filename;
        } else if (result.pdf_url || result.url) {
          console.log('✅ Found URL:', result.pdf_url || result.url);
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
          console.log('✅ Downloaded and converted PDF from URL');
        } else if (result.file && result.file.data) {
          console.log('✅ Found file.data');
          pdfBase64 = result.file.data;
          filename = result.file.filename || filename;
        } else {
          console.error('❌ NO PDF FOUND IN RESPONSE');
          console.error('📦 Full response structure:', JSON.stringify(result, null, 2));
          throw new Error('PDF not found in n8n response. Check console for full response structure.');
        }

        if (pdfBase64) {
          console.log('📝 Using filename:', filename);
          await savePDFToStorage(pdfBase64, filename, doc.name);
        }

        await createWorkLogEntry(doc.name);

        // Auto-update case stage/status based on document type
        const stageUpdate = DOCUMENT_STAGE_MAP[doc.template_type];
        const demandStatus = DOCUMENT_STATUS_MAP[doc.template_type];
        
        if (stageUpdate || demandStatus) {
          try {
            // Get current case data to check stage
            const { data: currentCase } = await supabase
              .from('casefiles')
              .select('stage, status')
              .eq('id', casefileId)
              .single();

            if (currentCase) {
              let newStage = currentCase.stage;
              let newStatus = currentCase.status;
              
              // Check DOCUMENT_STAGE_MAP first (LORs, Engagement, HIPAA, Subro)
              if (stageUpdate) {
                newStage = stageUpdate.stage;
                newStatus = stageUpdate.status;
                console.log(`📋 Stage update from DOCUMENT_STAGE_MAP: ${newStage} - ${newStatus}`);
              }
              // Otherwise check demand status map
              else if (demandStatus) {
                newStatus = demandStatus;
                // If status is in Demand stage, ensure stage is set to Demand
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

              // Update case status and stage
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
              } else {
                // Log status change to work_logs
                const { data: { user } } = await supabase.auth.getUser();
                const userName = user?.email || 'Admin';
                
                await supabase.from('work_logs').insert({
                  casefile_id: casefileId,
                  description: `Stage/status automatically updated to "${newStage} - ${newStatus}" after generating ${doc.name}`,
                  timestamp: new Date().toISOString(),
                  user_name: userName
                });

                console.log(`✅ Case stage/status updated to "${newStage} - ${newStatus}"`);
              }
            }
          } catch (statusError) {
            console.error('Error updating case status:', statusError);
            // Don't fail document generation if status update fails
          }
        }

        setGenerationStatuses(prev =>
          prev.map(s =>
            s.documentId === status.documentId
              ? { ...s, status: 'success' }
              : s
          )
        );

        successCount++;
      } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERROR generating', status.documentName);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Error object:', error);

        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setGenerationStatuses(prev =>
          prev.map(s =>
            s.documentId === status.documentId
              ? { ...s, status: 'error', error: errorMessage }
              : s
          )
        );

        errorCount++;
      }
    }

    setGenerating(false);

    if (successCount > 0) {
      onShowToast(
        `Successfully generated ${successCount} document${successCount > 1 ? 's' : ''}`,
        'success'
      );
    }

    if (errorCount > 0) {
      onShowToast(
        `Failed to generate ${errorCount} document${errorCount > 1 ? 's' : ''}`,
        'error'
      );
    }
  };

  const handleClose = () => {
    if (!generating) {
      onClose();
      setTimeout(() => {
        setGenerationStatuses([]);
        setSelectedDocuments([]);
        setDocumentNotes('');
      }, 300);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="lg">
      <div className="min-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Generate Documents</h2>
              <p className="text-sm text-gray-500">Select documents to generate</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={generating}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <AlertCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Loading case data...</p>
              </div>
            </div>
          ) : !generating && generationStatuses.length === 0 ? (
          <>
            {/* Client Selection - Show based on selected document's template rule */}
            {selectedDocumentId && (() => {
              const selectedDoc = documentTypes.find(d => d.id === selectedDocumentId);
              if (!selectedDoc) return null;
              
              const templateRule = DOCUMENT_TEMPLATES[selectedDoc.template_type];
              if (!templateRule) return null;

              // Per-client: show checkboxes
              if (templateRule.generationType === 'per_client' && clients.length > 1) {
                return (
                  <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Select Clients</h3>
                <button
                        onClick={handleSelectAllClients}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                        {selectedClientIds.length === clients.length ? 'Deselect All' : 'Select All'}
                </button>
                    </div>
                    <div className="space-y-2">
                      {clients.map((client) => {
                        const isSelected = selectedClientIds.includes(client.id);
                        return (
                          <label
                            key={client.id}
                            className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleClient(client.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {(client.firstName || client.first_name || 'Client')} {(client.lastName || client.last_name || '')}
                                {(client.isDriver || client.is_driver) && ' (Driver)'}
                              </p>
                            </div>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              // All-clients: show static list
              if (templateRule.generationType === 'all_clients' && clients.length > 1) {
                return (
                  <div className="space-y-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      This document includes all clients
                    </h3>
                    <ul className="space-y-1">
                      {clients.map((client) => (
                        <li key={client.id} className="text-sm text-gray-700">
                          • {(client.firstName || client.first_name || 'Client')} {(client.lastName || client.last_name || '')}
                          {(client.isDriver || client.is_driver) && ' (Driver)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              return null;
            })()}

            {/* Document Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Select Document Type</h3>
              </div>

              <div className="space-y-6">
                {/* Letters of Representation */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Letters of Representation</h4>
                  <div className="grid gap-3">
                    {documentTypes
                      .filter(doc => doc.id.includes('lor'))
                      .map((doc) => {
                        const isSelected = selectedDocumentId === doc.id;
                        return (
                          <label
                            key={doc.id}
                            className={`
                              group relative flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2
                              ${isSelected
                                ? 'bg-blue-50 border-blue-500 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDocument(doc.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            
                            <div className="text-2xl">{doc.icon}</div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                {doc.name}
                              </h4>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                {doc.description}
                              </p>
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Medical Records */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Medical Records</h4>
                  <div className="grid gap-3">
                    {documentTypes
                      .filter(doc => doc.id.includes('hipaa'))
                      .map((doc) => {
                        const isSelected = selectedDocumentId === doc.id;
                        return (
                          <label
                            key={doc.id}
                            className={`
                              group relative flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2
                              ${isSelected
                                ? 'bg-green-50 border-green-500 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDocument(doc.id)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                            />
                            
                            <div className="text-2xl">{doc.icon}</div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                                {doc.name}
                              </h4>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                                {doc.description}
                              </p>
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Demand Letters */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Demand Letters</h4>
                  <div className="grid gap-3">
                    {documentTypes
                      .filter(doc => doc.id.includes('demand'))
                      .map((doc) => {
                        const isSelected = selectedDocumentId === doc.id;
                        return (
                          <label
                            key={doc.id}
                            className={`
                              group relative flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2
                              ${isSelected
                                ? 'bg-yellow-50 border-yellow-500 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDocument(doc.id)}
                              className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
                            />
                            
                            <div className="text-2xl">{doc.icon}</div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm ${isSelected ? 'text-yellow-900' : 'text-gray-900'}`}>
                                {doc.name}
                              </h4>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-yellow-700' : 'text-gray-600'}`}>
                                {doc.description}
                              </p>
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-yellow-600" />
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Settlement Documents */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Settlement Documents</h4>
                  <div className="grid gap-3">
                    {documentTypes
                      .filter(doc => doc.id.includes('settlement') || doc.id.includes('payment') || doc.id.includes('offer'))
                      .map((doc) => {
                        const isSelected = selectedDocumentId === doc.id;
                        return (
                          <label
                            key={doc.id}
                            className={`
                              group relative flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2
                              ${isSelected
                                ? 'bg-purple-50 border-purple-500 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDocument(doc.id)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                            />
                            
                            <div className="text-2xl">{doc.icon}</div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                                {doc.name}
                              </h4>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                                {doc.description}
                              </p>
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-purple-600" />
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Client Communications */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Client Communications</h4>
                  <div className="grid gap-3">
                    {documentTypes
                      .filter(doc => doc.id.includes('withdrawal') || doc.id.includes('engagement'))
                      .map((doc) => {
                        const isSelected = selectedDocumentId === doc.id;
                        return (
                          <label
                            key={doc.id}
                            className={`
                              group relative flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2
                              ${isSelected
                                ? 'bg-orange-50 border-orange-500 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDocument(doc.id)}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                            />
                            
                            <div className="text-2xl">{doc.icon}</div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm ${isSelected ? 'text-orange-900' : 'text-gray-900'}`}>
                                {doc.name}
                              </h4>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-orange-700' : 'text-gray-600'}`}>
                                {doc.description}
                              </p>
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-orange-600" />
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Medical Provider Communications */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Medical Provider Communications</h4>
                  <div className="grid gap-3">
                    {documentTypes
                      .filter(doc => doc.id.includes('subro') || doc.id.includes('reduction'))
                      .map((doc) => {
                        const isSelected = selectedDocumentId === doc.id;
                        return (
                          <label
                            key={doc.id}
                            className={`
                              group relative flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2
                              ${isSelected
                                ? 'bg-teal-50 border-teal-500 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                              }
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleDocument(doc.id)}
                              className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-teal-500"
                            />
                            
                            <div className="text-2xl">{doc.icon}</div>
                            
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-medium text-sm ${isSelected ? 'text-teal-900' : 'text-gray-900'}`}>
                                {doc.name}
                              </h4>
                              <p className={`text-xs mt-0.5 ${isSelected ? 'text-teal-700' : 'text-gray-600'}`}>
                                {doc.description}
                              </p>
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-teal-600" />
                            )}
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Selection for HIPAA */}
            {selectedDocumentId === 'hipaa-request' && providers.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-900 mb-1">No Medical Providers Available</h4>
                    <p className="text-sm text-yellow-800">
                      This case has no medical bills or providers associated. Add medical providers to the medical tab first.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {selectedDocumentId === 'hipaa-request' && providers.length > 0 && selectedClientIds.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Medical Providers
                  </h3>
                  <button
                    onClick={handleSelectAllProviders}
                    className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                  >
                    {localSelectedProviders.length === providers.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {providers.map((provider) => {
                    const isSelected = localSelectedProviders.includes(provider.id);
                    return (
                      <label
                        key={provider.id}
                        className={`
                          group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2
                          ${isSelected
                            ? 'bg-green-50 border-green-500 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleProvider(provider.id)}
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                            {provider.name}
                          </h4>
                          <p className={`text-xs mt-0.5 ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                            {provider.address && `${provider.address}, `}
                            {provider.city && `${provider.city}, `}
                            {provider.state && `${provider.state} `}
                            {provider.zip && provider.zip}
                            {provider.phone && ` • ${provider.phone}`}
                          </p>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </label>
                    );
                  })}
                </div>

                {localSelectedProviders.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        {localSelectedProviders.length} provider{localSelectedProviders.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      A separate HIPAA authorization will be generated for each selected provider.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info Box - Only show when documents are selected */}
            {selectedDocuments.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Ready to generate {selectedDocuments.includes('hipaa-request') && localSelectedProviders.length > 0 
                        ? `${localSelectedProviders.length} HIPAA document${localSelectedProviders.length > 1 ? 's' : ''}${selectedDocuments.length > 1 ? ' + other documents' : ''}`
                        : `${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''}`
                      }
                    </h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-600 rounded-full" />
                        <span>PDFs will download automatically</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-blue-600 rounded-full" />
                        <span>Saved to Documents tab</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
          ) : null}

        {/* Progress View */}
        {generationStatuses.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Progress</h3>
              <span className="text-sm text-gray-600">
                {generationStatuses.filter(s => s.status === 'success').length} of {generationStatuses.length}
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {generationStatuses.map((status) => (
                <div
                  key={status.documentId}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                    ${status.status === 'success' ? 'bg-green-50 border-green-200' :
                      status.status === 'error' ? 'bg-red-50 border-red-200' :
                      status.status === 'generating' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'}
                  `}
                >
                  <div className="flex-shrink-0">
                    {status.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    )}
                    {status.status === 'generating' && (
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    )}
                    {status.status === 'success' && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {status.status === 'error' && (
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      status.status === 'success' ? 'text-green-900' :
                      status.status === 'error' ? 'text-red-900' :
                      status.status === 'generating' ? 'text-blue-900' :
                      'text-gray-700'
                    }`}>
                      {status.documentName}
                    </p>
                    {status.error && (
                      <p className="text-xs text-red-700 mt-1 line-clamp-2">{status.error}</p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    {status.status === 'generating' && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                        Generating
                      </span>
                    )}
                    {status.status === 'success' && (
                      <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Complete
                      </span>
                    )}
                    {status.status === 'error' && (
                      <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        </div>

        {/* Notes Section - At the bottom before action buttons */}
        <div className="px-6 pb-4 border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Generation Notes (Optional)
          </label>
          <textarea
            value={documentNotes}
            onChange={(e) => setDocumentNotes(e.target.value)}
            placeholder="Add any notes about this document generation... (e.g., special instructions, follow-up actions, or important details about these documents)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            disabled={generating}
          />
          <p className="text-xs text-gray-500 mt-1">
            Notes will be saved to the case work log after generation
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 pt-4 border-t border-gray-200">
          {!generating && generationStatuses.length === 0 ? (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={!selectedDocumentId || (selectedDocumentId === 'hipaa-request' && (localSelectedProviders.length === 0 || providers.length === 0))}
                className={`
                  flex-1 px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
                  ${!selectedDocumentId || (selectedDocumentId === 'hipaa-request' && (localSelectedProviders.length === 0 || providers.length === 0))
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                  }
                `}
              >
                <FileText className="w-4 h-4" />
                <span>
                  {!selectedDocumentId
                    ? 'Select a Document'
                    : selectedDocumentId === 'hipaa-request' && providers.length === 0
                    ? 'No Providers Available'
                    : selectedDocumentId === 'hipaa-request' && localSelectedProviders.length === 0
                    ? 'Select Providers'
                    : 'Generate Document'
                  }
                </span>
              </button>
            </>
          ) : generating ? (
            <button
              disabled
              className="w-full px-4 py-3 bg-gray-200 text-gray-600 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating...</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setDocumentNotes('');
                onSuccess();
                handleClose();
              }}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm hover:shadow-md"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* Party Selection Modal */}
      {showPartySelectionModal && (
        <Modal
          isOpen={showPartySelectionModal}
          onClose={() => {
            setShowPartySelectionModal(false);
            setPendingDocumentType(null);
          }}
          title="Select Recipient"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              This document can be sent to either the 1st Party or 3rd Party auto insurance adjuster. Please select the recipient:
            </p>

            <div className="space-y-3">
              {/* 1st Party Option */}
              <button
                onClick={() => {
                  setSelectedPartyForDocument('first');
                  setShowPartySelectionModal(false);
                  const docType = pendingDocumentType;
                  setPendingDocumentType(null);
                  // Trigger generation after selection
                  setTimeout(() => {
                    if (docType) {
                      handleGenerate();
                    }
                  }, 100);
                }}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">1st Party Auto Insurance Adjuster</h4>
                    {caseData?.firstPartyClaim?.adjuster_name && (
                      <p className="text-sm text-gray-600 mt-1">
                        {caseData.firstPartyClaim.adjuster_name}
                      </p>
                    )}
                    {caseData?.firstPartyClaim?.adjuster_email ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {caseData.firstPartyClaim.adjuster_email}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 mt-1">No email address on file</p>
                    )}
                    {caseData?.firstPartyClaim?.auto_insurance?.name && (
                      <p className="text-xs text-gray-500 mt-1">
                        {caseData.firstPartyClaim.auto_insurance.name}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
              </button>

              {/* 3rd Party Option */}
              <button
                onClick={async () => {
                  setSelectedPartyForDocument('third');
                  setShowPartySelectionModal(false);
                  const docType = pendingDocumentType;
                  const selectedDoc = documentTypes.find(doc => doc.template_type === docType);
                  const templateRule = selectedDoc ? DOCUMENT_TEMPLATES[selectedDoc.template_type] : null;
                  setPendingDocumentType(null);
                  // Trigger generation after selection
                  if (selectedDoc && templateRule) {
                    await proceedWithGeneration(selectedDoc, templateRule);
                  }
                }}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">3rd Party Auto Insurance Adjuster</h4>
                    {caseData?.thirdPartyClaim?.adjuster_name && (
                      <p className="text-sm text-gray-600 mt-1">
                        {caseData.thirdPartyClaim.adjuster_name}
                      </p>
                    )}
                    {caseData?.thirdPartyClaim?.adjuster_email ? (
                      <p className="text-xs text-gray-500 mt-1">
                        {caseData.thirdPartyClaim.adjuster_email}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 mt-1">No email address on file</p>
                    )}
                    {caseData?.thirdPartyClaim?.auto_insurance?.name && (
                      <p className="text-xs text-gray-500 mt-1">
                        {caseData.thirdPartyClaim.auto_insurance.name}
                      </p>
                    )}
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPartySelectionModal(false);
                  setPendingDocumentType(null);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
