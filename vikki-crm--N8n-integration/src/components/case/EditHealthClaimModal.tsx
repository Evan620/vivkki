import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../forms/FormInput';
import FormTextArea from '../forms/FormTextArea';
import FormSelect from '../forms/FormSelect';
import { supabase, fetchHealthAdjusters, createHealthAdjuster } from '../../utils/database';
import { updateHealthClaimByClient } from '../../services/update';
import { formatDateForInput } from '../../utils/formatting';
import AdjusterSelectionModal from '../intake/AdjusterSelectionModal';

interface EditHealthClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthClaim: any;
  clientId: number;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function EditHealthClaimModal({
  isOpen,
  onClose,
  healthClaim,
  clientId,
  casefileId,
  onUpdate,
  onShowToast
}: EditHealthClaimModalProps) {
  const [healthInsurers, setHealthInsurers] = useState<Array<{ id: number; name: string }>>([]);
  const [healthAdjusters, setHealthAdjusters] = useState<any[]>([]);
  const [showAdjusterModal, setShowAdjusterModal] = useState(false);
  const [selectedHealthAdjuster, setSelectedHealthAdjuster] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    policy_number: '',
    group_number: '',
    subscriber_name: '',
    relationship_to_client: '',
    phone: '',
    subrogation_claim_filed: false,
    subrogation_amount: '0',
    lien_amount: '0',
    lien_filed_date: '',
    lien_negotiated: false,
    final_lien_amount: '0',
    lien_satisfied: false,
    satisfaction_date: '',
    amount_paid_by_insurance: '0',
    notes: '',
    health_insurance_id: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadInsurers = async () => {
      const { data, error } = await supabase
        .from('health_insurance')
        .select('id, name')
        .order('name');
      if (!error && data) setHealthInsurers(data as any);
    };

    const loadAdjusters = async () => {
      try {
        const allAdjusters = await fetchHealthAdjusters();
        setHealthAdjusters(allAdjusters || []);
      } catch (error) {
        console.error('Error loading health adjusters:', error);
      }
    };

    if (isOpen) {
      loadInsurers();
      loadAdjusters();
    }

    if (isOpen && healthClaim) {
      setFormData({
        policy_number: healthClaim.policy_number || '',
        group_number: healthClaim.group_number || '',
        subscriber_name: healthClaim.subscriber_name || '',
        relationship_to_client: healthClaim.relationship_to_client || '',
        phone: healthClaim.phone || '',
        subrogation_claim_filed: healthClaim.subrogation_claim_filed || false,
        subrogation_amount: healthClaim.subrogation_amount?.toString() || '0',
        lien_amount: healthClaim.lien_amount?.toString() || '0',
        lien_filed_date: formatDateForInput(healthClaim.lien_filed_date) || '',
        lien_negotiated: healthClaim.lien_negotiated || false,
        final_lien_amount: healthClaim.final_lien_amount?.toString() || '0',
        lien_satisfied: healthClaim.lien_satisfied || false,
        satisfaction_date: formatDateForInput(healthClaim.satisfaction_date) || '',
        amount_paid_by_insurance: healthClaim.amount_paid_by_insurance?.toString() || '0',
        notes: healthClaim.notes || '',
        health_insurance_id: healthClaim.health_insurance_id || 0
      });
      setSelectedHealthAdjuster(healthClaim?.health_adjuster || null);
    } else if (isOpen && !healthClaim) {
      // Reset to defaults when creating
      setFormData(prev => ({ ...prev, health_insurance_id: 0 }));
    }
  }, [isOpen, healthClaim]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.health_insurance_id || formData.health_insurance_id === 0) {
      onShowToast('Please select a Health Insurance carrier', 'error');
      return;
    }
    setSaving(true);
    try {
      if (healthClaim?.id) {
        // Update existing
        const result = await updateHealthClaimByClient(clientId, {
          health_insurance_id: formData.health_insurance_id,
          health_adjuster_id: selectedHealthAdjuster?.id || null,
          policy_number: formData.policy_number,
          group_number: formData.group_number,
          subscriber_name: formData.subscriber_name,
          relationship_to_client: formData.relationship_to_client,
          phone: formData.phone,
          subrogation_claim_filed: formData.subrogation_claim_filed,
          subrogation_amount: parseFloat(formData.subrogation_amount) || 0,
          lien_amount: parseFloat(formData.lien_amount) || 0,
          lien_filed_date: formData.lien_filed_date || null,
          lien_negotiated: formData.lien_negotiated,
          final_lien_amount: parseFloat(formData.final_lien_amount) || 0,
          lien_satisfied: formData.lien_satisfied,
          satisfaction_date: formData.satisfaction_date || null,
          amount_paid_by_insurance: parseFloat(formData.amount_paid_by_insurance) || 0,
          notes: formData.notes
        });

        if (!result.ok) throw new Error(result.message || 'Update failed');

        // Auto-update case status to Active
        await supabase
          .from('casefiles')
          .update({ status: 'Active', updated_at: new Date().toISOString() })
          .eq('id', casefileId);

        await supabase.from('work_logs').insert({
          casefile_id: casefileId,
          description: 'Health insurance claim information updated',
          timestamp: new Date().toISOString(),
          user_name: 'Admin'
        });

        onShowToast('Health insurance claim updated successfully', 'success');
      } else {
        // Create new
        const { data, error } = await supabase
          .from('health_claims')
          .insert({
            client_id: clientId,
            health_insurance_id: formData.health_insurance_id,
            health_adjuster_id: selectedHealthAdjuster?.id || null,
            policy_number: formData.policy_number,
            group_number: formData.group_number,
            subscriber_name: formData.subscriber_name,
            relationship_to_client: formData.relationship_to_client,
            phone: formData.phone,
            subrogation_claim_filed: formData.subrogation_claim_filed,
            subrogation_amount: parseFloat(formData.subrogation_amount) || 0,
            lien_amount: parseFloat(formData.lien_amount) || 0,
            lien_filed_date: formData.lien_filed_date || null,
            lien_negotiated: formData.lien_negotiated,
            final_lien_amount: parseFloat(formData.final_lien_amount) || 0,
            lien_satisfied: formData.lien_satisfied,
            satisfaction_date: formData.satisfaction_date || null,
            amount_paid_by_insurance: parseFloat(formData.amount_paid_by_insurance) || 0,
            notes: formData.notes
          })
          .select();

        if (error) throw error;

        // Auto-update case status to Active
        await supabase
          .from('casefiles')
          .update({ status: 'Active', updated_at: new Date().toISOString() })
          .eq('id', casefileId);

        await supabase.from('work_logs').insert({
          casefile_id: casefileId,
          description: 'Health insurance claim added',
          timestamp: new Date().toISOString(),
          user_name: 'Admin'
        });

        onShowToast('Health insurance claim added successfully', 'success');
      }

      // Refetch health insurers to include any newly added ones
      const { data: updatedInsurers } = await supabase
        .from('health_insurance')
        .select('id, name')
        .order('name');
      if (updatedInsurers) setHealthInsurers(updatedInsurers as any);
      
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error saving health claim:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      onShowToast(`Failed to save health insurance claim: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const lienSavings = parseFloat(formData.lien_amount) - parseFloat(formData.final_lien_amount);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Health Insurance Claim">
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Insurance Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Insurance Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              label="Health Insurance Carrier"
              value={formData.health_insurance_id ? String(formData.health_insurance_id) : ''}
              onChange={(value) => {
                const id = value ? parseInt(value) : 0;
                setFormData(prev => ({ ...prev, health_insurance_id: id }));
                setSelectedHealthAdjuster(null);
              }}
              options={[
                { value: '', label: 'Select carrier...' },
                ...healthInsurers.map(h => ({ value: String(h.id), label: h.name })),
                { value: '0', label: 'Unknown provider' }
              ]}
              required
            />
            <FormInput
              label="Policy Number"
              value={formData.policy_number}
              onChange={(value) => handleChange('policy_number', value)}
            />
            <FormInput
              label="Group Number"
              value={formData.group_number}
              onChange={(value) => handleChange('group_number', value)}
            />
            <FormInput
              label="Subscriber Name"
              value={formData.subscriber_name}
              onChange={(value) => handleChange('subscriber_name', value)}
            />
            <FormInput
              label="Relationship to Client"
              value={formData.relationship_to_client}
              onChange={(value) => handleChange('relationship_to_client', value)}
            />
            <FormInput
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(value) => handleChange('phone', value)}
            />
            <FormInput
              label="Amount Paid by Insurance"
              type="number"
              step="0.01"
              value={formData.amount_paid_by_insurance}
              onChange={(value) => handleChange('amount_paid_by_insurance', value)}
            />
          </div>

          {/* Adjuster selection */}
          <div className="mt-4 border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700">Adjuster (Optional)</label>
                <p className="text-xs text-gray-500">
                  Link this health claim to an adjuster for the health insurance carrier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjusterModal(true)}
                disabled={!formData.health_insurance_id}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedHealthAdjuster ? 'Change Adjuster' : 'Select Adjuster'}
              </button>
            </div>

            {selectedHealthAdjuster && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-gray-800 space-y-1">
                <p>
                  <span className="font-semibold">Name:</span>{' '}
                  {[selectedHealthAdjuster.first_name, selectedHealthAdjuster.last_name].filter(Boolean).join(' ') || 'N/A'}
                </p>
                {selectedHealthAdjuster.phone && (
                  <p>
                    <span className="font-semibold">Phone:</span> {selectedHealthAdjuster.phone}
                  </p>
                )}
                {selectedHealthAdjuster.email && (
                  <p>
                    <span className="font-semibold">Email:</span> {selectedHealthAdjuster.email}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subrogation */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Subrogation</h3>

          {/* Subrogation Claim Filed */}
          <div className="border border-gray-200 rounded-md p-4 mb-3">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.subrogation_claim_filed}
                onChange={(e) => handleChange('subrogation_claim_filed', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Subrogation Claim Filed</span>
            </label>
            {formData.subrogation_claim_filed && (
              <FormInput
                label="Subrogation Amount"
                type="number"
                step="0.01"
                value={formData.subrogation_amount}
                onChange={(value) => handleChange('subrogation_amount', value)}
              />
            )}
          </div>
        </div>

        {/* Lien Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Lien Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <FormInput
              label="Original Lien Amount"
              type="number"
              step="0.01"
              value={formData.lien_amount}
              onChange={(value) => handleChange('lien_amount', value)}
            />
            <FormInput
              label="Lien Filed Date"
              type="date"
              value={formData.lien_filed_date}
              onChange={(value) => handleChange('lien_filed_date', value)}
            />
          </div>

          {/* Lien Negotiated */}
          <div className="border border-gray-200 rounded-md p-4 mb-3">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.lien_negotiated}
                onChange={(e) => handleChange('lien_negotiated', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Lien Negotiated</span>
            </label>
            {formData.lien_negotiated && (
              <div>
                <FormInput
                  label="Final Lien Amount"
                  type="number"
                  step="0.01"
                  value={formData.final_lien_amount}
                  onChange={(value) => handleChange('final_lien_amount', value)}
                />
                {lienSavings > 0 && (
                  <div className="mt-2 p-2 bg-green-50 rounded-md">
                    <p className="text-xs text-green-600">
                      Savings: <span className="font-semibold">${lienSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lien Satisfied */}
          <div className="border border-gray-200 rounded-md p-4">
            <label className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={formData.lien_satisfied}
                onChange={(e) => handleChange('lien_satisfied', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">Lien Satisfied</span>
            </label>
            {formData.lien_satisfied && (
              <FormInput
                label="Satisfaction Date"
                type="date"
                value={formData.satisfaction_date}
                onChange={(value) => handleChange('satisfaction_date', value)}
              />
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

      <AdjusterSelectionModal
        isOpen={showAdjusterModal}
        onClose={() => setShowAdjusterModal(false)}
        existingAdjusters={
          formData.health_insurance_id
            ? healthAdjusters.filter((a: any) => a.health_insurance_id === formData.health_insurance_id)
            : healthAdjusters
        }
        insuranceOrProviderName={
          healthInsurers.find(h => h.id === formData.health_insurance_id)?.name || 'Health Insurance'
        }
        type="health"
        onSelect={(adjusterId) => {
          if (!adjusterId) {
            setShowAdjusterModal(false);
            return;
          }
          const adj = healthAdjusters.find((a: any) => a.id === adjusterId);
          if (adj) setSelectedHealthAdjuster(adj);
          setShowAdjusterModal(false);
        }}
        onCreate={async (adjusterInfo) => {
          try {
            if (!formData.health_insurance_id) {
              onShowToast('Select a health insurance carrier before adding an adjuster.', 'error');
              return;
            }
            const payload = {
              health_insurance_id: formData.health_insurance_id,
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
            const inserted = await createHealthAdjuster(payload);
            setHealthAdjusters(prev => [...prev, inserted]);
            setSelectedHealthAdjuster(inserted);
            onShowToast('Health adjuster created and linked to this claim.', 'success');
          } catch (error) {
            console.error('Error creating health adjuster:', error);
            onShowToast('Failed to create health adjuster. Please try again.', 'error');
          }
        }}
      />
    </Modal>
  );
}
