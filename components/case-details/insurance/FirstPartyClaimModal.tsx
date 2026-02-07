"use client";

import { useState, useEffect } from "react";
import { X, Save, Shield, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { FirstPartyClaim } from "@/types";

interface FirstPartyClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
    claim: FirstPartyClaim | null;
    clientId: number;
    casefileId: string;
    onUpdate: () => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function FirstPartyClaimModal({
    isOpen,
    onClose,
    claim,
    clientId,
    casefileId,
    onUpdate,
    onShowToast
}: FirstPartyClaimModalProps) {
    const [loading, setLoading] = useState(false);
    const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        auto_insurance_id: "",
        policy_number: "",
        claim_number: "",
        pip_available: 0,
        pip_used: 0,
        med_pay_available: 0,
        med_pay_used: 0
    });

    useEffect(() => {
        if (isOpen) {
            // Fetch insurance companies
            supabase.from('auto_insurance').select('*').order('name').then(({ data }) => {
                if (data) setInsuranceCompanies(data);
            });

            if (claim) {
                setFormData({
                    auto_insurance_id: claim.auto_insurance_id || "",
                    policy_number: claim.policy_number || "",
                    claim_number: claim.claim_number || "",
                    pip_available: claim.pip_available || 0,
                    pip_used: claim.pip_used || 0,
                    med_pay_available: claim.med_pay_available || 0,
                    med_pay_used: claim.med_pay_used || 0
                });
            } else {
                setFormData({
                    auto_insurance_id: "",
                    policy_number: "",
                    claim_number: "",
                    pip_available: 5000,
                    pip_used: 0,
                    med_pay_available: 5000,
                    med_pay_used: 0
                });
            }
        }
    }, [isOpen, claim]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                client_id: clientId,
                auto_insurance_id: formData.auto_insurance_id || null,
                policy_number: formData.policy_number || null,
                claim_number: formData.claim_number || null,
                pip_available: formData.pip_available || 0,
                pip_used: formData.pip_used || 0,
                med_pay_available: formData.med_pay_available || 0,
                med_pay_used: formData.med_pay_used || 0
            };

            let error;
            if (claim?.id) {
                const { error: updateError } = await supabase
                    .from('first_party_claims')
                    .update(payload)
                    .eq('id', claim.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('first_party_claims')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            if (onShowToast) onShowToast(claim?.id ? 'Insurance updated' : 'Insurance added', 'success');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error saving claim:', error);
            if (onShowToast) onShowToast(error.message || 'Failed to save', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        {claim?.id ? 'Edit First Party Insurance' : 'Add First Party Insurance'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Insurance Company */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Insurance Company</label>
                        <select
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            value={formData.auto_insurance_id}
                            onChange={e => setFormData({ ...formData, auto_insurance_id: e.target.value })}
                        >
                            <option value="">Select Insurance Company</option>
                            {insuranceCompanies.map(company => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Policy & Claim Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Policy Number</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.policy_number}
                                onChange={e => setFormData({ ...formData, policy_number: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Claim Number</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.claim_number}
                                onChange={e => setFormData({ ...formData, claim_number: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* PIP Coverage */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg p-4">
                        <h4 className="font-bold text-sm flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                            PIP Coverage
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Available</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.pip_available}
                                    onChange={e => setFormData({ ...formData, pip_available: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Used</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.pip_used}
                                    onChange={e => setFormData({ ...formData, pip_used: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* MedPay Coverage */}
                    <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900 rounded-lg p-4">
                        <h4 className="font-bold text-sm flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-purple-600" />
                            MedPay Coverage
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Available</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.med_pay_available}
                                    onChange={e => setFormData({ ...formData, med_pay_available: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Used</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.med_pay_used}
                                    onChange={e => setFormData({ ...formData, med_pay_used: Number(e.target.value) })}
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
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
