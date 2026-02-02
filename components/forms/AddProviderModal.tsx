import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface AddProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, type: string, city: string, savePermanently: boolean, additionalData?: {
        streetAddress?: string;
        streetAddress2?: string;
        state?: string;
        zipCode?: string;
        phones?: Array<{ type: string; number: string }>;
        faxes?: Array<{ type: string; number: string }>;
        emails?: Array<{ type: string; address: string }>;
        notes?: string;
    }) => void;
}

const PROVIDER_TYPES = [
    'Hospital',
    'Clinic',
    'ER',
    'Urgent Care',
    'Primary Care',
    'Specialist',
    'Physical Therapy',
    'Chiropractic',
    'Imaging',
    'Laboratory',
    'Other'
];

const CONTACT_TYPES = ['Main', 'Medical Records', 'Billing', 'Other'];

export default function AddProviderModal({
    isOpen,
    onClose,
    onSave
}: AddProviderModalProps) {
    // Provider Information
    const [name, setName] = useState('');
    const [type, setType] = useState('Other');

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

    // Save permanently checkbox
    const [savePermanently, setSavePermanently] = useState(true);

    // UI State
    const [showAddressSection, setShowAddressSection] = useState(false);
    const [showContactSection, setShowContactSection] = useState(false);
    const [showNotesSection, setShowNotesSection] = useState(false);

    const isValid = name.trim().length > 0 && type.trim().length > 0;

    // Reset form when modal opens
    const resetForm = () => {
        setName('');
        setType('Other');
        setStreetAddress('');
        setStreetAddress2('');
        setCity('');
        setState('OK');
        setZipCode('');
        setPhones([{ type: 'Main', number: '' }]);
        setFaxes([{ type: 'Main', number: '' }]);
        setEmails([{ type: 'Main', address: '' }]);
        setNotes('');
        setSavePermanently(true);
        setShowAddressSection(false);
        setShowContactSection(false);
        setShowNotesSection(false);
    };

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleSubmit = () => {
        if (!isValid) {
            return;
        }
        onSave(name.trim(), type || 'Other', city.trim() || '', savePermanently, {
            streetAddress: streetAddress.trim() || undefined,
            streetAddress2: streetAddress2.trim() || undefined,
            state: state.trim() || 'OK',
            zipCode: zipCode.trim() || undefined,
            phones: phones.filter(p => p.number.trim()),
            faxes: faxes.filter(f => f.number.trim()),
            emails: emails.filter(e => e.address.trim()),
            notes: notes.trim() || undefined
        });
        resetForm();
        onClose();
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };

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
        <Modal isOpen={isOpen} onClose={handleCancel} title="Add Medical Provider" maxWidth="lg">
            <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                    {/* Provider Information */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Provider Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Provider Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                    placeholder="Enter provider name"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Provider Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {PROVIDER_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
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
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={streetAddress}
                                        onChange={e => setStreetAddress(e.target.value)}
                                        placeholder="123 Main St"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address 2</label>
                                    <input
                                        type="text"
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
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            placeholder="Oklahoma City"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={state}
                                            onChange={e => setState(e.target.value)}
                                            placeholder="OK"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                                        <input
                                            type="text"
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
                                                className="w-32 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                            >
                                                {CONTACT_TYPES.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="tel"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                value={phone.number}
                                                onChange={e => updatePhone(index, 'number', e.target.value)}
                                                placeholder="(405) 555-0000"
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
                                                className="w-32 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                            >
                                                {CONTACT_TYPES.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="tel"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                value={fax.number}
                                                onChange={e => updateFax(index, 'number', e.target.value)}
                                                placeholder="(405) 555-0001"
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
                                                className="w-32 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                                            >
                                                {CONTACT_TYPES.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="email"
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                                value={email.address}
                                                onChange={e => updateEmail(index, 'address', e.target.value)}
                                                placeholder="records@provider.com"
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
                                    placeholder="Add any notes about this provider..."
                                    rows={4}
                                />
                            </div>
                        )}
                    </div>

                    {/* Save Permanently Checkbox */}
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <input
                            type="checkbox"
                            id="savePermanently"
                            checked={savePermanently}
                            onChange={(e) => setSavePermanently(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="savePermanently" className="text-sm text-gray-700 cursor-pointer">
                            Save permanently to database
                        </label>
                    </div>

                    {!savePermanently && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-xs text-orange-800">
                                <strong>Note:</strong> This will be added temporarily for this intake only. It will be saved to the database when you submit the form.
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!isValid}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 font-medium transition-colors"
                        >
                            Add Provider
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
