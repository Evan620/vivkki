"use client";

import { useState, useEffect } from "react";
import { X, Save, Scale, User, FileText, Shield } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface EditDefendantModalProps {
    isOpen: boolean;
    onClose: () => void;
    defendant: any | null; // using any for now to match the complex mapped type but ideally strict
    casefileId: string;
    onUpdate: () => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function EditDefendantModal({
    isOpen,
    onClose,
    defendant,
    casefileId,
    onUpdate,
    onShowToast
}: EditDefendantModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        liability_percentage: 100,
        is_policyholder: false,
        policyholder_first_name: "",
        policyholder_last_name: "",
        relationship_type: "",
        email: "",
        phone_number: "",
        auto_insurance_id: "",
        policy_number: "",
        claim_number: "",
        notes: ""
    });

    const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Fetch insurance companies
            supabase.from('insurance_companies').select('*').order('name').then(({ data }) => {
                if (data) setInsuranceCompanies(data);
            });

            if (defendant) {
                setFormData({
                    first_name: defendant.first_name || "",
                    last_name: defendant.last_name || "",
                    liability_percentage: defendant.liability_percentage ?? 100,
                    is_policyholder: defendant.is_policyholder ?? false,
                    policyholder_first_name: defendant.policyholder_first_name || "",
                    policyholder_last_name: defendant.policyholder_last_name || "",
                    relationship_type: defendant.relationship_type || "",
                    email: defendant.email || "",
                    phone_number: defendant.phone_number || "",
                    auto_insurance_id: defendant.auto_insurance_id || "",
                    policy_number: defendant.policy_number || "",
                    claim_number: defendant.claim_number || "",
                    notes: defendant.notes || ""
                });
            } else {
                setFormData({
                    first_name: "",
                    last_name: "",
                    liability_percentage: 100,
                    is_policyholder: false,
                    policyholder_first_name: "",
                    policyholder_last_name: "",
                    relationship_type: "",
                    email: "",
                    phone_number: "",
                    auto_insurance_id: "",
                    policy_number: "",
                    claim_number: "",
                    notes: ""
                });
            }
        }
    }, [isOpen, defendant]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                casefile_id: casefileId,
                first_name: formData.first_name,
                last_name: formData.last_name,
                liability_percentage: formData.liability_percentage,
                is_policyholder: formData.is_policyholder,
                policyholder_first_name: formData.is_policyholder ? formData.first_name : formData.policyholder_first_name,
                policyholder_last_name: formData.is_policyholder ? formData.last_name : formData.policyholder_last_name,
                relationship_type: formData.relationship_type,
                email: formData.email,
                phone_number: formData.phone_number,
                auto_insurance_id: formData.auto_insurance_id || null,
                policy_number: formData.policy_number,
                claim_number: formData.claim_number,
                notes: formData.notes
            };

            let error;
            if (defendant) {
                const { error: updateError } = await supabase
                    .from('defendants')
                    .update(payload)
                    .eq('id', defendant.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('defendants')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            if (onShowToast) onShowToast(defendant ? 'Defendant updated' : 'Defendant added', 'success');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error saving defendant:', error);
            if (onShowToast) onShowToast(error.message || 'Failed to save', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {defendant ? 'Edit Defendant' : 'Add New Defendant'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">First Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    value={formData.first_name}
                                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    value={formData.last_name}
                                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone</label>
                                <input
                                    type="tel"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                                    value={formData.phone_number}
                                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Liability */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Scale className="w-5 h-5 text-orange-600" />
                            Liability
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Liability Percentage (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 border p-2"
                                    value={formData.liability_percentage}
                                    onChange={e => setFormData({ ...formData, liability_percentage: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Policyholder Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-600" />
                            Policyholder Information
                        </h3>
                        <div className="flex items-center gap-2 mb-4">
                            <input
                                type="checkbox"
                                id="is_policyholder"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={formData.is_policyholder}
                                onChange={e => setFormData({ ...formData, is_policyholder: e.target.checked })}
                            />
                            <label htmlFor="is_policyholder" className="text-sm font-medium text-gray-700">
                                Defendant is the Policyholder
                            </label>
                        </div>

                        {!formData.is_policyholder && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Policyholder First Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 bg-white"
                                        value={formData.policyholder_first_name}
                                        onChange={e => setFormData({ ...formData, policyholder_first_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Policyholder Last Name</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 bg-white"
                                        value={formData.policyholder_last_name}
                                        onChange={e => setFormData({ ...formData, policyholder_last_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Relationship to Defendant</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2 bg-white"
                                        value={formData.relationship_type}
                                        onChange={e => setFormData({ ...formData, relationship_type: e.target.value })}
                                    >
                                        <option value="">Select Relationship</option>
                                        <option value="Spouse">Spouse</option>
                                        <option value="Parent">Parent</option>
                                        <option value="Child">Child</option>
                                        <option value="Sibling">Sibling</option>
                                        <option value="Employer">Employer</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Insurance Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            Insurance Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Insurance Company</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                                    value={formData.policy_number}
                                    onChange={e => setFormData({ ...formData, policy_number: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Claim Number</label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                                    value={formData.claim_number}
                                    onChange={e => setFormData({ ...formData, claim_number: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Defendant'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
