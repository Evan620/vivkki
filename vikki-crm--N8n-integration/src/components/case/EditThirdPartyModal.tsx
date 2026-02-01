import { useState, useEffect } from 'react';
import { useConfirmDialog } from '../../hooks/useConfirmDialog.tsx';
import Modal from '../common/Modal';
import FormInput from '../forms/FormInput';
import FormTextArea from '../forms/FormTextArea';
import { supabase, fetchAutoAdjusters, createAutoAdjuster, fetchAutoInsurers } from '../../utils/database';
import { formatDateForInput } from '../../utils/formatting';
import AdjusterSelectionModal from '../intake/AdjusterSelectionModal';
import AddAutoInsuranceModal from '../forms/AddAutoInsuranceModal';
import EditAutoInsuranceModal from '../forms/EditAutoInsuranceModal';

interface EditThirdPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  thirdPartyClaim: any;
  defendant: any;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function EditThirdPartyModal({
  isOpen,
  onClose,
  thirdPartyClaim,
  defendant,
  casefileId,
  onUpdate,
  onShowToast
}: EditThirdPartyModalProps) {
  const [formData, setFormData] = useState({
    claim_number: '',
    adjuster_name: '',
    adjuster_first_name: '',
    adjuster_last_name: '',
    adjuster_email: '',
    adjuster_phone: '',
    adjuster_fax: '',
    policy_limits: '0',
    lor_sent: false,
    lor_date: '',
    loa_received: false,
    loa_date: '',
    last_request_date: '',
    demand_sent: false,
    demand_amount: '0',
    demand_date: '',
    offer_received: false,
    offer_amount: '0',
    offer_date: '',
    counter_offer_sent: false,
    counter_amount: '0',
    settlement_reached: false,
    settlement_amount: '0',
    settlement_date: '',
    liability_percentage: '0',
    liability_disputed: false,
    notes: ''
  });
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
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
    if (isOpen && thirdPartyClaim) {
      setFormData({
        claim_number: thirdPartyClaim.claim_number || '',
        adjuster_name: thirdPartyClaim.adjuster_name || '',
        adjuster_first_name: thirdPartyClaim.adjuster_first_name || '',
        adjuster_last_name: thirdPartyClaim.adjuster_last_name || '',
        adjuster_email: thirdPartyClaim.adjuster_email || '',
        adjuster_phone: thirdPartyClaim.adjuster_phone || '',
        adjuster_fax: thirdPartyClaim.adjuster_fax || '',
        policy_limits: thirdPartyClaim.policy_limits?.toString() || '0',
        lor_sent: thirdPartyClaim.lor_sent || false,
        lor_date: formatDateForInput(thirdPartyClaim.lor_date) || '',
        loa_received: thirdPartyClaim.loa_received || false,
        loa_date: formatDateForInput(thirdPartyClaim.loa_date) || '',
        last_request_date: formatDateForInput(thirdPartyClaim.last_request_date) || '',
        demand_sent: thirdPartyClaim.demand_sent || false,
        demand_amount: thirdPartyClaim.demand_amount?.toString() || '0',
        demand_date: formatDateForInput(thirdPartyClaim.demand_date) || '',
        offer_received: thirdPartyClaim.offer_received || false,
        offer_amount: thirdPartyClaim.offer_amount?.toString() || '0',
        offer_date: formatDateForInput(thirdPartyClaim.offer_date) || '',
        counter_offer_sent: thirdPartyClaim.counter_offer_sent || false,
        counter_amount: thirdPartyClaim.counter_amount?.toString() || '0',
        settlement_reached: thirdPartyClaim.settlement_reached || false,
        settlement_amount: thirdPartyClaim.settlement_amount?.toString() || '0',
        settlement_date: formatDateForInput(thirdPartyClaim.settlement_date) || '',
        liability_percentage: thirdPartyClaim.liability_percentage?.toString() || '0',
        liability_disputed: thirdPartyClaim.liability_disputed || false,
        notes: thirdPartyClaim.notes || ''
      });

      // Set selected insurance ID from defendant
      setSelectedAutoInsuranceId(defendant?.auto_insurance_id || null);

      if (defendant?.auto_insurance_id) {
        const loadAdjusters = async () => {
          try {
            setLoadingAdjusters(true);
            const allAdjusters = await fetchAutoAdjusters(false);
            const filtered = (allAdjusters || []).filter(
              (adj: any) => adj.auto_insurance_id === defendant.auto_insurance_id
            );
            setAutoAdjusters(filtered);
          } catch (error) {
            console.error('Error loading auto adjusters for third party claim:', error);
          } finally {
            setLoadingAdjusters(false);
          }
        };
        loadAdjusters();
      } else {
        setAutoAdjusters([]);
      }
    } else if (isOpen && !thirdPartyClaim) {
      // Reset form when opening modal for new claim
      setFormData({
        claim_number: '',
        adjuster_name: '',
        adjuster_first_name: '',
        adjuster_last_name: '',
        adjuster_email: '',
        adjuster_phone: '',
        adjuster_fax: '',
        policy_limits: '0',
        lor_sent: false,
        lor_date: '',
        loa_received: false,
        loa_date: '',
        last_request_date: '',
        demand_sent: false,
        demand_amount: '0',
        demand_date: '',
        offer_received: false,
        offer_amount: '0',
        offer_date: '',
        counter_offer_sent: false,
        counter_amount: '0',
        settlement_reached: false,
        settlement_amount: '0',
        settlement_date: '',
        liability_percentage: '0',
        liability_disputed: false,
        notes: ''
      });
      setSelectedAutoInsuranceId(defendant?.auto_insurance_id || null);
      setAutoAdjusters([]);
    }
  }, [isOpen, thirdPartyClaim, defendant]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      console.log('=== SAVING THIRD PARTY CLAIM ===');
      console.log('Defendant:', defendant);
      console.log('Form Data:', formData);
      console.log('Case ID:', casefileId);

      if (!defendant?.id) {
        console.error('Missing defendant.id');
        onShowToast('Defendant information is missing', 'error');
        setSaving(false);
        return;
      }

      if (!selectedAutoInsuranceId) {
        console.error('Missing selectedAutoInsuranceId');
        onShowToast('Please select an auto insurance company for this claim.', 'error');
        setSaving(false);
        return;
      }

      // Update defendant's auto_insurance_id if it changed
      if (defendant?.auto_insurance_id !== selectedAutoInsuranceId) {
        const { error: updateDefendantError } = await supabase
          .from('defendants')
          .update({ auto_insurance_id: selectedAutoInsuranceId })
          .eq('id', defendant.id);
        
        if (updateDefendantError) {
          console.error('Error updating defendant insurance:', updateDefendantError);
          throw updateDefendantError;
        }
      }

      const dataToSave = {
        defendant_id: defendant.id,
        auto_insurance_id: selectedAutoInsuranceId,
        claim_number: formData.claim_number || null,
        adjuster_name: formData.adjuster_name || null,
        adjuster_first_name: formData.adjuster_first_name || null,
        adjuster_last_name: formData.adjuster_last_name || null,
        adjuster_email: formData.adjuster_email || null,
        adjuster_phone: formData.adjuster_phone || null,
        adjuster_fax: formData.adjuster_fax || null,
        policy_limits: formData.policy_limits ? parseFloat(formData.policy_limits) : null,
        lor_sent: formData.lor_sent === true,
        lor_date: formData.lor_date || null,
        loa_received: formData.loa_received === true,
        loa_date: formData.loa_date || null,
        last_request_date: formData.last_request_date || null,
        demand_sent: formData.demand_sent === true,
        demand_amount: formData.demand_amount ? parseFloat(formData.demand_amount) : null,
        demand_date: formData.demand_date || null,
        offer_received: formData.offer_received === true,
        offer_amount: formData.offer_amount ? parseFloat(formData.offer_amount) : null,
        offer_date: formData.offer_date || null,
        counter_offer_sent: formData.counter_offer_sent === true,
        counter_amount: formData.counter_amount ? parseFloat(formData.counter_amount) : null,
        settlement_reached: formData.settlement_reached === true,
        settlement_amount: formData.settlement_amount ? parseFloat(formData.settlement_amount) : null,
        settlement_date: formData.settlement_date || null,
        liability_percentage: formData.liability_percentage ? parseInt(formData.liability_percentage) : null,
        liability_disputed: formData.liability_disputed === true,
        notes: formData.notes || null
      };

      console.log('Data to save:', dataToSave);

      let result;

      if (thirdPartyClaim?.id) {
        console.log('Updating existing claim, ID:', thirdPartyClaim.id);

        const { data, error } = await supabase
          .from('third_party_claims')
          .update(dataToSave)
          .eq('id', thirdPartyClaim.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        result = data;
        console.log('Update successful:', result);
      } else {
        console.log('Inserting new claim');

        const { data, error } = await supabase
          .from('third_party_claims')
          .insert([dataToSave])
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        result = data;
        console.log('Insert successful:', result);
      }

      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: 'Third party claim information updated',
        timestamp: new Date().toISOString(),
        user_name: 'Admin'
      });

      console.log('=== SAVE COMPLETE ===');
      onShowToast('Third party claim updated successfully', 'success');
      await onUpdate();
      onClose();

    } catch (error: any) {
      console.error('=== SAVE FAILED ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details);
      console.error('Error hint:', error?.hint);
      console.error('Error code:', error?.code);

      let errorMessage = 'Failed to update third party claim';

      if (error?.message?.includes('violates foreign key')) {
        errorMessage = 'Invalid insurance reference. Please check defendant insurance setup.';
      } else if (error?.message?.includes('null value')) {
        errorMessage = 'Missing required field. Please check all inputs.';
      } else if (error?.message?.includes('column')) {
        errorMessage = 'Database structure mismatch. Please check console for details.';
      } else if (error?.message) {
        errorMessage = `Failed: ${error.message}`;
      }

      onShowToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Third Party Claim">
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Insurance Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Insurance Information</h3>
          
          {/* Auto Insurance Selection */}
          <div className="mb-4">
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
                    if (newId !== defendant?.auto_insurance_id) {
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
        </div>

        {/* Claim Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Claim Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Claim Number"
              value={formData.claim_number}
              onChange={(value) => handleChange('claim_number', value)}
            />
            <FormInput
              label="Policy Limits"
              type="number"
              step="0.01"
              value={formData.policy_limits}
              onChange={(value) => handleChange('policy_limits', value)}
            />
          </div>

          {/* Adjuster selection */}
          <div className="mt-4 border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Adjuster</p>
                <p className="text-xs text-gray-500">
                  Link this third party claim to an adjuster for the defendant&apos;s auto carrier.
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

        {/* Documentation */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Documentation</h3>

          {/* LOR Sent */}
          <div className="border border-gray-200 rounded-md p-4 mb-3">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.lor_sent}
                onChange={(e) => handleChange('lor_sent', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">LOR Sent</span>
            </label>
            {formData.lor_sent && (
              <FormInput
                label="LOR Date"
                type="date"
                value={formData.lor_date}
                onChange={(value) => handleChange('lor_date', value)}
              />
            )}
          </div>

          {/* LOA Received */}
          <div className="border border-gray-200 rounded-md p-4 mb-3">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.loa_received}
                onChange={(e) => handleChange('loa_received', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">LOA Received</span>
            </label>
            {formData.loa_received && (
              <FormInput
                label="LOA Date"
                type="date"
                value={formData.loa_date}
                onChange={(value) => handleChange('loa_date', value)}
              />
            )}
          </div>

          <FormInput
            label="Last Request Date"
            type="date"
            value={formData.last_request_date}
            onChange={(value) => handleChange('last_request_date', value)}
          />
        </div>

        {/* Liability Assessment */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Liability Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Liability Percentage"
              type="number"
              min="0"
              max="100"
              value={formData.liability_percentage}
              onChange={(value) => handleChange('liability_percentage', value)}
            />
            <div className="flex items-center pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.liability_disputed}
                  onChange={(e) => handleChange('liability_disputed', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">Liability Disputed</span>
              </label>
            </div>
          </div>
        </div>

        {/* Demand */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Demand</h3>
          <div className="border border-gray-200 rounded-md p-4">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.demand_sent}
                onChange={(e) => handleChange('demand_sent', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Demand Sent</span>
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
        </div>

        {/* Offer */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Offer</h3>
          <div className="border border-gray-200 rounded-md p-4">
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
        </div>

        {/* Counter Offer */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Counter Offer</h3>
          <div className="border border-gray-200 rounded-md p-4">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.counter_offer_sent}
                onChange={(e) => handleChange('counter_offer_sent', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Counter Offer Sent</span>
            </label>
            {formData.counter_offer_sent && (
              <FormInput
                label="Counter Amount"
                type="number"
                step="0.01"
                value={formData.counter_amount}
                onChange={(value) => handleChange('counter_amount', value)}
              />
            )}
          </div>
        </div>

        {/* Settlement */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Settlement</h3>
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
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Notes</h3>
          <FormTextArea
            label="Additional Notes"
            value={formData.notes}
            onChange={(value) => handleChange('notes', value)}
            rows={4}
          />
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
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
              const newAdjusterPayload: any = {
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
              // Link adjuster to third party claim if available
              if (thirdPartyClaim?.id) {
                newAdjusterPayload.third_party_claim_id = thirdPartyClaim.id;
              }
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
              console.error('Error creating auto adjuster from third party modal:', error);
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
      {ConfirmDialog}
    </Modal>
  );
}
