"use client";

import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Loader2, X, Users, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { DOCUMENT_TEMPLATES } from '@/lib/config/documentTemplates';
import { prepareDocumentPayloadWithMode, callN8nWebhook, savePDFToStorage, createWorkLogEntry, updateCaseStatus, updateThirdPartyClaimLOR } from '@/lib/documentGeneration';
import type { CaseData } from '@/lib/documentGeneration';
import type { GenerationType } from '@/lib/config/documentTemplates';

interface DocumentGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  casefileId: number;
  clients?: any[];
  defendants?: any[];
  medicalBills?: any[];
  onSuccess?: () => void;
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
];

export default function DocumentGenerationModal({
  isOpen,
  onClose,
  casefileId,
  clients = [],
  defendants = [],
  medicalBills = [],
  onSuccess
}: DocumentGenerationModalProps) {
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([]);
  const [localSelectedProviders, setLocalSelectedProviders] = useState<number[]>([]);
  const [providers, setProviders] = useState<MedicalProvider[]>([]);
  const [documentNotes, setDocumentNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationStatuses, setGenerationStatuses] = useState<GenerationStatus[]>([]);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDocumentId(null);
      setSelectedClientIds(clients.length > 0 ? clients.map(c => c.id) : []);
      setLocalSelectedProviders([]);
      setDocumentNotes('');
      setGenerationStatuses([]);
      fetchAllCaseData();
    }
  }, [isOpen, casefileId, clients]);

  // Rebuild providers when HIPAA is selected and clients change
  useEffect(() => {
    if (selectedDocumentId !== 'hipaa-request' || !caseData) return;

    const filteredBills = (caseData.medicalBills || []).filter(b =>
      selectedClientIds.length === 0 ? true : selectedClientIds.includes(b.client_id)
    );

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
    setProviders(uniqueFromBills);
    setLocalSelectedProviders(prev => prev.filter(id => uniqueFromBills.some(p => p.id === id)));
  }, [selectedDocumentId, JSON.stringify(selectedClientIds), !!caseData]);

  const fetchAllCaseData = async () => {
    try {
      setLoadingData(true);
      const selectedClient = clients?.[0] || null;
      const selectedDefendant = defendants?.[0] || null;

      // Fetch casefile
      const { data: casefile, error: casefileError } = await supabase
        .from('casefiles')
        .select('*')
        .eq('id', casefileId)
        .maybeSingle();

      if (casefileError) throw casefileError;
      if (!casefile) throw new Error('Case not found');

      // Fetch medical bills
      let medicalBillsList: any[] = [];
      if (clients.length > 0) {
        const { data: bills, error: billsError } = await supabase
          .from('medical_bills')
          .select(`
            *,
            medical_provider:medical_providers(*)
          `)
          .in('client_id', clients.map(c => c.id));

        if (billsError) throw billsError;
        medicalBillsList = bills || [];
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
        .select('*, auto_insurance:auto_insurance_id(*), auto_adjusters(*)')
        .eq('casefile_id', casefileId)
        .maybeSingle();

      // Fetch health claim
      const { data: healthClaim } = selectedClient ? await supabase
        .from('health_claims')
        .select('*, health_insurance:health_insurance_id(*), health_adjusters(*)')
        .eq('client_id', selectedClient.id)
        .maybeSingle() : { data: null };

      // Fetch third party claim
      const { data: thirdPartyClaim } = selectedDefendant ? await supabase
        .from('third_party_claims')
        .select('*, auto_insurance:auto_insurance_id(*), auto_adjusters(*)')
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
    } catch (error) {
      console.error('❌ Error fetching case data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleToggleDocument = (docId: string) => {
    setSelectedDocumentId(prev => prev === docId ? null : docId);
  };

  const handleToggleClient = (clientId: number) => {
    setSelectedClientIds(prev =>
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSelectAllClients = () => {
    if (selectedClientIds.length === clients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(clients.map(c => c.id));
    }
  };

  const handleToggleProvider = (providerId: number) => {
    setLocalSelectedProviders(prev =>
      prev.includes(providerId) ? prev.filter(id => id !== providerId) : [...prev, providerId]
    );
  };

  const handleSelectAllProviders = () => {
    if (localSelectedProviders.length === providers.length) {
      setLocalSelectedProviders([]);
    } else {
      setLocalSelectedProviders(providers.map(p => p.id));
    }
  };

  const handleGenerate = async () => {
    if (!selectedDocumentId) {
      alert('Please select a document type');
      return;
    }

    const selectedDoc = documentTypes.find(doc => doc.id === selectedDocumentId);
    if (!selectedDoc) {
      alert('Document type not found');
      return;
    }

    const templateRule = DOCUMENT_TEMPLATES[selectedDoc.template_type];
    if (!templateRule) {
      alert('Template configuration not found');
      return;
    }

    // Validate client selection for per_client templates
    if (templateRule.generationType === 'per_client' && selectedClientIds.length === 0) {
      alert('Please select at least one client');
      return;
    }

    // Validate provider selection for HIPAA
    if (selectedDoc.id === 'hipaa-request' && localSelectedProviders.length === 0) {
      alert('Please select at least one medical provider');
      return;
    }

    if (!caseData) {
      alert('Case data not loaded');
      return;
    }

    setGenerating(true);

    const statuses: GenerationStatus[] = [];

    // Handle generation based on template rule
    if (templateRule.generationType === 'per_client') {
      if (selectedDoc.id === 'hipaa-request') {
        // HIPAA: one document per provider per client
        selectedClientIds.forEach(clientId => {
          localSelectedProviders.forEach(providerId => {
            const provider = providers.find(p => p.id === providerId);
            statuses.push({
              documentId: `${selectedDoc.id}-${clientId}-${providerId}`,
              documentName: `${selectedDoc.name} - ${provider?.name || 'Provider'}`,
              status: 'pending',
              providerId,
              providerName: provider?.name
            });
          });
        });
      } else {
        // Other per-client documents: one per client
        selectedClientIds.forEach(clientId => {
          const client = clients.find(c => c.id === clientId);
          const firstName = client?.firstName || client?.first_name || '';
          const lastName = client?.lastName || client?.last_name || '';
          statuses.push({
            documentId: `${selectedDoc.id}-${clientId}`,
            documentName: `${selectedDoc.name} - ${firstName} ${lastName}`.trim(),
            status: 'pending'
          });
        });
      }
    } else if (templateRule.generationType === 'all_clients') {
      statuses.push({
        documentId: selectedDoc.id,
        documentName: selectedDoc.name,
        status: 'pending'
      });
    }

    setGenerationStatuses(statuses);

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      alert('Webhook URL not configured. Please set NEXT_PUBLIC_N8N_WEBHOOK_URL in your environment variables.');
      setGenerating(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const status of statuses) {
      setGenerationStatuses(prev =>
        prev.map(s =>
          s.documentId === status.documentId
            ? { ...s, status: 'generating' }
            : s
        )
      );

      try {
        // Extract client ID and provider ID from documentId
        let targetClientId: number | undefined;
        let specificProviderId: number | undefined;

        if (templateRule.generationType === 'per_client') {
          const match = status.documentId.match(/-(\d+)(?:-(\d+))?$/);
          if (match) {
            targetClientId = parseInt(match[1]);
            if (match[2]) {
              specificProviderId = parseInt(match[2]);
            }
          }
        }

        const payload = await prepareDocumentPayloadWithMode(
          casefileId,
          selectedDoc.template_type,
          templateRule.generationType,
          caseData,
          clients,
          targetClientId,
          selectedDoc.name,
          specificProviderId
        );

        const { pdfBase64, filename } = await callN8nWebhook(webhookUrl, payload);

        await savePDFToStorage(casefileId, pdfBase64, filename, status.documentName);
        await createWorkLogEntry(casefileId, status.documentName, documentNotes);
        await updateCaseStatus(casefileId, selectedDoc.template_type);

        // Update third party claim LOR tracking if applicable
        if (selectedDoc.template_type === 'cotton_3rd_party_lor' && caseData.thirdPartyClaim) {
          await updateThirdPartyClaimLOR(caseData.thirdPartyClaim.id);
        }

        setGenerationStatuses(prev =>
          prev.map(s =>
            s.documentId === status.documentId
              ? { ...s, status: 'success' }
              : s
          )
        );

        successCount++;
      } catch (error: any) {
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
      alert(`Successfully generated ${successCount} document${successCount > 1 ? 's' : ''}`);
      onSuccess?.();
    }

    if (errorCount > 0) {
      alert(`Failed to generate ${errorCount} document${errorCount > 1 ? 's' : ''}`);
    }
  };

  const handleClose = () => {
    if (!generating) {
      onClose();
      setTimeout(() => {
        setGenerationStatuses([]);
        setSelectedDocumentId(null);
        setDocumentNotes('');
      }, 300);
    }
  };

  if (!isOpen) return null;

  const selectedDoc = selectedDocumentId ? documentTypes.find(d => d.id === selectedDocumentId) : null;
  const templateRule = selectedDoc ? DOCUMENT_TEMPLATES[selectedDoc.template_type] : null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card w-full max-w-4xl rounded-xl shadow-lg border border-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Generate Documents</h2>
              <p className="text-sm text-muted-foreground">Select documents to generate</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={generating}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading case data...</p>
              </div>
            </div>
          ) : !generating && generationStatuses.length === 0 ? (
            <>
              {/* Client Selection */}
              {selectedDoc && templateRule && templateRule.generationType === 'per_client' && clients.length > 1 && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Select Clients</h3>
                    <button
                      onClick={handleSelectAllClients}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
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
                          className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleClient(client.id)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {(client.firstName || client.first_name || 'Client')} {(client.lastName || client.last_name || '')}
                              {(client.isDriver || client.is_driver) && ' (Driver)'}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Clients Notice */}
              {selectedDoc && templateRule && templateRule.generationType === 'all_clients' && clients.length > 1 && (
                <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                    This document includes all clients
                  </h3>
                  <ul className="space-y-1">
                    {clients.map((client) => (
                      <li key={client.id} className="text-sm text-muted-foreground">
                        • {(client.firstName || client.first_name || 'Client')} {(client.lastName || client.last_name || '')}
                        {(client.isDriver || client.is_driver) && ' (Driver)'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Document Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Select Document Type</h3>
                <div className="grid gap-3">
                  {documentTypes.map((doc) => {
                    const isSelected = selectedDocumentId === doc.id;
                    return (
                      <label
                        key={doc.id}
                        className={`
                          group relative flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all border-2
                          ${isSelected
                            ? 'bg-primary/10 border-primary shadow-sm'
                            : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleDocument(doc.id)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                        />
                        <div className="text-2xl">{doc.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {doc.name}
                          </h4>
                          <p className={`text-xs mt-0.5 ${isSelected ? 'text-primary/80' : 'text-muted-foreground'}`}>
                            {doc.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Provider Selection for HIPAA */}
              {selectedDocumentId === 'hipaa-request' && providers.length === 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-300 mb-1">No Medical Providers Available</h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-400">
                        This case has no medical bills or providers associated. Add medical providers to the medical tab first.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedDocumentId === 'hipaa-request' && providers.length > 0 && selectedClientIds.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Medical Providers
                    </h3>
                    <button
                      onClick={handleSelectAllProviders}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
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
                              ? 'bg-primary/10 border-primary shadow-sm'
                              : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleProvider(provider.id)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {provider.name}
                            </h4>
                            <p className={`text-xs mt-0.5 ${isSelected ? 'text-primary/80' : 'text-muted-foreground'}`}>
                              {provider.address && `${provider.address}, `}
                              {provider.city && `${provider.city}, `}
                              {provider.state && `${provider.state} `}
                              {provider.zip && provider.zip}
                              {provider.phone && ` • ${provider.phone}`}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          )}
                        </label>
                      );
                    })}
                  </div>

                  {localSelectedProviders.length > 0 && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          {localSelectedProviders.length} provider{localSelectedProviders.length > 1 ? 's' : ''} selected
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        A separate HIPAA authorization will be generated for each selected provider.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
                <textarea
                  value={documentNotes}
                  onChange={(e) => setDocumentNotes(e.target.value)}
                  placeholder="Add any notes about this document generation..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                />
              </div>
            </>
          ) : null}

          {/* Progress View */}
          {generationStatuses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {generationStatuses.filter(s => s.status === 'success').length} of {generationStatuses.length}
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {generationStatuses.map((status) => (
                  <div
                    key={status.documentId}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                      ${status.status === 'success' ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900' :
                        status.status === 'error' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900' :
                        status.status === 'generating' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900' :
                        'bg-muted border-border'}
                    `}
                  >
                    <div className="flex-shrink-0">
                      {status.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full border-2 border-border" />
                      )}
                      {status.status === 'generating' && (
                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      )}
                      {status.status === 'success' && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {status.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{status.documentName}</p>
                      {status.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{status.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={handleClose}
            disabled={generating}
            className="px-4 py-2 border border-border hover:bg-muted rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Cancel'}
          </button>
          {!generating && generationStatuses.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={!selectedDocumentId}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Documents
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
