"use client";

import { useState, useEffect } from "react";
import { X, Save, User, Phone, Mail, MapPin, Heart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Client } from "@/types";

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: Client | null;
    casefileId: string;
    onUpdate: () => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function AddClientModal({
    isOpen,
    onClose,
    client,
    casefileId,
    onUpdate,
    onShowToast
}: AddClientModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        date_of_birth: "",
        ssn: "",
        marital_status: "",
        is_driver: false,
        street_address: "",
        city: "",
        state: "",
        zip_code: "",
        primary_phone: "",
        secondary_phone: "",
        email: "",
        injury_description: "",
        prior_accidents: "",
        prior_injuries: "",
        work_impact: "",
        referrer: "",
        referrer_relationship: "",
        client_number: 1
    });

    useEffect(() => {
        if (isOpen) {
            if (client) {
                setFormData({
                    first_name: client.first_name || "",
                    middle_name: client.middle_name || "",
                    last_name: client.last_name || "",
                    date_of_birth: client.date_of_birth || "",
                    ssn: client.ssn || "",
                    marital_status: client.marital_status || "",
                    is_driver: client.is_driver || false,
                    street_address: client.street_address || client.address || "",
                    city: client.city || "",
                    state: client.state || "",
                    zip_code: client.zip_code || "",
                    primary_phone: client.primary_phone || "",
                    secondary_phone: client.secondary_phone || "",
                    email: client.email || "",
                    injury_description: client.injury_description || "",
                    prior_accidents: client.prior_accidents || "",
                    prior_injuries: client.prior_injuries || "",
                    work_impact: client.work_impact || "",
                    referrer: client.referrer || "",
                    referrer_relationship: client.referrer_relationship || "",
                    client_number: client.client_number || 1
                });
            } else {
                setFormData({
                    first_name: "",
                    middle_name: "",
                    last_name: "",
                    date_of_birth: "",
                    ssn: "",
                    marital_status: "",
                    is_driver: false,
                    street_address: "",
                    city: "",
                    state: "",
                    zip_code: "",
                    primary_phone: "",
                    secondary_phone: "",
                    email: "",
                    injury_description: "",
                    prior_accidents: "",
                    prior_injuries: "",
                    work_impact: "",
                    referrer: "",
                    referrer_relationship: "",
                    client_number: 1
                });
            }
        }
    }, [isOpen, client]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                casefile_id: casefileId,
                first_name: formData.first_name,
                middle_name: formData.middle_name || null,
                last_name: formData.last_name,
                date_of_birth: formData.date_of_birth || null,
                ssn: formData.ssn || null,
                marital_status: formData.marital_status || null,
                is_driver: formData.is_driver,
                street_address: formData.street_address || null,
                city: formData.city || null,
                state: formData.state || null,
                zip_code: formData.zip_code || null,
                primary_phone: formData.primary_phone || null,
                secondary_phone: formData.secondary_phone || null,
                email: formData.email || null,
                injury_description: formData.injury_description || null,
                prior_accidents: formData.prior_accidents || null,
                prior_injuries: formData.prior_injuries || null,
                work_impact: formData.work_impact || null,
                referrer: formData.referrer || null,
                referrer_relationship: formData.referrer_relationship || null,
                client_number: formData.client_number
            };

            let error;
            if (client) {
                const { error: updateError } = await supabase
                    .from('clients')
                    .update(payload)
                    .eq('id', client.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('clients')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            if (onShowToast) onShowToast(client ? 'Client updated' : 'Client added', 'success');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error saving client:', error);
            if (onShowToast) onShowToast(error.message || 'Failed to save', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <User className="w-6 h-6" />
                        {client ? 'Edit Client' : 'Add New Client'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
                            <User className="w-5 h-5 text-blue-600" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">First Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Middle Name</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.middle_name}
                                    onChange={e => setFormData({ ...formData, middle_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Last Name *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Date of Birth</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.date_of_birth}
                                    onChange={e => setFormData({ ...formData, date_of_birth: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">SSN</label>
                                <input
                                    type="text"
                                    placeholder="XXX-XX-XXXX"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.ssn}
                                    onChange={e => setFormData({ ...formData, ssn: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Marital Status</label>
                                <select
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.marital_status}
                                    onChange={e => setFormData({ ...formData, marital_status: e.target.value })}
                                >
                                    <option value="">Select...</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Divorced">Divorced</option>
                                    <option value="Widowed">Widowed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Client Number</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.client_number}
                                    onChange={e => setFormData({ ...formData, client_number: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_driver}
                                        onChange={e => setFormData({ ...formData, is_driver: e.target.checked })}
                                        className="rounded border-border text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-medium text-foreground">Is Driver</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
                            <Phone className="w-5 h-5 text-green-600" />
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-2">Street Address</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.street_address}
                                    onChange={e => setFormData({ ...formData, street_address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">City</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">State</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.state}
                                        onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">ZIP</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.zip_code}
                                        onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Primary Phone</label>
                                <input
                                    type="tel"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.primary_phone}
                                    onChange={e => setFormData({ ...formData, primary_phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Secondary Phone</label>
                                <input
                                    type="tel"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.secondary_phone}
                                    onChange={e => setFormData({ ...formData, secondary_phone: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                                <input
                                    type="email"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Medical Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
                            <Heart className="w-5 h-5 text-red-600" />
                            Medical Information
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Injury Description</label>
                            <textarea
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                                placeholder="Describe injuries sustained..."
                                value={formData.injury_description}
                                onChange={e => setFormData({ ...formData, injury_description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Prior Accidents</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.prior_accidents}
                                    onChange={e => setFormData({ ...formData, prior_accidents: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Prior Injuries</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.prior_injuries}
                                    onChange={e => setFormData({ ...formData, prior_injuries: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Work Impact</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.work_impact}
                                    onChange={e => setFormData({ ...formData, work_impact: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Referral Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
                            <MapPin className="w-5 h-5 text-orange-600" />
                            Referral Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Referred By</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.referrer}
                                    onChange={e => setFormData({ ...formData, referrer: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Relationship</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.referrer_relationship}
                                    onChange={e => setFormData({ ...formData, referrer_relationship: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : client ? 'Update Client' : 'Add Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
