"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import FormInput from '@/components/forms/FormInput';
import FormSelect from '@/components/forms/FormSelect';
import FormTextArea from '@/components/forms/FormTextArea';
import { MedicalProvider } from '@/types';

interface MedicalProviderDetailsProps {
    initialProvider: any; // Using any for now to match flexible legacy structure, ideally strictly typed
}

export default function MedicalProviderDetails({ initialProvider }: MedicalProviderDetailsProps) {
    const router = useRouter();
    const [provider, setProvider] = useState(initialProvider);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: provider.name || '',
        hipaa_method: provider.request_method || provider.hipaa_method || 'Email',
        street_address: provider.street_address || '',
        street_address_2: provider.street_address_2 || '',
        city: provider.city || '',
        state: provider.state || 'OK',
        zip_code: provider.zip_code || '',
        phone_1_type: provider.phone_1_type || '',
        phone_1: provider.phone_1 || provider.phone || '',
        phone_2_type: provider.phone_2_type || '',
        phone_2: provider.phone_2 || '',
        phone_3_type: provider.phone_3_type || '',
        phone_3: provider.phone_3 || '',
        fax_1_type: provider.fax_1_type || '',
        fax_1: provider.fax_1 || provider.fax || '',
        fax_2_type: provider.fax_2_type || '',
        fax_2: provider.fax_2 || '',
        fax_3_type: provider.fax_3_type || '',
        fax_3: provider.fax_3 || '',
        email_1_type: provider.email_1_type || '',
        email_1: provider.email_1 || provider.email || '',
        email_2_type: provider.email_2_type || '',
        email_2: provider.email_2 || '',
        notes: provider.notes || ''
    });

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Provider name is required');
            return;
        }

        setSaving(true);
        try {
            const updateData: any = {
                name: formData.name.trim(),
                request_method: formData.hipaa_method,
                street_address: formData.street_address?.trim() || null,
                street_address_2: formData.street_address_2?.trim() || null,
                city: formData.city?.trim() || null,
                state: formData.state?.trim() || null,
                zip_code: formData.zip_code?.trim() || null,
                phone_1_type: formData.phone_1_type?.trim() || null,
                phone_1: formData.phone_1?.trim() || null,
                phone_2_type: formData.phone_2_type?.trim() || null,
                phone_2: formData.phone_2?.trim() || null,
                phone_3_type: formData.phone_3_type?.trim() || null,
                phone_3: formData.phone_3?.trim() || null,
                fax_1_type: formData.fax_1_type?.trim() || null,
                fax_1: formData.fax_1?.trim() || null,
                fax_2_type: formData.fax_2_type?.trim() || null,
                fax_2: formData.fax_2?.trim() || null,
                fax_3_type: formData.fax_3_type?.trim() || null,
                fax_3: formData.fax_3?.trim() || null,
                email_1_type: formData.email_1_type?.trim() || null,
                email_1: formData.email_1?.trim() || null,
                email_2_type: formData.email_2_type?.trim() || null,
                email_2: formData.email_2?.trim() || null,
                notes: formData.notes?.trim() || null
            };

            // Legacy backward compatibility updates
            if (formData.phone_1?.trim()) updateData.phone = formData.phone_1.trim();
            if (formData.fax_1?.trim()) updateData.fax = formData.fax_1.trim();
            if (formData.email_1?.trim()) updateData.email = formData.email_1.trim();

            const { data, error } = await supabase
                .from('medical_providers')
                .update(updateData)
                .eq('id', provider.id)
                .select()
                .single();

            if (error) throw error;

            setProvider(data);
            setIsEditing(false);
            router.refresh();
        } catch (error: any) {
            console.error('Error updating medical provider:', error);
            alert(`Failed to update medical provider: ${error.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: provider.name || '',
            hipaa_method: provider.request_method || provider.hipaa_method || 'Email',
            street_address: provider.street_address || '',
            street_address_2: provider.street_address_2 || '',
            city: provider.city || '',
            state: provider.state || 'OK',
            zip_code: provider.zip_code || '',
            phone_1_type: provider.phone_1_type || '',
            phone_1: provider.phone_1 || provider.phone || '',
            phone_2_type: provider.phone_2_type || '',
            phone_2: provider.phone_2 || '',
            phone_3_type: provider.phone_3_type || '',
            phone_3: provider.phone_3 || '',
            fax_1_type: provider.fax_1_type || '',
            fax_1: provider.fax_1 || provider.fax || '',
            fax_2_type: provider.fax_2_type || '',
            fax_2: provider.fax_2 || '',
            fax_3_type: provider.fax_3_type || '',
            fax_3: provider.fax_3 || '',
            email_1_type: provider.email_1_type || '',
            email_1: provider.email_1 || provider.email || '',
            email_2_type: provider.email_2_type || '',
            email_2: provider.email_2 || '',
            notes: provider.notes || ''
        });
        setIsEditing(false);
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const typeOptions = [
        { value: '', label: 'Select...' },
        { value: 'General', label: 'General' },
        { value: 'Billing', label: 'Billing' },
        { value: 'Records', label: 'Records' },
    ];

    const hipaaOptions = [
        { value: 'Email', label: 'Email' },
        { value: 'Fax', label: 'Fax' },
        { value: 'Chartswap', label: 'Chartswap' },
        { value: 'Chartfast', label: 'Chartfast' },
    ];

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {provider.name || 'Medical Provider'}
                    </h1>
                    <p className="text-muted-foreground mt-1">View and edit medical provider details</p>
                </div>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => router.push('/providers')}
                                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Provider Information */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Provider Information</h3>
                </div>
                <div className="p-6">
                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput
                                label="Provider Name"
                                name="name"
                                value={formData.name}
                                onChange={(value) => handleChange('name', value)}
                                required
                            />
                            <FormSelect
                                label="Request Method (HIPAA)"
                                name="hipaa_method"
                                value={formData.hipaa_method}
                                onChange={(value) => handleChange('hipaa_method', value)}
                                options={hipaaOptions}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Provider Name</label>
                                <p className="text-foreground font-medium text-lg">{provider.name || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Request Method (HIPAA)</label>
                                <p className="text-foreground font-medium">{provider.request_method || provider.hipaa_method || 'N/A'}</p>
                            </div>
                            {provider.type && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Provider Type</label>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                        {provider.type}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Address Information */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Address Information</h3>
                </div>
                <div className="p-6">
                    {isEditing ? (
                        <div className="space-y-4">
                            <FormInput
                                label="Street Address"
                                name="street_address"
                                value={formData.street_address}
                                onChange={(value) => handleChange('street_address', value)}
                            />
                            <FormInput
                                label="Street Address 2"
                                name="street_address_2"
                                value={formData.street_address_2}
                                onChange={(value) => handleChange('street_address_2', value)}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInput
                                    label="City"
                                    name="city"
                                    value={formData.city}
                                    onChange={(value) => handleChange('city', value)}
                                />
                                <FormInput
                                    label="State"
                                    name="state"
                                    value={formData.state}
                                    onChange={(value) => handleChange('state', value)}
                                />
                                <FormInput
                                    label="Zip Code"
                                    name="zip_code"
                                    value={formData.zip_code}
                                    onChange={(value) => handleChange('zip_code', value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(provider.street_address || provider.street_address_2) && (
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Address</label>
                                    <div className="text-foreground">
                                        {provider.street_address && <p>{provider.street_address}</p>}
                                        {provider.street_address_2 && <p>{provider.street_address_2}</p>}
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">City</label>
                                    <p className="text-foreground">{provider.city || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">State</label>
                                    <p className="text-foreground">{provider.state || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Zip Code</label>
                                    <p className="text-foreground">{provider.zip_code || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Phone Numbers */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Phone Numbers</h3>
                </div>
                <div className="p-6">
                    {isEditing ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(num => (
                                <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormSelect
                                        label={`Phone ${num} Type`}
                                        name={`phone_${num}_type`}
                                        value={formData[`phone_${num}_type` as keyof typeof formData]}
                                        onChange={(value) => handleChange(`phone_${num}_type`, value)}
                                        options={typeOptions}
                                    />
                                    <FormInput
                                        label={`Phone ${num} Number`}
                                        name={`phone_${num}`}
                                        value={formData[`phone_${num}` as keyof typeof formData]}
                                        onChange={(value) => handleChange(`phone_${num}`, value)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[1, 2, 3].map(num => {
                                const phone = provider[`phone_${num}`] || (num === 1 ? provider.phone : '');
                                const type = provider[`phone_${num}_type`];
                                if (!phone) return null;
                                return (
                                    <div key={num}>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                                            Phone {num} {type && <span className="font-normal">({type})</span>}
                                        </label>
                                        <p className="text-foreground font-medium">{phone}</p>
                                    </div>
                                );
                            })}
                            {!provider.phone && !provider.phone_1 && !provider.phone_2 && !provider.phone_3 && (
                                <p className="text-muted-foreground italic">No phone numbers available</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Fax Numbers */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Fax Numbers</h3>
                </div>
                <div className="p-6">
                    {isEditing ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(num => (
                                <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormSelect
                                        label={`Fax ${num} Type`}
                                        name={`fax_${num}_type`}
                                        value={formData[`fax_${num}_type` as keyof typeof formData]}
                                        onChange={(value) => handleChange(`fax_${num}_type`, value)}
                                        options={typeOptions}
                                    />
                                    <FormInput
                                        label={`Fax ${num} Number`}
                                        name={`fax_${num}`}
                                        value={formData[`fax_${num}` as keyof typeof formData]}
                                        onChange={(value) => handleChange(`fax_${num}`, value)}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[1, 2, 3].map(num => {
                                const fax = provider[`fax_${num}`] || (num === 1 ? provider.fax : '');
                                const type = provider[`fax_${num}_type`];
                                if (!fax) return null;
                                return (
                                    <div key={num}>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                                            Fax {num} {type && <span className="font-normal">({type})</span>}
                                        </label>
                                        <p className="text-foreground font-medium">{fax}</p>
                                    </div>
                                );
                            })}
                            {!provider.fax && !provider.fax_1 && !provider.fax_2 && !provider.fax_3 && (
                                <p className="text-muted-foreground italic">No fax numbers available</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Emails */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Email Addresses</h3>
                </div>
                <div className="p-6">
                    {isEditing ? (
                        <div className="space-y-4">
                            {[1, 2].map(num => (
                                <div key={num} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormSelect
                                        label={`Email ${num} Type`}
                                        name={`email_${num}_type`}
                                        value={formData[`email_${num}_type` as keyof typeof formData]}
                                        onChange={(value) => handleChange(`email_${num}_type`, value)}
                                        options={typeOptions}
                                    />
                                    <FormInput
                                        label={`Email ${num} Address`}
                                        name={`email_${num}`}
                                        value={formData[`email_${num}` as keyof typeof formData]}
                                        onChange={(value) => handleChange(`email_${num}`, value)}
                                        type="email"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[1, 2].map(num => {
                                const email = provider[`email_${num}`] || (num === 1 ? provider.email : '');
                                const type = provider[`email_${num}_type`];
                                if (!email) return null;
                                return (
                                    <div key={num}>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                                            Email {num} {type && <span className="font-normal">({type})</span>}
                                        </label>
                                        <p className="text-foreground font-medium">{email}</p>
                                    </div>
                                );
                            })}
                            {!provider.email && !provider.email_1 && !provider.email_2 && (
                                <p className="text-muted-foreground italic">No email addresses available</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Notes */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">Notes</h3>
                </div>
                <div className="p-6">
                    {isEditing ? (
                        <FormTextArea
                            label="Provider Notes"
                            name="notes"
                            value={formData.notes}
                            onChange={(value) => handleChange('notes', value)}
                            rows={4}
                        />
                    ) : (
                        <div>
                            {provider.notes ? (
                                <p className="text-foreground whitespace-pre-wrap">{provider.notes}</p>
                            ) : (
                                <p className="text-muted-foreground italic">No notes available</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
