import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../forms/FormInput';
import FormSelect from '../forms/FormSelect';
import FormTextArea from '../forms/FormTextArea';
import { supabase } from '../../utils/database';
import { updateDefendant } from '../../services/update';

interface EditDefendantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defendant: any;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function EditDefendantModal({
  isOpen,
  onClose,
  defendant,
  casefileId,
  onUpdate,
  onShowToast
}: EditDefendantModalProps) {
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    is_policyholder: true,
    policyholder_first_name: '',
    policyholder_last_name: '',
    auto_insurance_id: null as number | null,
    policy_number: '',
    liability_percentage: 100,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchInsuranceCompanies();
      if (defendant) {
        // Handle both camelCase (from model) and snake_case (from database)
        const mapField = (camel: string, snake: string) => defendant[camel] || defendant[snake] || '';
        const mapBoolean = (camel: string, snake: string) => defendant[camel] ?? defendant[snake] ?? true;
        
        setFormData({
          first_name: mapField('firstName', 'first_name'),
          last_name: mapField('lastName', 'last_name'),
          is_policyholder: mapBoolean('isPolicyholder', 'is_policyholder'),
          policyholder_first_name: mapField('policyholderFirstName', 'policyholder_first_name'),
          policyholder_last_name: mapField('policyholderLastName', 'policyholder_last_name'),
          auto_insurance_id: defendant.auto_insurance_id || defendant.autoInsuranceId || null,
          policy_number: mapField('policyNumber', 'policy_number'),
          liability_percentage: defendant.liability_percentage || defendant.liabilityPercentage || 100,
          notes: defendant.notes || ''
        });
      }
    }
  }, [isOpen, defendant]);

  const fetchInsuranceCompanies = async () => {
    const { data, error } = await supabase
      .from('auto_insurance')
      .select('*')
      .order('name');

    if (!error && data) {
      setInsuranceCompanies(data);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name) {
      onShowToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      if (defendant?.id) {
        const result = await updateDefendant(defendant.id, formData);
        if (!result.ok) throw new Error(result.message || 'Update failed');
        
        // Sync insurance update to third party claim if insurance changed
        const oldInsuranceId = defendant.auto_insurance_id || defendant.autoInsuranceId;
        if (formData.auto_insurance_id !== oldInsuranceId) {
          // Find the third party claim for this defendant
          const { data: thirdPartyClaim, error: claimError } = await supabase
            .from('third_party_claims')
            .select('id')
            .eq('defendant_id', defendant.id)
            .maybeSingle();
          
          if (claimError) {
            console.warn('Error fetching third party claim for sync:', claimError);
          } else if (thirdPartyClaim) {
            // Update the third party claim's insurance to match defendant
            const { error: updateClaimError } = await supabase
              .from('third_party_claims')
              .update({ auto_insurance_id: formData.auto_insurance_id })
              .eq('id', thirdPartyClaim.id);
            
            if (updateClaimError) {
              console.warn('Error syncing insurance to third party claim:', updateClaimError);
              // Don't throw - defendant update succeeded, just log the warning
            }
          }
        }
        
        onShowToast('Defendant information updated successfully', 'success');
      } else {
        // Create a new defendant for this case
        const { data, error } = await supabase
          .from('defendants')
          .insert({
            casefile_id: casefileId,
            first_name: formData.first_name,
            last_name: formData.last_name,
            is_policyholder: formData.is_policyholder,
            policyholder_first_name: formData.policyholder_first_name,
            policyholder_last_name: formData.policyholder_last_name,
            auto_insurance_id: formData.auto_insurance_id,
            policy_number: formData.policy_number,
            liability_percentage: formData.liability_percentage,
            notes: formData.notes
          })
          .select();

        if (error) throw error;
        onShowToast('Defendant added successfully', 'success');
      }

      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: 'Defendant information updated',
        timestamp: new Date().toISOString(),
        user_name: 'Admin'
      });

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating defendant:', error);
      onShowToast('Failed to update defendant information', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Defendant Information">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Defendant Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="First Name"
              value={formData.first_name}
              onChange={(value) => handleChange('first_name', value)}
              required
            />
            <FormInput
              label="Last Name"
              value={formData.last_name}
              onChange={(value) => handleChange('last_name', value)}
              required
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Is Policyholder? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.is_policyholder === true}
                  onChange={() => handleChange('is_policyholder', true)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={formData.is_policyholder === false}
                  onChange={() => handleChange('is_policyholder', false)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>

          {!formData.is_policyholder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormInput
                label="Policyholder First Name"
                value={formData.policyholder_first_name}
                onChange={(value) => handleChange('policyholder_first_name', value)}
              />
              <FormInput
                label="Policyholder Last Name"
                value={formData.policyholder_last_name}
                onChange={(value) => handleChange('policyholder_last_name', value)}
              />
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Liability Percentage <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.liability_percentage}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 0 : parseInt(value);
                if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                  handleChange('liability_percentage', numValue);
                }
              }}
              onBlur={(e) => {
                // Ensure 0 stays as 0 and doesn't auto-change
                const value = e.target.value;
                if (value === '' || value === '0') {
                  handleChange('liability_percentage', 0);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">Percentage of fault assigned to this defendant (0-100)</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Insurance Information</h3>
          <div className="space-y-4">
            <FormSelect
              label="Insurance Company"
              value={formData.auto_insurance_id?.toString() || ''}
              onChange={(value) => handleChange('auto_insurance_id', value ? parseInt(value) : null)}
              options={[
                { value: '', label: 'Select insurance company...' },
                ...insuranceCompanies.map(ins => ({
                  value: ins.id.toString(),
                  label: ins.name
                }))
              ]}
            />
            <FormInput
              label="Policy Number"
              value={formData.policy_number}
              onChange={(value) => handleChange('policy_number', value)}
            />
            <FormTextArea
              label="Notes"
              value={formData.notes}
              onChange={(value) => handleChange('notes', value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
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
      </div>
    </Modal>
  );
}
