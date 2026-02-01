import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../forms/FormInput';
import FormTextArea from '../forms/FormTextArea';
import { supabase } from '../../utils/database';
import { parseCurrencyInput, formatDateForInput } from '../../utils/formatting';

interface EditMedicalBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicalBill: any;
  providerName: string;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function EditMedicalBillModal({
  isOpen,
  onClose,
  medicalBill,
  providerName,
  casefileId,
  onUpdate,
  onShowToast
}: EditMedicalBillModalProps) {
  const [formData, setFormData] = useState({
    total_billed: '0',
    insurance_paid: '0',
    insurance_adjusted: '0',
    last_request_date: '',
    lien_filed: false,
    in_collections: false,
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && medicalBill) {
      setFormData({
        total_billed: medicalBill.total_billed?.toString() || '0',
        insurance_paid: medicalBill.insurance_paid?.toString() || '0',
        insurance_adjusted: medicalBill.insurance_adjusted?.toString() || '0',
        last_request_date: formatDateForInput(medicalBill.last_request_date),
        lien_filed: medicalBill.lien_filed || false,
        in_collections: medicalBill.in_collections || false,
        notes: medicalBill.notes || ''
      });
    }
  }, [isOpen, medicalBill]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateDue = () => {
    const billed = parseCurrencyInput(formData.total_billed);
    const paid = parseCurrencyInput(formData.insurance_paid);
    const adjusted = parseCurrencyInput(formData.insurance_adjusted);
    return billed - paid - adjusted;
  };

  const handleSave = async () => {
    const totalBilled = parseCurrencyInput(formData.total_billed);
    const insurancePaid = parseCurrencyInput(formData.insurance_paid);
    const insuranceAdjusted = parseCurrencyInput(formData.insurance_adjusted);

    if (totalBilled < 0) {
      onShowToast('Total billed cannot be negative', 'error');
      return;
    }

    if (insurancePaid < 0) {
      onShowToast('Insurance paid cannot be negative', 'error');
      return;
    }

    if (insuranceAdjusted < 0) {
      onShowToast('Insurance adjusted cannot be negative', 'error');
      return;
    }

    if (insurancePaid > totalBilled) {
      onShowToast('Insurance paid cannot exceed total billed', 'error');
      return;
    }

    if (insurancePaid + insuranceAdjusted > totalBilled) {
      onShowToast('Insurance paid + adjusted cannot exceed total billed', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('medical_bills')
        .update({
          total_billed: totalBilled,
          insurance_paid: insurancePaid,
          insurance_adjusted: insuranceAdjusted,
          last_request_date: formData.last_request_date || null,
          lien_filed: formData.lien_filed,
          in_collections: formData.in_collections,
          notes: formData.notes
        })
        .eq('id', medicalBill.id);

      if (error) throw error;

      // Auto-update case status to Active
      await supabase
        .from('casefiles')
        .update({ status: 'Active', updated_at: new Date().toISOString() })
        .eq('id', casefileId);

      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: `Medical bill updated for ${providerName}`,
        timestamp: new Date().toISOString(),
        user_name: 'Admin'
      });

      onShowToast('Medical bill updated successfully', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating medical bill:', error);
      onShowToast('Failed to update medical bill', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Medical Bill - ${providerName}`}>
      <div className="p-6 space-y-6">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Provider Name</label>
          <p className="mt-1 text-sm text-gray-900 font-medium">{providerName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Total Billed"
            type="number"
            step="0.01"
            value={formData.total_billed}
            onChange={(value) => handleChange('total_billed', value)}
            placeholder="0.00"
          />
          <FormInput
            label="Insurance Paid"
            type="number"
            step="0.01"
            value={formData.insurance_paid}
            onChange={(value) => handleChange('insurance_paid', value)}
            placeholder="0.00"
          />
          <FormInput
            label="Insurance Adjusted"
            type="number"
            step="0.01"
            value={formData.insurance_adjusted}
            onChange={(value) => handleChange('insurance_adjusted', value)}
            placeholder="0.00"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Due
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900">
              ${calculateDue().toFixed(2)}
            </div>
          </div>
        </div>

        <FormInput
          label="Last Request Date"
          type="date"
          value={formData.last_request_date}
          onChange={(value) => handleChange('last_request_date', value)}
        />

        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.lien_filed}
              onChange={(e) => handleChange('lien_filed', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Lien Filed</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.in_collections}
              onChange={(e) => handleChange('in_collections', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">In Collections</span>
          </label>
        </div>

        <FormTextArea
          label="Notes"
          value={formData.notes}
          onChange={(value) => handleChange('notes', value)}
          rows={3}
          placeholder="Additional notes about this medical bill..."
        />

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
