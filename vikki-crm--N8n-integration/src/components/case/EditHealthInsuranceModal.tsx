import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../forms/FormInput';
import FormTextArea from '../forms/FormTextArea';
import { supabase } from '../../utils/database';

interface EditHealthInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthInsurance: any;
  casefileId?: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function EditHealthInsuranceModal({
  isOpen,
  onClose,
  healthInsurance,
  casefileId,
  onUpdate,
  onShowToast
}: EditHealthInsuranceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    request_method: 'Email',
    street_address: '',
    street_address_2: '',
    city: '',
    state: '',
    zip_code: '',
    phone_1_type: '',
    phone_1: '',
    phone_2_type: '',
    phone_2: '',
    fax_1_type: '',
    fax_1: '',
    fax_2_type: '',
    fax_2: '',
    email_1_type: '',
    email_1: '',
    email_2_type: '',
    email_2: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && healthInsurance) {
      setFormData({
        name: healthInsurance.name || '',
        request_method: healthInsurance.request_method || 'Email',
        street_address: healthInsurance.street_address || '',
        street_address_2: healthInsurance.street_address_2 || '',
        city: healthInsurance.city || '',
        state: healthInsurance.state || '',
        zip_code: healthInsurance.zip_code || '',
        phone_1_type: healthInsurance.phone_1_type || '',
        phone_1: healthInsurance.phone_1 || healthInsurance.phone || '',
        phone_2_type: healthInsurance.phone_2_type || '',
        phone_2: healthInsurance.phone_2 || '',
        fax_1_type: healthInsurance.fax_1_type || '',
        fax_1: healthInsurance.fax_1 || '',
        fax_2_type: healthInsurance.fax_2_type || '',
        fax_2: healthInsurance.fax_2 || '',
        email_1_type: healthInsurance.email_1_type || '',
        email_1: healthInsurance.email_1 || '',
        email_2_type: healthInsurance.email_2_type || '',
        email_2: healthInsurance.email_2 || '',
        notes: healthInsurance.notes || ''
      });
    }
  }, [isOpen, healthInsurance]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      onShowToast('Provider name is required', 'error');
      return;
    }

    if (!healthInsurance || !healthInsurance.id) {
      onShowToast('Health insurance provider not found', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('health_insurance')
        .update({
          name: formData.name.trim(),
          request_method: formData.request_method,
          street_address: formData.street_address || null,
          street_address_2: formData.street_address_2 || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          phone_1_type: formData.phone_1_type || null,
          phone_1: formData.phone_1 || null,
          phone_2_type: formData.phone_2_type || null,
          phone_2: formData.phone_2 || null,
          fax_1_type: formData.fax_1_type || null,
          fax_1: formData.fax_1 || null,
          fax_2_type: formData.fax_2_type || null,
          fax_2: formData.fax_2 || null,
          email_1_type: formData.email_1_type || null,
          email_1: formData.email_1 || null,
          email_2_type: formData.email_2_type || null,
          email_2: formData.email_2 || null,
          notes: formData.notes || null
        })
        .eq('id', healthInsurance.id);

      if (error) throw error;

      if (casefileId) {
        await supabase.from('work_logs').insert({
          casefile_id: casefileId,
          description: `Health insurance provider "${formData.name}" updated`,
          timestamp: new Date().toISOString(),
          user_name: 'Admin'
        });
      }

      onShowToast('Health insurance provider updated successfully', 'success');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating health insurance:', error);
      onShowToast(`Failed to update health insurance: ${error?.message || 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!healthInsurance) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Health Insurance Provider">
      <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Provider Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Provider Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Provider Name"
              value={formData.name}
              onChange={(value) => handleChange('name', value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Request Method
              </label>
              <select
                value={formData.request_method}
                onChange={(e) => handleChange('request_method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Email">Email</option>
                <option value="Fax">Fax</option>
                <option value="Optum">Optum</option>
              </select>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Address Information</h3>
          <div className="space-y-4">
            <FormInput
              label="Street Address"
              value={formData.street_address}
              onChange={(value) => handleChange('street_address', value)}
            />
            <FormInput
              label="Street Address 2"
              value={formData.street_address_2}
              onChange={(value) => handleChange('street_address_2', value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                label="City"
                value={formData.city}
                onChange={(value) => handleChange('city', value)}
              />
              <FormInput
                label="State"
                value={formData.state}
                onChange={(value) => handleChange('state', value)}
              />
              <FormInput
                label="Zip Code"
                value={formData.zip_code}
                onChange={(value) => handleChange('zip_code', value)}
              />
            </div>
          </div>
        </div>

        {/* Phone Numbers */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Phone Numbers</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone 1 Type</label>
                <select
                  value={formData.phone_1_type}
                  onChange={(e) => handleChange('phone_1_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="General">General</option>
                  <option value="Subrogation">Subrogation</option>
                </select>
              </div>
              <FormInput
                label="Phone 1 Number"
                value={formData.phone_1}
                onChange={(value) => handleChange('phone_1', value)}
                type="tel"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone 2 Type</label>
                <select
                  value={formData.phone_2_type}
                  onChange={(e) => handleChange('phone_2_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="General">General</option>
                  <option value="Subrogation">Subrogation</option>
                </select>
              </div>
              <FormInput
                label="Phone 2 Number"
                value={formData.phone_2}
                onChange={(value) => handleChange('phone_2', value)}
                type="tel"
              />
            </div>
          </div>
        </div>

        {/* Fax Numbers */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Fax Numbers</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax 1 Type</label>
                <select
                  value={formData.fax_1_type}
                  onChange={(e) => handleChange('fax_1_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="General">General</option>
                  <option value="Subrogation">Subrogation</option>
                </select>
              </div>
              <FormInput
                label="Fax 1 Number"
                value={formData.fax_1}
                onChange={(value) => handleChange('fax_1', value)}
                type="tel"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fax 2 Type</label>
                <select
                  value={formData.fax_2_type}
                  onChange={(e) => handleChange('fax_2_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="General">General</option>
                  <option value="Subrogation">Subrogation</option>
                </select>
              </div>
              <FormInput
                label="Fax 2 Number"
                value={formData.fax_2}
                onChange={(value) => handleChange('fax_2', value)}
                type="tel"
              />
            </div>
          </div>
        </div>

        {/* Email Addresses */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Email Addresses</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email 1 Type</label>
                <select
                  value={formData.email_1_type}
                  onChange={(e) => handleChange('email_1_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="General">General</option>
                  <option value="Subrogation">Subrogation</option>
                </select>
              </div>
              <FormInput
                label="Email 1 Address"
                value={formData.email_1}
                onChange={(value) => handleChange('email_1', value)}
                type="email"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email 2 Type</label>
                <select
                  value={formData.email_2_type}
                  onChange={(e) => handleChange('email_2_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type...</option>
                  <option value="General">General</option>
                  <option value="Subrogation">Subrogation</option>
                </select>
              </div>
              <FormInput
                label="Email 2 Address"
                value={formData.email_2}
                onChange={(value) => handleChange('email_2', value)}
                type="email"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <FormTextArea
          label="Provider Notes"
          value={formData.notes}
          onChange={(value) => handleChange('notes', value)}
          rows={4}
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
    </Modal>
  );
}

