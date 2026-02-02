"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import FormInput from "./FormInput";

interface AdjusterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    title?: string;
}

export default function AdjusterModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title
}: AdjusterModalProps) {
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
                    street_address: initialData.street_address || initialData.mailing_address || '',
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
            const compiledData = {
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

            await onSubmit(compiledData);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save adjuster');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card w-full max-w-2xl rounded-xl shadow-lg border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                        {title || (initialData ? 'Edit Adjuster' : 'Add Adjuster')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form id="adjuster-form" onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormInput
                                label="First Name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={(val) => handleChange('first_name', val)}
                                placeholder="First"
                            />
                            <FormInput
                                label="Middle Name"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={(val) => handleChange('middle_name', val)}
                                placeholder="Middle"
                            />
                            <FormInput
                                label="Last Name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={(val) => handleChange('last_name', val)}
                                placeholder="Last"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormInput
                                label="Email"
                                name="email"
                                value={formData.email}
                                onChange={(val) => handleChange('email', val)}
                                type="email"
                                placeholder="user@example.com"
                            />
                            <FormInput
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={(val) => handleChange('phone', val)}
                                placeholder="(555) 555-5555"
                            />
                            <FormInput
                                label="Fax"
                                name="fax"
                                value={formData.fax}
                                onChange={(val) => handleChange('fax', val)}
                                placeholder="(555) 555-5555"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border">
                            <h3 className="text-sm font-medium text-muted-foreground">Address Information</h3>
                            <FormInput
                                label="Street Address"
                                name="street_address"
                                value={formData.street_address}
                                onChange={(val) => handleChange('street_address', val)}
                                placeholder="123 Main St"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormInput
                                    label="City"
                                    name="city"
                                    value={formData.city}
                                    onChange={(val) => handleChange('city', val)}
                                    placeholder="City"
                                />
                                <FormInput
                                    label="State"
                                    name="state"
                                    value={formData.state}
                                    onChange={(val) => handleChange('state', val)}
                                    placeholder="State"
                                />
                                <FormInput
                                    label="Zip Code"
                                    name="zip_code"
                                    value={formData.zip_code}
                                    onChange={(val) => handleChange('zip_code', val)}
                                    placeholder="Zip"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 border border-border hover:bg-muted rounded-md text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="adjuster-form"
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors min-w-[100px] flex items-center justify-center"
                    >
                        {saving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Save
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
