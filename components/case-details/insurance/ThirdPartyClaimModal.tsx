"use client";

import { useState, useEffect } from "react";
import { X, Save, Scale, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { ThirdPartyClaim } from "@/types";

interface ThirdPartyClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
    claim: ThirdPartyClaim | null;
    defendantId: number;
    casefileId: string;
    onUpdate: () => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function ThirdPartyClaimModal({
    isOpen,
    onClose,
    claim,
    defendantId,
    casefileId,
    onUpdate,
    onShowToast
}: ThirdPartyClaimModalProps) {
    const [loading, setLoading] = useState(false);
    const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        auto_insurance_id: "",
        policy_number: "",
        claim_number: "",
        policy_limits: 0,
        demand_amount: 0,
        offer_amount: 0,
        lor_sent: false,
        loa_received: false,
        last_request_date: ""
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
                    policy_limits: claim.policy_limits || 0,
                    demand_amount: claim.demand_amount || 0,
                    offer_amount: claim.offer_amount || 0,
                    lor_sent: claim.lor_sent || false,
                    loa_received: claim.loa_received || false,
                    last_request_date: claim.last_request_date || ""
                });
            } else {
                setFormData({
                    auto_insurance_id: "",
                    policy_number: "",
                    claim_number: "",
                    policy_limits: 0,
                    demand_amount: 0,
                    offer_amount: 0,
                    lor_sent: false,
                    loa_received: false,
                    last_request_date: ""
                });
            }
        }
    }, [isOpen, claim]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                defendant_id: defendantId,
                auto_insurance_id: formData.auto_insurance_id || null,
                policy_number: formData.policy_number || null,
                claim_number: formData.claim_number || null,
                policy_limits: formData.policy_limits || 0,
                demand_amount: formData.demand_amount || 0,
                offer_amount: formData.offer_amount || 0,
                lor_sent: formData.lor_sent,
                loa_received: formData.loa_received,
                last_request_date: formData.last_request_date || null
            };

            let error;
            if (claim?.id) {
                const { error: updateError } = await supabase
                    .from('third_party_claims')
                    .update(payload)
                    .eq('id', claim.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('third_party_claims')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            if (onShowToast) onShowToast(claim?.id ? 'Liability claim updated' : 'Liability claim added', 'success');
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
                        <Scale className="w-6 h-6 text-red-600" />
                        {claim?.id ? 'Edit Liability Claim' : 'Add Liability Claim'}
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

                    {/* Settlement Amounts */}
                    <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded-lg p-4">
                        <h4 className="font-bold text-sm flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4 text-red-600" />
                            Settlement Amounts
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Policy Limits</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.policy_limits}
                                    onChange={e => setFormData({ ...formData, policy_limits: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Demand</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.demand_amount}
                                    onChange={e => setFormData({ ...formData, demand_amount: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Offer</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.offer_amount}
                                    onChange={e => setFormData({ ...formData, offer_amount: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* LOR/LOA Tracking */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-bold text-sm mb-4">Document Tracking</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.lor_sent}
                                    onChange={e => setFormData({ ...formData, lor_sent: e.target.checked })}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-foreground">LOR Sent</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.loa_received}
                                    onChange={e => setFormData({ ...formData, loa_received: e.target.checked })}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-foreground">LOA Received</span>
                            </label>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-foreground mb-2">Last Request Date</label>
                            <input
                                type="date"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.last_request_date}
                                onChange={e => setFormData({ ...formData, last_request_date: e.target.value })}
                            />
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
