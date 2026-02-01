import { useState, useEffect } from 'react';
import { useConfirmDialog } from '../../hooks/useConfirmDialog.tsx';
import Modal from '../common/Modal';
import FormInput from '../forms/FormInput';
import FormTextArea from '../forms/FormTextArea';
import { supabase, fetchAutoAdjusters, createAutoAdjuster, fetchAutoInsurers } from '../../utils/database';
import { updateFirstPartyClaimByCase, updateFirstPartyClaimByClient } from '../../services/update';
import { formatDateForInput } from '../../utils/formatting';
import AdjusterSelectionModal from '../intake/AdjusterSelectionModal';
import AddAutoInsuranceModal from '../forms/AddAutoInsuranceModal';
import EditAutoInsuranceModal from '../forms/EditAutoInsuranceModal';

interface EditFirstPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  firstPartyClaim: any;
  clientId?: number | null;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function EditFirstPartyModal({
  isOpen,
  onClose,
  firstPartyClaim,
  clientId,
  casefileId,
  onUpdate,
  onShowToast
}: EditFirstPartyModalProps) {
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  const [formData, setFormData] = useState({
    policy_number: '',
    claim_number: '',
    adjuster_name: '',
    adjuster_first_name: '',
    adjuster_last_name: '',
    adjuster_email: '',
    adjuster_phone: '',
    adjuster_fax: '',
    pip_available: '0',
    pip_used: '0',
    pip_exhausted_date: '',
    med_pay_available: '0',
    med_pay_used: '0',
    um_uim_coverage: '0',
    um_per_person: '0',
    um_per_accident: '0',
    property_damage: '0',
    claim_filed: false,
    claim_filed_date: '',
    demand_sent: false,
    demand_amount: '0',
    demand_date: '',
    offer_received: false,
    offer_amount: '0',
    offer_date: '',
    settlement_reached: false,
    settlement_amount: '0',
    settlement_date: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [autoAdjusters, setAutoAdjusters] = useState<any[]>([]);
  const [showAdjusterModal, setShowAdjusterModal] = useState(false);
  const [loadingAdjusters, setLoadingAdjusters] = useState(false);
  
  // Insurance CRUD state
  const [autoInsurers, setAutoInsurers] = useState<any[]>([]);
  const [selectedAutoInsuranceId, setSelectedAutoInsuranceId] = useState<number | null>(null);
  const [showAddInsuranceModal, setShowAddInsuranceModal] = useState(false);
  const [showEditInsuranceModal, setShowEditInsuranceModal] = useState(false);
  const [editingInsuranceId, setEditingInsuranceId] = useState<number | null>(null);
  const [loadingInsurers, setLoadingInsurers] = useState(false);
  const [insurerLoadError, setInsurerLoadError] = useState<string | null>(null);

  // Load insurers whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const loadInsurers = async () => {
        try {
          setLoadingInsurers(true);
          setInsurerLoadError(null);
          console.log('🔄 Loading auto insurers...');
          const insurers = await fetchAutoInsurers();
          console.log('✅ Loaded auto insurers:', insurers?.length || 0, 'insurers');
          setAutoInsurers(insurers || []);
          if (!insurers || insurers.length === 0) {
            console.warn('⚠️ No auto insurers found in database');
            setInsurerLoadError('No insurance companies found. Click "+ Add New" to create one.');
          }
        } catch (error: any) {
          console.error('❌ Error loading auto insurers:', error);
          const errorMessage = error?.message || 'Failed to load insurance companies';
          setInsurerLoadError(`Error: ${errorMessage}`);
          onShowToast('Failed to load insurance companies', 'error');
        } finally {
          setLoadingInsurers(false);
        }
      };
      loadInsurers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && firstPartyClaim) {
      setFormData({
        policy_number: firstPartyClaim.policy_number || '',
        claim_number: firstPartyClaim.claim_number || '',
        adjuster_name: firstPartyClaim.adjuster_name || '',
        adjuster_first_name: firstPartyClaim.adjuster_first_name || '',
        adjuster_last_name: firstPartyClaim.adjuster_last_name || '',
        adjuster_email: firstPartyClaim.adjuster_email || '',
        adjuster_phone: firstPartyClaim.adjuster_phone || '',
        adjuster_fax: firstPartyClaim.adjuster_fax || '',
        pip_available: firstPartyClaim.pip_available?.toString() || '0',
        pip_used: firstPartyClaim.pip_used?.toString() || '0',
        pip_exhausted_date: formatDateForInput(firstPartyClaim.pip_exhausted_date) || '',
        med_pay_available: firstPartyClaim.med_pay_available?.toString() || '0',
        med_pay_used: firstPartyClaim.med_pay_used?.toString() || '0',
        um_uim_coverage: firstPartyClaim.um_uim_coverage?.toString() || '0',
        um_per_person: (() => {
          // Check both um_uim_coverage and um_amount fields
          const umValue = (firstPartyClaim.um_uim_coverage?.toString() || firstPartyClaim.um_amount?.toString() || '0');
          if (umValue.includes('/')) {
            return umValue.split('/')[0].trim() || '0';
          }
          return '0';
        })(),
        um_per_accident: (() => {
          // Check both um_uim_coverage and um_amount fields
          const umValue = (firstPartyClaim.um_uim_coverage?.toString() || firstPartyClaim.um_amount?.toString() || '0');
          if (umValue.includes('/')) {
            return umValue.split('/')[1].trim() || '0';
          }
          return '0';
        })(),
        property_damage: firstPartyClaim.property_damage?.toString() || '0',
        claim_filed: firstPartyClaim.claim_filed || false,
        claim_filed_date: formatDateForInput(firstPartyClaim.claim_filed_date) || '',
        demand_sent: firstPartyClaim.demand_sent || false,
        demand_amount: firstPartyClaim.demand_amount?.toString() || '0',
        demand_date: formatDateForInput(firstPartyClaim.demand_date) || '',
        offer_received: firstPartyClaim.offer_received || false,
        offer_amount: firstPartyClaim.offer_amount?.toString() || '0',
        offer_date: formatDateForInput(firstPartyClaim.offer_date) || '',
        settlement_reached: firstPartyClaim.settlement_reached || false,
        settlement_amount: firstPartyClaim.settlement_amount?.toString() || '0',
        settlement_date: formatDateForInput(firstPartyClaim.settlement_date) || '',
        notes: firstPartyClaim.notes || ''
      });

      // Set selected insurance ID
      setSelectedAutoInsuranceId(firstPartyClaim.auto_insurance_id || null);

      if (firstPartyClaim.auto_insurance_id) {
        const loadAdjusters = async () => {
          try {
            setLoadingAdjusters(true);
            const allAdjusters = await fetchAutoAdjusters(false);
            const filtered = (allAdjusters || []).filter(
              (adj: any) => adj.auto_insurance_id === firstPartyClaim.auto_insurance_id
            );
            setAutoAdjusters(filtered);
          } catch (error) {
            console.error('Error loading auto adjusters for first party claim:', error);
          } finally {
            setLoadingAdjusters(false);
          }
        };
        loadAdjusters();
      } else {
        setAutoAdjusters([]);
      }
    } else if (isOpen && !firstPartyClaim) {
      // Reset form when opening modal for new claim
      setFormData({
        policy_number: '',
        claim_number: '',
        adjuster_name: '',
        adjuster_first_name: '',
        adjuster_last_name: '',
        adjuster_email: '',
        adjuster_phone: '',
        adjuster_fax: '',
        pip_available: '0',
        pip_used: '0',
        pip_exhausted_date: '',
        med_pay_available: '0',
        med_pay_used: '0',
        um_uim_coverage: '0',
        um_per_person: '0',
        um_per_accident: '0',
        property_damage: '0',
        claim_filed: false,
        claim_filed_date: '',
        demand_sent: false,
        demand_amount: '0',
        demand_date: '',
        offer_received: false,
        offer_amount: '0',
        offer_date: '',
        settlement_reached: false,
        settlement_amount: '0',
        settlement_date: '',
        notes: ''
      });
      setSelectedAutoInsuranceId(null);
      setAutoAdjusters([]);
    }
  }, [isOpen, firstPartyClaim]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const pipAvailable = parseFloat(formData.pip_available) || 0;
    const pipUsed = parseFloat(formData.pip_used) || 0;
    const medPayAvailable = parseFloat(formData.med_pay_available) || 0;
    const medPayUsed = parseFloat(formData.med_pay_used) || 0;
    const settlementAmount = parseFloat(formData.settlement_amount) || 0;

    if (pipAvailable < 0 || medPayAvailable < 0) {
      onShowToast('Coverage amounts cannot be negative', 'error');
      return;
    }

    if (pipUsed < 0 || medPayUsed < 0) {
      onShowToast('Used amounts cannot be negative', 'error');
      return;
    }

    if (pipUsed > pipAvailable) {
      onShowToast('PIP used cannot exceed PIP available', 'error');
      return;
    }

    if (medPayUsed > medPayAvailable) {
      onShowToast('Med Pay used cannot exceed Med Pay available', 'error');
      return;
    }

    if (settlementAmount > 0 && settlementAmount > (pipAvailable + medPayAvailable)) {
      const confirmed = await confirm('Settlement amount exceeds total coverage. Continue?', {
        title: 'Warning',
        variant: 'warning'
      });
      if (!confirmed) {
        return;
      }
    }

    setSaving(true);
    try {
      // Use client-specific update if clientId is provided, otherwise use case-based update
      const updateFunction = clientId 
        ? (payload: Record<string, any>) => updateFirstPartyClaimByClient(clientId, casefileId, payload)
        : (payload: Record<string, any>) => updateFirstPartyClaimByCase(casefileId, payload);
      
      const result = await updateFunction({
        auto_insurance_id: selectedAutoInsuranceId,
        policy_number: formData.policy_number,
        claim_number: formData.claim_number,
        adjuster_name: formData.adjuster_name || null,
        adjuster_first_name: formData.adjuster_first_name || null,
        adjuster_last_name: formData.adjuster_last_name || null,
        adjuster_email: formData.adjuster_email || null,
        adjuster_phone: formData.adjuster_phone || null,
        adjuster_fax: formData.adjuster_fax || null,
        pip_available: pipAvailable,
        pip_used: pipUsed,
        pip_exhausted_date: formData.pip_exhausted_date || null,
        med_pay_available: medPayAvailable,
        med_pay_used: medPayUsed,
        um_uim_coverage: (() => {
          const perPerson = parseFloat(formData.um_per_person) || 0;
          const perAccident = parseFloat(formData.um_per_accident) || 0;
          if (perPerson > 0 || perAccident > 0) {
            return `${perPerson}/${perAccident}`;
          }
          return formData.um_uim_coverage || null;
        })(),
        um_amount: (() => {
          const perPerson = parseFloat(formData.um_per_person) || 0;
          const perAccident = parseFloat(formData.um_per_accident) || 0;
          if (perPerson > 0 || perAccident > 0) {
            return `${perPerson}/${perAccident}`;
          }
          return formData.um_uim_coverage || null;
        })(), // Synchronize with um_uim_coverage
        property_damage: parseFloat(formData.property_damage) || 0,
        claim_filed: formData.claim_filed,
        claim_filed_date: formData.claim_filed_date || null,
        demand_sent: formData.demand_sent,
        demand_amount: parseFloat(formData.demand_amount) || 0,
        demand_date: formData.demand_date || null,
        offer_received: formData.offer_received,
        offer_amount: parseFloat(formData.offer_amount) || 0,
        offer_date: formData.offer_date || null,
        settlement_reached: formData.settlement_reached,
        settlement_amount: parseFloat(formData.settlement_amount) || 0,
        settlement_date: formData.settlement_date || null,
        notes: formData.notes
      });

      if (!result.ok) throw new Error(result.message || 'Update failed');

      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: 'First party claim information updated',
        timestamp: new Date().toISOString(),
        user_name: 'Admin'
      });

      onShowToast('First party claim updated successfully', 'success');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating first party claim:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to update first party claim';
      onShowToast(`Failed to update first party claim: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const pipRemaining = parseFloat(formData.pip_available) - parseFloat(formData.pip_used);
  const medPayRemaining = parseFloat(formData.med_pay_available) - parseFloat(formData.med_pay_used);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit First Party Claim">
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Insurance Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Insurance Information</h3>
          
          {/* Auto Insurance Selection */}
          <div className="mb-4 border-b pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auto Insurance Company
            </label>
            <div className="flex flex-wrap gap-2 items-start">
              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedAutoInsuranceId || ''}
                  onChange={(e) => {
                    const newId = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedAutoInsuranceId(newId);
                    // Clear adjusters when insurance changes
                  if (newId !== firstPartyClaim?.auto_insurance_id) {
                    setAutoAdjusters([]);
                    handleChange('adjuster_name', '');
                    handleChange('adjuster_first_name', '');
                    handleChange('adjuster_last_name', '');
                    handleChange('adjuster_email', '');
                    handleChange('adjuster_phone', '');
                    handleChange('adjuster_fax', '');
                  }
                    // Reload adjusters for new insurance
                    if (newId) {
                      const loadAdjusters = async () => {
                        try {
                          setLoadingAdjusters(true);
                          const allAdjusters = await fetchAutoAdjusters(false);
                          const filtered = (allAdjusters || []).filter(
                            (adj: any) => adj.auto_insurance_id === newId
                          );
                          setAutoAdjusters(filtered);
                        } catch (error) {
                          console.error('Error loading auto adjusters:', error);
                        } finally {
                          setLoadingAdjusters(false);
                        }
                      };
                      loadAdjusters();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={loadingInsurers}
                >
                  <option value="">-- Select Insurance --</option>
                  {autoInsurers.length > 0 ? (
                    autoInsurers.map((insurer) => (
                      <option key={insurer.id} value={insurer.id}>
                        {insurer.name || `Insurance #${insurer.id}`}
                      </option>
                    ))
                  ) : (
                    !loadingInsurers && <option value="" disabled>No insurance companies available</option>
                  )}
                </select>
                {loadingInsurers && (
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <span className="animate-spin">⏳</span> Loading insurance companies...
                  </p>
                )}
                {insurerLoadError && !loadingInsurers && (
                  <p className="mt-1 text-xs text-amber-600">{insurerLoadError}</p>
                )}
                {!loadingInsurers && !insurerLoadError && autoInsurers.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No insurance companies available. Click "+ Add New" to create one.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowAddInsuranceModal(true)}
                className="px-3 py-2 text-xs font-medium rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                + Add New
              </button>
              {selectedAutoInsuranceId && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingInsuranceId(selectedAutoInsuranceId);
                      setShowEditInsuranceModal(true);
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const confirmed = await confirm(
                        'Unlink this insurance company from this claim? The insurance will remain in the database.',
                        { title: 'Unlink Insurance', variant: 'warning' }
                      );
                      if (confirmed) {
                        setSelectedAutoInsuranceId(null);
                        setAutoAdjusters([]);
                        handleChange('adjuster_name', '');
                        handleChange('adjuster_first_name', '');
                        handleChange('adjuster_last_name', '');
                        handleChange('adjuster_email', '');
                        handleChange('adjuster_phone', '');
                        handleChange('adjuster_fax', '');
                      }
                    }}
                    className="px-3 py-2 text-xs font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Unlink
                  </button>
                </>
              )}
            </div>
            {selectedAutoInsuranceId && (
              <p className="mt-2 text-xs text-gray-500">
                Selected: {autoInsurers.find(i => i.id === selectedAutoInsuranceId)?.name || 'Unknown'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Policy Number"
              value={formData.policy_number}
              onChange={(value) => handleChange('policy_number', value)}
            />
            <FormInput
              label="Claim Number"
              value={formData.claim_number}
              onChange={(value) => handleChange('claim_number', value)}
            />
          </div>

          {/* Adjuster selection */}
          <div className="mt-4 border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Adjuster</p>
                <p className="text-xs text-gray-500">
                  Link this first party claim to an adjuster for the client&apos;s auto carrier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjusterModal(true)}
                disabled={!selectedAutoInsuranceId}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formData.adjuster_name ? 'Change Adjuster' : 'Select Adjuster'}
              </button>
            </div>

            {loadingAdjusters && (
              <p className="text-xs text-gray-500">Loading adjusters for this carrier...</p>
            )}

            {(formData.adjuster_name || formData.adjuster_first_name || formData.adjuster_last_name || formData.adjuster_phone || formData.adjuster_email || formData.adjuster_fax) && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-gray-800 space-y-1">
                {(formData.adjuster_first_name || formData.adjuster_last_name || formData.adjuster_name) && (
                  <p>
                    <span className="font-semibold">Name:</span> {
                      formData.adjuster_first_name || formData.adjuster_last_name
                        ? `${formData.adjuster_first_name} ${formData.adjuster_last_name}`.trim()
                        : formData.adjuster_name || 'N/A'
                    }
                  </p>
                )}
                {formData.adjuster_email && (
                  <p>
                    <span className="font-semibold">Email:</span> {formData.adjuster_email}
                  </p>
                )}
                {formData.adjuster_phone && (
                  <p>
                    <span className="font-semibold">Phone:</span> {formData.adjuster_phone}
                  </p>
                )}
                {formData.adjuster_fax && (
                  <p>
                    <span className="font-semibold">Fax:</span> {formData.adjuster_fax}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormInput
                label="Adjuster First Name"
                value={formData.adjuster_first_name}
                onChange={(value) => handleChange('adjuster_first_name', value)}
              />
              <FormInput
                label="Adjuster Last Name"
                value={formData.adjuster_last_name}
                onChange={(value) => handleChange('adjuster_last_name', value)}
              />
              <FormInput
                label="Adjuster Email"
                type="email"
                value={formData.adjuster_email}
                onChange={(value) => handleChange('adjuster_email', value)}
              />
              <FormInput
                label="Adjuster Phone"
                type="tel"
                value={formData.adjuster_phone}
                onChange={(value) => handleChange('adjuster_phone', value)}
              />
              <FormInput
                label="Adjuster Fax"
                type="tel"
                value={formData.adjuster_fax}
                onChange={(value) => handleChange('adjuster_fax', value)}
              />
              <FormInput
                label="Adjuster Name (Legacy/Override)"
                value={formData.adjuster_name}
                onChange={(value) => handleChange('adjuster_name', value)}
                placeholder="Full name if not using first/last"
              />
            </div>
          </div>
        </div>

        {/* PIP Coverage */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">PIP Coverage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="PIP Available"
              type="number"
              step="0.01"
              value={formData.pip_available}
              onChange={(value) => handleChange('pip_available', value)}
            />
            <FormInput
              label="PIP Used"
              type="number"
              step="0.01"
              value={formData.pip_used}
              onChange={(value) => handleChange('pip_used', value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIP Remaining (Calculated)
              </label>
              <input
                type="text"
                value={`$${pipRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-semibold"
              />
            </div>
          </div>
          <div className="mt-3">
            <FormInput
              label="PIP Exhausted Date"
              type="date"
              value={formData.pip_exhausted_date}
              onChange={(value) => handleChange('pip_exhausted_date', value)}
            />
          </div>
        </div>

        {/* Med Pay Coverage */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Med Pay Coverage</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="Med Pay Available"
              type="number"
              step="0.01"
              value={formData.med_pay_available}
              onChange={(value) => handleChange('med_pay_available', value)}
            />
            <FormInput
              label="Med Pay Used"
              type="number"
              step="0.01"
              value={formData.med_pay_used}
              onChange={(value) => handleChange('med_pay_used', value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Med Pay Remaining (Calculated)
              </label>
              <input
                type="text"
                value={`$${medPayRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Other Auto Coverage */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Other Auto Coverage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                UM/UIM Coverage
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.um_per_person}
                    onChange={(e) => handleChange('um_per_person', e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-500 font-semibold text-lg">/</span>
                <div className="flex-1">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.um_per_accident}
                    onChange={(e) => handleChange('um_per_accident', e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Per Person / Per Accident (in thousands)</p>
            </div>
            <FormInput
              label="Property Damage Coverage"
              type="number"
              step="0.01"
              value={formData.property_damage}
              onChange={(value) => handleChange('property_damage', value)}
            />
          </div>
        </div>

        {/* Claim Status */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Claim Status</h3>

          {/* Claim Filed */}
          <div className="border border-gray-200 rounded-md p-4 mb-3">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.claim_filed}
                onChange={(e) => handleChange('claim_filed', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Claim Filed</span>
            </label>
            {formData.claim_filed && (
              <FormInput
                label="Claim Filed Date"
                type="date"
                value={formData.claim_filed_date}
                onChange={(value) => handleChange('claim_filed_date', value)}
              />
            )}
          </div>

          {/* Settlement Demand */}
          <div className="border border-gray-200 rounded-md p-4 mb-3">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.demand_sent}
                onChange={(e) => handleChange('demand_sent', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Settlement Demand Sent</span>
            </label>
            {formData.demand_sent && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Demand Amount"
                  type="number"
                  step="0.01"
                  value={formData.demand_amount}
                  onChange={(value) => handleChange('demand_amount', value)}
                />
                <FormInput
                  label="Demand Date"
                  type="date"
                  value={formData.demand_date}
                  onChange={(value) => handleChange('demand_date', value)}
                />
              </div>
            )}
          </div>

          {/* Offer Received */}
          <div className="border border-gray-200 rounded-md p-4 mb-3">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.offer_received}
                onChange={(e) => handleChange('offer_received', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Offer Received</span>
            </label>
            {formData.offer_received && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Offer Amount"
                  type="number"
                  step="0.01"
                  value={formData.offer_amount}
                  onChange={(value) => handleChange('offer_amount', value)}
                />
                <FormInput
                  label="Offer Date"
                  type="date"
                  value={formData.offer_date}
                  onChange={(value) => handleChange('offer_date', value)}
                />
              </div>
            )}
          </div>

          {/* Settlement Reached */}
          <div className="border border-gray-200 rounded-md p-4">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.settlement_reached}
                onChange={(e) => handleChange('settlement_reached', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Settlement Reached</span>
            </label>
            {formData.settlement_reached && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Settlement Amount"
                  type="number"
                  step="0.01"
                  value={formData.settlement_amount}
                  onChange={(value) => handleChange('settlement_amount', value)}
                />
                <FormInput
                  label="Settlement Date"
                  type="date"
                  value={formData.settlement_date}
                  onChange={(value) => handleChange('settlement_date', value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <FormTextArea
          label="Notes"
          value={formData.notes}
          onChange={(value) => handleChange('notes', value)}
          rows={3}
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
        <button
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      {ConfirmDialog}

      {selectedAutoInsuranceId && (
        <AdjusterSelectionModal
          isOpen={showAdjusterModal}
          onClose={() => setShowAdjusterModal(false)}
          existingAdjusters={autoAdjusters}
          insuranceOrProviderName={autoInsurers.find(i => i.id === selectedAutoInsuranceId)?.name || 'Auto Insurance'}
          type="auto"
          onSelect={(adjusterId) => {
            if (!adjusterId) {
              setShowAdjusterModal(false);
              return;
            }
            const selected = autoAdjusters.find((a: any) => a.id === adjusterId);
            if (selected) {
              const name = [selected.first_name, selected.last_name].filter(Boolean).join(' ');
              handleChange('adjuster_name', name);
              handleChange('adjuster_first_name', selected.first_name || '');
              handleChange('adjuster_last_name', selected.last_name || '');
              handleChange('adjuster_email', selected.email || '');
              handleChange('adjuster_phone', selected.phone || '');
              handleChange('adjuster_fax', selected.fax || '');
            }
            setShowAdjusterModal(false);
          }}
          onCreate={async (adjusterInfo) => {
            try {
              if (!selectedAutoInsuranceId) {
                onShowToast('Select an auto insurance carrier before adding an adjuster.', 'error');
                return;
              }
              const newAdjusterPayload = {
                auto_insurance_id: selectedAutoInsuranceId,
                first_name: adjusterInfo.first_name || null,
                middle_name: adjusterInfo.middle_name || null,
                last_name: adjusterInfo.last_name || null,
                email: adjusterInfo.email || null,
                phone: adjusterInfo.phone || null,
                fax: adjusterInfo.fax || null,
                street_address: adjusterInfo.street_address || null,
                city: adjusterInfo.city || null,
                state: adjusterInfo.state || null,
                zip_code: adjusterInfo.zip_code || null
              };
              const inserted = await createAutoAdjuster(newAdjusterPayload);
              setAutoAdjusters(prev => [...prev, inserted]);
              const name = [inserted.first_name, inserted.last_name].filter(Boolean).join(' ');
              handleChange('adjuster_name', name);
              handleChange('adjuster_first_name', inserted.first_name || '');
              handleChange('adjuster_last_name', inserted.last_name || '');
              handleChange('adjuster_email', inserted.email || '');
              handleChange('adjuster_phone', inserted.phone || '');
              handleChange('adjuster_fax', inserted.fax || '');
              onShowToast('Adjuster created and linked to this claim.', 'success');
            } catch (error) {
              console.error('Error creating auto adjuster from first party modal:', error);
              onShowToast('Failed to create adjuster. Please try again.', 'error');
            }
          }}
        />
      )}

      {/* Add Insurance Modal */}
      <AddAutoInsuranceModal
        isOpen={showAddInsuranceModal}
        onClose={() => setShowAddInsuranceModal(false)}
        onSuccess={async (newInsurer) => {
          if (newInsurer) {
            // Refresh insurers list
            const insurers = await fetchAutoInsurers();
            setAutoInsurers(insurers || []);
            // Select the newly created insurance
            setSelectedAutoInsuranceId(newInsurer.id);
            // Load adjusters for new insurance
            try {
              setLoadingAdjusters(true);
              const allAdjusters = await fetchAutoAdjusters(false);
              const filtered = (allAdjusters || []).filter(
                (adj: any) => adj.auto_insurance_id === newInsurer.id
              );
              setAutoAdjusters(filtered);
            } catch (error) {
              console.error('Error loading auto adjusters:', error);
            } finally {
              setLoadingAdjusters(false);
            }
            onShowToast('Insurance company added and selected.', 'success');
          }
          setShowAddInsuranceModal(false);
        }}
      />

      {/* Edit Insurance Modal */}
      <EditAutoInsuranceModal
        isOpen={showEditInsuranceModal}
        onClose={() => {
          setShowEditInsuranceModal(false);
          setEditingInsuranceId(null);
        }}
        insuranceId={editingInsuranceId}
        onSuccess={async (updatedInsurer) => {
          if (updatedInsurer) {
            // Refresh insurers list
            const insurers = await fetchAutoInsurers();
            setAutoInsurers(insurers || []);
            onShowToast('Insurance company updated successfully.', 'success');
          }
          setShowEditInsuranceModal(false);
          setEditingInsuranceId(null);
        }}
      />
    </Modal>
  );
}
