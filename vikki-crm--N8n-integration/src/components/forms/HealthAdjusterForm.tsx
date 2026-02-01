import { useState, useEffect } from 'react';
import FormInput from './FormInput';
import { X } from 'lucide-react';

interface HealthAdjusterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adjusterData: any) => Promise<void>;
  initialData?: any | null;
  healthInsuranceId: number;
}

export default function HealthAdjusterForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  healthInsuranceId
}: HealthAdjusterFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    fax: '',
    street_address: '',
    city: '',
    state: '',
    zip_code: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          first_name: initialData.first_name || '',
          middle_name: initialData.middle_name || '',
          last_name: initialData.last_name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          fax: initialData.fax || '',
          street_address: initialData.street_address || '',
          city: initialData.city || '',
          state: initialData.state || '',
          zip_code: initialData.zip_code || ''
        });
      } else {
        setFormData({
          first_name: '',
          middle_name: '',
          last_name: '',
          email: '',
          phone: '',
          fax: '',
          street_address: '',
          city: '',
          state: '',
          zip_code: ''
        });
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: At least first name OR last name required
    if (!formData.first_name.trim() && !formData.last_name.trim()) {
      setError('Either first name or last name is required');
      return;
    }

    setSaving(true);
    try {
      const adjusterData = {
        health_insurance_id: healthInsuranceId,
        first_name: formData.first_name.trim() || null,
        middle_name: formData.middle_name.trim() || null,
        last_name: formData.last_name.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        fax: formData.fax.trim() || null,
        street_address: formData.street_address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        zip_code: formData.zip_code.trim() || null
      };

      await onSubmit(adjusterData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save adjuster');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Adjuster' : 'Add Adjuster'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="First Name"
              value={formData.first_name}
              onChange={(value) => handleChange('first_name', value)}
            />
            <FormInput
              label="Middle Name"
              value={formData.middle_name}
              onChange={(value) => handleChange('middle_name', value)}
            />
            <FormInput
              label="Last Name"
              value={formData.last_name}
              onChange={(value) => handleChange('last_name', value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Email"
              value={formData.email}
              onChange={(value) => handleChange('email', value)}
              type="email"
            />
            <FormInput
              label="Phone"
              value={formData.phone}
              onChange={(value) => handleChange('phone', value)}
            />
            <FormInput
              label="Fax"
              value={formData.fax}
              onChange={(value) => handleChange('fax', value)}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Address Information</h3>
            <div className="space-y-4">
              <FormInput
                label="Street Address"
                value={formData.street_address}
                onChange={(value) => handleChange('street_address', value)}
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Saving...' : initialData ? 'Update Adjuster' : 'Add Adjuster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
