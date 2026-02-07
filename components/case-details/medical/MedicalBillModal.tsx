"use client";

import { useState, useEffect } from "react";
import { X, Save, DollarSign, Receipt } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface MedicalBillData {
    id?: number;
    client_id: number;
    medical_provider_id: number;
    date_of_service: string;
    total_billed: number;
    insurance_paid: number;
    insurance_adjusted: number;
    medpay_paid: number;
    patient_paid: number;
    reduction_amount: number;
    pi_expense: number;
    hipaa_sent: boolean;
    description?: string;
}

interface MedicalBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: MedicalBillData | null;
    clients: any[];
    casefileId: string;
    onUpdate: () => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function MedicalBillModal({
    isOpen,
    onClose,
    bill,
    clients,
    casefileId,
    onUpdate,
    onShowToast
}: MedicalBillModalProps) {
    const [loading, setLoading] = useState(false);
    const [providers, setProviders] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        client_id: 0,
        medical_provider_id: 0,
        date_of_service: "",
        total_billed: 0,
        insurance_paid: 0,
        insurance_adjusted: 0,
        medpay_paid: 0,
        patient_paid: 0,
        reduction_amount: 0,
        pi_expense: 0,
        hipaa_sent: false,
        description: ""
    });

    useEffect(() => {
        if (isOpen) {
            // Fetch medical providers
            supabase.from('medical_providers').select('*').order('name').then(({ data }) => {
                if (data) setProviders(data);
            });

            if (bill) {
                setFormData({
                    client_id: bill.client_id || 0,
                    medical_provider_id: bill.medical_provider_id || 0,
                    date_of_service: bill.date_of_service || "",
                    total_billed: bill.total_billed || 0,
                    insurance_paid: bill.insurance_paid || 0,
                    insurance_adjusted: bill.insurance_adjusted || 0,
                    medpay_paid: bill.medpay_paid || 0,
                    patient_paid: bill.patient_paid || 0,
                    reduction_amount: bill.reduction_amount || 0,
                    pi_expense: bill.pi_expense || 0,
                    hipaa_sent: bill.hipaa_sent || false,
                    description: bill.description || ""
                });
            } else {
                setFormData({
                    client_id: clients[0]?.id || 0,
                    medical_provider_id: 0,
                    date_of_service: new Date().toISOString().split('T')[0],
                    total_billed: 0,
                    insurance_paid: 0,
                    insurance_adjusted: 0,
                    medpay_paid: 0,
                    patient_paid: 0,
                    reduction_amount: 0,
                    pi_expense: 0,
                    hipaa_sent: false,
                    description: ""
                });
            }
        }
    }, [isOpen, bill, clients]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                client_id: formData.client_id,
                medical_provider_id: formData.medical_provider_id,
                date_of_service: formData.date_of_service || null,
                total_billed: formData.total_billed || 0,
                insurance_paid: formData.insurance_paid || 0,
                insurance_adjusted: formData.insurance_adjusted || 0,
                medpay_paid: formData.medpay_paid || 0,
                patient_paid: formData.patient_paid || 0,
                reduction_amount: formData.reduction_amount || 0,
                pi_expense: formData.pi_expense || 0,
                hipaa_sent: formData.hipaa_sent,
                description: formData.description || null
            };

            let error;
            if (bill?.id) {
                const { error: updateError } = await supabase
                    .from('medical_bills')
                    .update(payload)
                    .eq('id', bill.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('medical_bills')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            if (onShowToast) onShowToast(bill?.id ? 'Medical bill updated' : 'Medical bill added', 'success');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error saving bill:', error);
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
                        <Receipt className="w-6 h-6 text-green-600" />
                        {bill?.id ? 'Edit Medical Bill' : 'Add Medical Bill'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Client & Provider */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Client *</label>
                            <select
                                required
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.client_id}
                                onChange={e => setFormData({ ...formData, client_id: Number(e.target.value) })}
                            >
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.first_name} {client.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Provider *</label>
                            <select
                                required
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.medical_provider_id}
                                onChange={e => setFormData({ ...formData, medical_provider_id: Number(e.target.value) })}
                            >
                                <option value="">Select Provider</option>
                                {providers.map(provider => (
                                    <option key={provider.id} value={provider.id}>
                                        {provider.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date & HIPAA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Date of Service</label>
                            <input
                                type="date"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.date_of_service}
                                onChange={e => setFormData({ ...formData, date_of_service: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.hipaa_sent}
                                    onChange={e => setFormData({ ...formData, hipaa_sent: e.target.checked })}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-foreground">HIPAA Sent</span>
                            </label>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Service description..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Financial Amounts */}
                    <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-bold text-sm flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4" />
                            Financial Amounts
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Total Billed</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.total_billed}
                                    onChange={e => setFormData({ ...formData, total_billed: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Insurance Paid</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.insurance_paid}
                                    onChange={e => setFormData({ ...formData, insurance_paid: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Insurance Adjusted</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.insurance_adjusted}
                                    onChange={e => setFormData({ ...formData, insurance_adjusted: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Reduction</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.reduction_amount}
                                    onChange={e => setFormData({ ...formData, reduction_amount: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">MedPay Paid</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.medpay_paid}
                                    onChange={e => setFormData({ ...formData, medpay_paid: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Patient Paid</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.patient_paid}
                                    onChange={e => setFormData({ ...formData, patient_paid: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">PI Expense</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.pi_expense}
                                    onChange={e => setFormData({ ...formData, pi_expense: Number(e.target.value) })}
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
