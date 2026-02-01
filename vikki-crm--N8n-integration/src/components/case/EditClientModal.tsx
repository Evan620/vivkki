import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import FormInput from '../forms/FormInput';
import FormSelect from '../forms/FormSelect';
import FormTextArea from '../forms/FormTextArea';
import { supabase } from '../../utils/database';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: any;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function EditClientModal({
  isOpen,
  onClose,
  client,
  casefileId,
  onUpdate,
  onShowToast
}: EditClientModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    date_of_birth: '',
    ssn: '',
    marital_status: '',
    is_driver: true,
    street_address: '',
    city: '',
    state: '',
    zip_code: '',
    primary_phone: '',
    secondary_phone: '',
    email: '',
    injury_description: '',
    prior_accidents: '',
    prior_injuries: '',
    work_impact: '',
    referrer: '',
    referrer_relationship: ''
  });
  const [saving, setSaving] = useState(false);

  // Reset form when client changes
  useEffect(() => {
    if (isOpen && client) {
      // Handle both camelCase (from model) and snake_case (from database)
      const mapField = (camel: string, snake: string) => client[camel] || client[snake] || '';
      const mapBoolean = (camel: string, snake: string) => client[camel] ?? client[snake] ?? true;
      
      setFormData({
        first_name: mapField('firstName', 'first_name'),
        middle_name: mapField('middleName', 'middle_name'),
        last_name: mapField('lastName', 'last_name'),
        date_of_birth: mapField('dateOfBirth', 'date_of_birth'),
        ssn: client.ssn || '',
        marital_status: mapField('maritalStatus', 'marital_status'),
        is_driver: mapBoolean('isDriver', 'is_driver'),
        street_address: mapField('streetAddress', 'street_address'),
        city: client.city || '',
        state: client.state || '',
        zip_code: mapField('zipCode', 'zip_code'),
        primary_phone: mapField('primaryPhone', 'primary_phone'),
        secondary_phone: mapField('secondaryPhone', 'secondary_phone'),
        email: client.email || '',
        injury_description: mapField('injuryDescription', 'injury_description'),
        prior_accidents: mapField('priorAccidents', 'prior_accidents'),
        prior_injuries: mapField('priorInjuries', 'prior_injuries'),
        work_impact: mapField('workImpact', 'work_impact'),
        referrer: client.referrer || '',
        referrer_relationship: mapField('referrerRelationship', 'referrer_relationship')
      });
    }
  }, [isOpen, client]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name || !formData.date_of_birth) {
      onShowToast('Please fill in all required fields', 'error');
      return;
    }

    setSaving(true);
    try {
      if (client?.id) {
        console.log('Updating client:', client.id, 'with data:', formData);
        const { data, error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', client.id)
          .select();

        if (error) throw error;

        await supabase.from('work_logs').insert({
          casefile_id: casefileId,
          description: 'Client information updated',
          timestamp: new Date().toISOString(),
          user_name: 'Admin'
        });

        onShowToast('Client information updated successfully', 'success');
      } else {
        // Create new client for this case
        console.log('Creating client for casefile:', casefileId, 'with data:', formData);
        const insertPayload = {
          casefile_id: casefileId,
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          ssn: formData.ssn,
          marital_status: formData.marital_status,
          is_driver: formData.is_driver,
          street_address: formData.street_address,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
          primary_phone: formData.primary_phone,
          secondary_phone: formData.secondary_phone,
          email: formData.email,
          injury_description: formData.injury_description,
          prior_accidents: formData.prior_accidents,
          prior_injuries: formData.prior_injuries,
          work_impact: formData.work_impact,
          referrer: formData.referrer,
          referrer_relationship: formData.referrer_relationship
        };
        const { data, error } = await supabase
          .from('clients')
          .insert(insertPayload)
          .select();

        if (error) throw error;

        await supabase.from('work_logs').insert({
          casefile_id: casefileId,
          description: 'Client added from Clients tab',
          timestamp: new Date().toISOString(),
          user_name: 'Admin'
        });

        onShowToast('Client added successfully', 'success');
      }

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error saving client:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      onShowToast(`Failed to save client: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Client Information" maxWidth="lg">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              name="first_name"
              label="First Name"
              value={formData.first_name}
              onChange={(value) => handleChange('first_name', value)}
              required
            />
            <FormInput
              name="middle_name"
              label="Middle Name"
              value={formData.middle_name}
              onChange={(value) => handleChange('middle_name', value)}
            />
            <FormInput
              name="last_name"
              label="Last Name"
              value={formData.last_name}
              onChange={(value) => handleChange('last_name', value)}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormInput
              name="date_of_birth"
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(value) => handleChange('date_of_birth', value)}
              required
            />
            <FormInput
              name="ssn"
              label="SSN"
              value={formData.ssn}
              onChange={(value) => handleChange('ssn', value)}
              placeholder="123-45-6789"
            />
            <FormSelect
              name="marital_status"
              label="Marital Status"
              value={formData.marital_status}
              onChange={(value) => handleChange('marital_status', value)}
              options={[
                { value: '', label: 'Select...' },
                { value: 'Single', label: 'Single' },
                { value: 'Married', label: 'Married' },
                { value: 'Divorced', label: 'Divorced' },
                { value: 'Widowed', label: 'Widowed' },
                { value: 'Separated', label: 'Separated' }
              ]}
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_driver"
                checked={formData.is_driver}
                onChange={(e) => handleChange('is_driver', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_driver" className="text-sm font-medium text-gray-700">
                Is Driver
              </label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Contact Information</h3>
          <div className="space-y-4">
            <FormInput
              name="street_address"
              label="Street Address"
              value={formData.street_address}
              onChange={(value) => handleChange('street_address', value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput
                name="city"
                label="City"
                value={formData.city}
                onChange={(value) => handleChange('city', value)}
              />
              <FormInput
                name="state"
                label="State"
                value={formData.state}
                onChange={(value) => handleChange('state', value)}
                placeholder="OK"
              />
              <FormInput
                name="zip_code"
                label="Zip Code"
                value={formData.zip_code}
                onChange={(value) => handleChange('zip_code', value)}
                placeholder="73102"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                name="primary_phone"
                label="Primary Phone"
                value={formData.primary_phone}
                onChange={(value) => handleChange('primary_phone', value)}
                placeholder="(405) 555-1234"
              />
              <FormInput
                name="secondary_phone"
                label="Secondary Phone"
                value={formData.secondary_phone}
                onChange={(value) => handleChange('secondary_phone', value)}
                placeholder="(405) 555-5678"
              />
            </div>
            <FormInput
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={(value) => handleChange('email', value)}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Medical Information</h3>
          <div className="space-y-4">
            <FormTextArea
              name="injury_description"
              label="Injury Description"
              value={formData.injury_description}
              onChange={(value) => handleChange('injury_description', value)}
              rows={3}
              placeholder="Describe the injuries sustained..."
            />
            <FormTextArea
              name="prior_accidents"
              label="Prior Accidents"
              value={formData.prior_accidents}
              onChange={(value) => handleChange('prior_accidents', value)}
              rows={2}
              placeholder="Describe any prior accidents..."
            />
            <FormTextArea
              name="prior_injuries"
              label="Prior Injuries"
              value={formData.prior_injuries}
              onChange={(value) => handleChange('prior_injuries', value)}
              rows={2}
              placeholder="Describe any prior injuries..."
            />
            <FormTextArea
              name="work_impact"
              label="Work Impact"
              value={formData.work_impact}
              onChange={(value) => handleChange('work_impact', value)}
              rows={2}
              placeholder="Describe how the accident impacted work..."
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Referral Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="referrer"
              label="Referred By"
              value={formData.referrer}
              onChange={(value) => handleChange('referrer', value)}
            />
            <FormInput
              name="referrer_relationship"
              label="Relationship"
              value={formData.referrer_relationship}
              onChange={(value) => handleChange('referrer_relationship', value)}
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
