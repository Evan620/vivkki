import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { createHealthInsurer } from '../../utils/database';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInsurer?: any) => void;
}

const CONTACT_TYPES = ['Main', 'Claims', 'Member Services', 'Billing', 'Other'];

export default function AddHealthInsuranceModal({ isOpen, onClose, onSuccess }: Props) {
  // Company Information
  const [name, setName] = useState('');
  
  // Address Information
  const [streetAddress, setStreetAddress] = useState('');
  const [streetAddress2, setStreetAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('OK');
  const [zipCode, setZipCode] = useState('');
  
  // Contact Information - Dynamic arrays
  const [phones, setPhones] = useState<Array<{ type: string; number: string }>>([{ type: 'Main', number: '' }]);
  const [faxes, setFaxes] = useState<Array<{ type: string; number: string }>>([{ type: 'Main', number: '' }]);
  const [emails, setEmails] = useState<Array<{ type: string; address: string }>>([{ type: 'Main', address: '' }]);
  
  // Notes
  const [notes, setNotes] = useState('');
  
  // UI State
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAddressSection, setShowAddressSection] = useState(false);
  const [showContactSection, setShowContactSection] = useState(false);
  const [showNotesSection, setShowNotesSection] = useState(false);
  
  const disabled = !name.trim();

  const handleSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (disabled || saving) return;
    setSaving(true);
    setError('');
    try {
      const newInsurer = await createHealthInsurer({ 
        name: name.trim(), 
        street_address: streetAddress.trim() || null,
        street_address_2: streetAddress2.trim() || null,
        city: city.trim() || null, 
        state: state.trim() || 'OK',
        zip_code: zipCode.trim() || null,
        phone: phones[0]?.number?.trim() || null,
        phone_1_type: phones[0]?.type || null,
        phone_1: phones[0]?.number?.trim() || null,
        phone_2_type: phones[1]?.type || null,
        phone_2: phones[1]?.number?.trim() || null,
        fax_1_type: faxes[0]?.type || null,
        fax_1: faxes[0]?.number?.trim() || null,
        fax_2_type: faxes[1]?.type || null,
        fax_2: faxes[1]?.number?.trim() || null,
        email_1_type: emails[0]?.type || null,
        email_1: emails[0]?.address?.trim() || null,
        email_2_type: emails[1]?.type || null,
        email_2: emails[1]?.address?.trim() || null,
        notes: notes.trim() || null
      });
      // Wait a moment to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 100));
      onSuccess(newInsurer);
      resetForm();
    } catch (e) {
      console.error('Failed to create health insurer', e);
      setError('Could not save health insurance. Please try again.');
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setStreetAddress('');
    setStreetAddress2('');
    setCity('');
    setState('OK');
    setZipCode('');
    setPhones([{ type: 'Main', number: '' }]);
    setFaxes([{ type: 'Main', number: '' }]);
    setEmails([{ type: 'Main', address: '' }]);
    setNotes('');
    setError('');
    setSaving(false);
    setShowAddressSection(false);
    setShowContactSection(false);
    setShowNotesSection(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const addPhone = () => {
    if (phones.length < 3) {
      setPhones([...phones, { type: 'Main', number: '' }]);
    }
  };

  const removePhone = (index: number) => {
    if (phones.length > 1) {
      setPhones(phones.filter((_, i) => i !== index));
    }
  };

  const updatePhone = (index: number, field: 'type' | 'number', value: string) => {
    const updated = [...phones];
    updated[index] = { ...updated[index], [field]: value };
    setPhones(updated);
  };

  const addFax = () => {
    if (faxes.length < 3) {
      setFaxes([...faxes, { type: 'Main', number: '' }]);
    }
  };

  const removeFax = (index: number) => {
    if (faxes.length > 1) {
      setFaxes(faxes.filter((_, i) => i !== index));
    }
  };

  const updateFax = (index: number, field: 'type' | 'number', value: string) => {
    const updated = [...faxes];
    updated[index] = { ...updated[index], [field]: value };
    setFaxes(updated);
  };

  const addEmail = () => {
    if (emails.length < 2) {
      setEmails([...emails, { type: 'Main', address: '' }]);
    }
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, field: 'type' | 'address', value: string) => {
    const updated = [...emails];
    updated[index] = { ...updated[index], [field]: value };
    setEmails(updated);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Health Insurance" maxWidth="lg">
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
        {error && (
            <div className="px-3 py-2 rounded-md bg-red-50 text-red-700 text-sm border border-red-200">
            {error}
          </div>
        )}
          
          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Company Information</h3>
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
          </label>
          <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={name}
            onChange={e => setName(e.target.value)}
                placeholder="Blue Cross Blue Shield, Aetna, etc."
                autoFocus
          />
        </div>
          </div>

          {/* Address Information - Collapsible */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAddressSection(!showAddressSection)}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Address Information</span>
              {showAddressSection ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {showAddressSection && (
              <div className="p-4 space-y-4 bg-white">
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={streetAddress}
                    onChange={e => setStreetAddress(e.target.value)}
                    placeholder="123 Main St"
            />
          </div>
          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address 2</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={streetAddress2}
                    onChange={e => setStreetAddress2(e.target.value)}
                    placeholder="Suite 100"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Oklahoma City"
            />
        </div>
        <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={state}
            onChange={e => setState(e.target.value)}
            placeholder="OK"
          />
        </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                      placeholder="73102"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information - Collapsible */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowContactSection(!showContactSection)}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Contact Information</span>
              {showContactSection ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {showContactSection && (
              <div className="p-4 space-y-6 bg-white">
                {/* Phone Numbers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Phone Numbers</label>
                    {phones.length < 3 && (
                      <button
                        type="button"
                        onClick={addPhone}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Phone
                      </button>
                    )}
                  </div>
                  {phones.map((phone, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={phone.type}
                        onChange={e => updatePhone(index, 'type', e.target.value)}
                        className="w-36 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      >
                        {CONTACT_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={phone.number}
                        onChange={e => updatePhone(index, 'number', e.target.value)}
                        placeholder="(405) 555-0000"
                        type="tel"
                      />
                      {phones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhone(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Fax Numbers */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Fax Numbers</label>
                    {faxes.length < 3 && (
                      <button
                        type="button"
                        onClick={addFax}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Fax
                      </button>
                    )}
                  </div>
                  {faxes.map((fax, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={fax.type}
                        onChange={e => updateFax(index, 'type', e.target.value)}
                        className="w-36 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      >
                        {CONTACT_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={fax.number}
                        onChange={e => updateFax(index, 'number', e.target.value)}
                        placeholder="(405) 555-0001"
                        type="tel"
                      />
                      {faxes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFax(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Email Addresses */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Email Addresses</label>
                    {emails.length < 2 && (
                      <button
                        type="button"
                        onClick={addEmail}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Add Email
                      </button>
                    )}
                  </div>
                  {emails.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <select
                        value={email.type}
                        onChange={e => updateEmail(index, 'type', e.target.value)}
                        className="w-36 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                      >
                        {CONTACT_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={email.address}
                        onChange={e => updateEmail(index, 'address', e.target.value)}
                        placeholder="claims@insurance.com"
                        type="email"
                      />
                      {emails.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEmail(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes - Collapsible */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowNotesSection(!showNotesSection)}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Notes</span>
              {showNotesSection ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
            {showNotesSection && (
              <div className="p-4 bg-white">
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add any notes about this insurance company..."
                  rows={4}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={disabled || saving}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 font-medium transition-colors"
          >
              {saving ? 'Saving...' : 'Save Insurance'}
          </button>
        </div>
      </div>
      </div>
    </Modal>
  );
}
