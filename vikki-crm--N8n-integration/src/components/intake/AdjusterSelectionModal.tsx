import { useState, useEffect } from 'react';
import { X, Plus, User } from 'lucide-react';
import Modal from '../common/Modal';
import FormInput from '../forms/FormInput';
import FormSelect from '../forms/FormSelect';
import { createAutoAdjuster, createHealthAdjuster } from '../../utils/database';

interface AdjusterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (adjusterId: number | null) => void;
  onCreate: (adjusterInfo: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    phone: string;
    fax: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
  }) => void;
  existingAdjusters: any[];
  insuranceOrProviderName: string;
  type: 'health' | 'medical_provider' | 'auto';
  isLoading?: boolean;
  insuranceId?: number; // Insurance ID for creating adjusters
  onRefresh?: () => void; // Callback to refresh adjuster list after creation
}

export default function AdjusterSelectionModal({
  isOpen,
  onClose,
  onSelect,
  onCreate,
  existingAdjusters,
  insuranceOrProviderName,
  type,
  isLoading = false,
  insuranceId,
  onRefresh
}: AdjusterSelectionModalProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAdjusterId, setSelectedAdjusterId] = useState<string>('');
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    fax: '',
    street_address: '',
    city: '',
    state: 'OK',
    zip_code: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowCreateForm(false);
      setSelectedAdjusterId('');
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        phone: '',
        fax: '',
        street_address: '',
        city: '',
        state: 'OK',
        zip_code: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleSelectExisting = () => {
    if (selectedAdjusterId) {
      onSelect(parseInt(selectedAdjusterId));
      onClose();
    }
  };

  const handleCreateNew = async () => {
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim() && !formData.last_name.trim()) {
      newErrors.name = 'Either first name or last name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // If we have insuranceId and type, save to database immediately
    if (insuranceId && (type === 'auto' || type === 'health')) {
      setSaving(true);
      try {
        const adjusterData = {
          [type === 'auto' ? 'auto_insurance_id' : 'health_insurance_id']: insuranceId,
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

        let createdAdjuster;
        if (type === 'auto') {
          createdAdjuster = await createAutoAdjuster(adjusterData);
        } else {
          createdAdjuster = await createHealthAdjuster(adjusterData);
        }

        // Refresh adjuster list if callback provided
        if (onRefresh) {
          await onRefresh();
        }

        // Call onSelect with the created adjuster ID
        onSelect(createdAdjuster.id);
        onClose();
      } catch (error: any) {
        console.error('Error creating adjuster:', error);
        setErrors({ general: error.message || 'Failed to create adjuster' });
      } finally {
        setSaving(false);
      }
    } else {
      // Fallback: call onCreate with adjuster info (for cases without insuranceId)
      onCreate({
        first_name: formData.first_name.trim(),
        middle_name: formData.middle_name.trim() || undefined,
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        fax: formData.fax.trim(),
        street_address: formData.street_address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zip_code: formData.zip_code.trim()
      });
      onClose();
    }
  };

  const adjusterOptions = existingAdjusters.map(adj => ({
    value: adj.id.toString(),
    label: `${adj.first_name || ''} ${adj.middle_name || ''} ${adj.last_name || ''}`.trim() || 'Unnamed Adjuster'
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Select Adjuster for ${insuranceOrProviderName}`}
      maxWidth="md"
    >
      <div className="p-6 space-y-6">
        {!showCreateForm ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Existing Adjuster
              </label>
              {isLoading ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Loading adjusters...</p>
                </div>
              ) : existingAdjusters.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-2">No adjusters found for this insurance.</p>
                  <p className="text-xs text-gray-400">Click "Add New Adjuster" to create one.</p>
                </div>
              ) : (
                <>
                  <FormSelect
                    name="adjuster"
                    value={selectedAdjusterId}
                    onChange={(value) => {
                      setSelectedAdjusterId(value);
                      setErrors({});
                    }}
                    options={adjusterOptions}
                    error={errors.adjuster}
                  />
                  {selectedAdjusterId && (
                    <button
                      type="button"
                      onClick={handleSelectExisting}
                      className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Use Selected Adjuster
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="w-full px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Adjuster
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New Adjuster Information</h3>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errors.general}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={(value) => {
                    setFormData({ ...formData, first_name: value });
                    setErrors({ ...errors, name: '' });
                  }}
                  error={errors.name}
                />
                <FormInput
                  label="Middle Name"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={(value) => setFormData({ ...formData, middle_name: value })}
                />
              </div>
              <FormInput
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={(value) => {
                  setFormData({ ...formData, last_name: value });
                  setErrors({ ...errors, name: '' });
                }}
                error={errors.name}
              />
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                />
                <FormInput
                  label="Fax"
                  name="fax"
                  value={formData.fax}
                  onChange={(value) => setFormData({ ...formData, fax: value })}
                />
              </div>
              <FormInput
                label="Street Address"
                name="street_address"
                value={formData.street_address}
                onChange={(value) => setFormData({ ...formData, street_address: value })}
              />
              <div className="grid grid-cols-3 gap-4">
                <FormInput
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={(value) => setFormData({ ...formData, city: value })}
                />
                <FormInput
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={(value) => setFormData({ ...formData, state: value })}
                />
                <FormInput
                  label="Zip Code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={(value) => setFormData({ ...formData, zip_code: value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creating...' : 'Create & Use Adjuster'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
