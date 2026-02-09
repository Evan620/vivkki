"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import { supabase } from "@/lib/supabaseClient";

interface InsuranceClaimModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    initialData?: any;
    type: 'first-party' | 'third-party';
    clientId?: number;
    defendantId?: number;
    casefileId?: number;
}

export default function InsuranceClaimModal({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    type,
    clientId,
    defendantId,
    casefileId
}: InsuranceClaimModalProps) {
    const [formData, setFormData] = useState({
        auto_insurance_id: '',
        policy_number: '',
        claim_number: '',
        // First party specific
        pip_available: '',
        pip_used: '',
        med_pay_available: '',
        med_pay_used: '',
        um_uim_coverage: '',
        property_damage: '',
        // Third party specific
        policy_limits: '',
        demand_amount: '',
        offer_amount: '',
        settlement_amount: '',
        liability_disputed: false,
        notes: ''
    });
    const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Load insurance companies
            loadInsuranceCompanies();
            
            if (initialData) {
                setFormData({
                    auto_insurance_id: initialData.auto_insurance_id?.toString() || '',
                    policy_number: initialData.policy_number || '',
                    claim_number: initialData.claim_number || '',
                    pip_available: initialData.pip_available?.toString() || '',
                    pip_used: initialData.pip_used?.toString() || '',
                    med_pay_available: initialData.med_pay_available?.toString() || '',
                    med_pay_used: initialData.med_pay_used?.toString() || '',
                    um_uim_coverage: initialData.um_uim_coverage || '',
                    property_damage: initialData.property_damage?.toString() || '',
                    policy_limits: initialData.policy_limits?.toString() || '',
                    demand_amount: initialData.demand_amount?.toString() || '',
                    offer_amount: initialData.offer_amount?.toString() || '',
                    settlement_amount: initialData.settlement_amount?.toString() || '',
                    liability_disputed: initialData.liability_disputed || false,
                    notes: initialData.notes || ''
                });
            } else {
                setFormData({
                    auto_insurance_id: '',
                    policy_number: '',
                    claim_number: '',
                    pip_available: '',
                    pip_used: '',
                    med_pay_available: '',
                    med_pay_used: '',
                    um_uim_coverage: '',
                    property_damage: '',
                    policy_limits: '',
                    demand_amount: '',
                    offer_amount: '',
                    settlement_amount: '',
                    liability_disputed: false,
                    notes: ''
                });
            }
            setError(null);
        }
    }, [isOpen, initialData]);

    const loadInsuranceCompanies = async () => {
        try {
            const { data, error } = await supabase
                .from('auto_insurance')
                .select('id, name')
                .order('name');
            
            if (error) throw error;
            setInsuranceCompanies(data || []);
        } catch (err) {
            console.error('Error loading insurance companies:', err);
        }
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.auto_insurance_id) {
            setError('Insurance company is required');
            return;
        }

        setSaving(true);
        try {
            const compiledData: any = {
                auto_insurance_id: parseInt(formData.auto_insurance_id),
                policy_number: formData.policy_number.trim() || null,
                claim_number: formData.claim_number.trim() || null,
            };

            if (type === 'first-party') {
                compiledData.client_id = clientId;
                compiledData.casefile_id = casefileId;
                compiledData.pip_available = formData.pip_available ? parseFloat(formData.pip_available) : null;
                compiledData.pip_used = formData.pip_used ? parseFloat(formData.pip_used) : null;
                compiledData.med_pay_available = formData.med_pay_available ? parseFloat(formData.med_pay_available) : null;
                compiledData.med_pay_used = formData.med_pay_used ? parseFloat(formData.med_pay_used) : null;
                compiledData.um_uim_coverage = formData.um_uim_coverage.trim() || null;
                compiledData.property_damage = formData.property_damage ? parseFloat(formData.property_damage) : null;
            } else {
                compiledData.defendant_id = defendantId;
                compiledData.policy_limits = formData.policy_limits ? parseFloat(formData.policy_limits) : null;
                compiledData.demand_amount = formData.demand_amount ? parseFloat(formData.demand_amount) : null;
                compiledData.offer_amount = formData.offer_amount ? parseFloat(formData.offer_amount) : null;
                compiledData.settlement_amount = formData.settlement_amount ? parseFloat(formData.settlement_amount) : null;
                compiledData.liability_disputed = formData.liability_disputed;
                compiledData.notes = formData.notes.trim() || null;
            }

            await onSubmit(compiledData);
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to save insurance claim');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card w-full max-w-3xl rounded-xl shadow-lg border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-foreground">
                        {initialData ? 'Edit' : 'Add'} {type === 'first-party' ? 'First Party' : 'Third Party'} Insurance Claim
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form id="insurance-form" onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                            
                            <FormSelect
                                label="Insurance Company"
                                name="auto_insurance_id"
                                value={formData.auto_insurance_id}
                                onChange={(val) => handleChange('auto_insurance_id', val)}
                                options={[
                                    { value: '', label: 'Select Insurance Company' },
                                    ...insuranceCompanies.map(ic => ({ value: ic.id.toString(), label: ic.name }))
                                ]}
                                required
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormInput
                                    label="Policy Number"
                                    name="policy_number"
                                    value={formData.policy_number}
                                    onChange={(val) => handleChange('policy_number', val)}
                                    placeholder="Policy #"
                                />
                                <FormInput
                                    label="Claim Number"
                                    name="claim_number"
                                    value={formData.claim_number}
                                    onChange={(val) => handleChange('claim_number', val)}
                                    placeholder="Claim #"
                                />
                            </div>
                        </div>

                        {/* First Party Specific Fields */}
                        {type === 'first-party' && (
                            <>
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-medium text-muted-foreground">PIP Coverage</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput
                                            label="PIP Available"
                                            name="pip_available"
                                            type="number"
                                            value={formData.pip_available}
                                            onChange={(val) => handleChange('pip_available', val)}
                                            placeholder="0.00"
                                        />
                                        <FormInput
                                            label="PIP Used"
                                            name="pip_used"
                                            type="number"
                                            value={formData.pip_used}
                                            onChange={(val) => handleChange('pip_used', val)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-medium text-muted-foreground">MedPay Coverage</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput
                                            label="MedPay Available"
                                            name="med_pay_available"
                                            type="number"
                                            value={formData.med_pay_available}
                                            onChange={(val) => handleChange('med_pay_available', val)}
                                            placeholder="0.00"
                                        />
                                        <FormInput
                                            label="MedPay Used"
                                            name="med_pay_used"
                                            type="number"
                                            value={formData.med_pay_used}
                                            onChange={(val) => handleChange('med_pay_used', val)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-medium text-muted-foreground">Other Coverage</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput
                                            label="UM/UIM Coverage"
                                            name="um_uim_coverage"
                                            value={formData.um_uim_coverage}
                                            onChange={(val) => handleChange('um_uim_coverage', val)}
                                            placeholder="Coverage details"
                                        />
                                        <FormInput
                                            label="Property Damage"
                                            name="property_damage"
                                            type="number"
                                            value={formData.property_damage}
                                            onChange={(val) => handleChange('property_damage', val)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Third Party Specific Fields */}
                        {type === 'third-party' && (
                            <>
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-medium text-muted-foreground">Liability Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput
                                            label="Policy Limits"
                                            name="policy_limits"
                                            type="number"
                                            value={formData.policy_limits}
                                            onChange={(val) => handleChange('policy_limits', val)}
                                            placeholder="0.00"
                                        />
                                        <div className="flex items-center gap-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="liability_disputed"
                                                checked={formData.liability_disputed}
                                                onChange={(e) => handleChange('liability_disputed', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <label htmlFor="liability_disputed" className="text-sm font-medium text-foreground">
                                                Liability Disputed
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-medium text-muted-foreground">Settlement Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormInput
                                            label="Demand Amount"
                                            name="demand_amount"
                                            type="number"
                                            value={formData.demand_amount}
                                            onChange={(val) => handleChange('demand_amount', val)}
                                            placeholder="0.00"
                                        />
                                        <FormInput
                                            label="Offer Amount"
                                            name="offer_amount"
                                            type="number"
                                            value={formData.offer_amount}
                                            onChange={(val) => handleChange('offer_amount', val)}
                                            placeholder="0.00"
                                        />
                                        <FormInput
                                            label="Settlement Amount"
                                            name="settlement_amount"
                                            type="number"
                                            value={formData.settlement_amount}
                                            onChange={(val) => handleChange('settlement_amount', val)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-border">
                                    <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        placeholder="Additional notes..."
                                        rows={4}
                                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white text-gray-900 border-gray-300"
                                    />
                                </div>
                            </>
                        )}
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
                        form="insurance-form"
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
