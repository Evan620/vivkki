"use client";

import { useState, useEffect } from "react";
import { X, Save, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface SettlementData {
    id?: string | number;
    settlement_date?: string | null;
    gross_settlement: number;
    attorney_fee: number;
    attorney_fee_percentage: number;
    case_expenses: number;
    medical_liens: number;
    client_net: number;
    status: string;
    notes: string;
}

interface EditSettlementModalProps {
    isOpen: boolean;
    onClose: () => void;
    settlement: SettlementData | null;
    casefileId: string;
    onUpdate: () => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function EditSettlementModal({
    isOpen,
    onClose,
    settlement,
    casefileId,
    onUpdate,
    onShowToast
}: EditSettlementModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        settlement_date: "",
        gross_settlement: 0,
        attorney_fee_percentage: 33.33,
        case_expenses: 0,
        medical_liens: 0,
        status: "Pending",
        notes: ""
    });

    const [calculated, setCalculated] = useState({
        attorney_fee: 0,
        client_net: 0
    });

    useEffect(() => {
        if (isOpen && settlement) {
            setFormData({
                settlement_date: settlement.settlement_date || "",
                gross_settlement: settlement.gross_settlement || 0,
                attorney_fee_percentage: settlement.attorney_fee_percentage || 33.33,
                case_expenses: settlement.case_expenses || 0,
                medical_liens: settlement.medical_liens || 0,
                status: settlement.status || "Pending",
                notes: settlement.notes || ""
            });
        } else if (isOpen) {
            // Reset for new settlement
            setFormData({
                settlement_date: new Date().toISOString().split('T')[0],
                gross_settlement: 0,
                attorney_fee_percentage: 33.33,
                case_expenses: 0,
                medical_liens: 0,
                status: "Pending",
                notes: ""
            });
        }
    }, [isOpen, settlement]);

    useEffect(() => {
        // Calculate attorney fee and client net
        const attorneyFee = (formData.gross_settlement * formData.attorney_fee_percentage) / 100;
        const clientNet = formData.gross_settlement - attorneyFee - formData.case_expenses - formData.medical_liens;
        setCalculated({
            attorney_fee: attorneyFee,
            client_net: Math.max(0, clientNet)
        });
    }, [formData.gross_settlement, formData.attorney_fee_percentage, formData.case_expenses, formData.medical_liens]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                casefile_id: casefileId,
                settlement_date: formData.settlement_date || null,
                gross_settlement: formData.gross_settlement || 0,
                attorney_fee: calculated.attorney_fee,
                attorney_fee_percentage: formData.attorney_fee_percentage,
                case_expenses: formData.case_expenses || 0,
                medical_liens: formData.medical_liens || 0,
                client_net: calculated.client_net,
                status: formData.status,
                notes: formData.notes || null
            };

            let error;
            if (settlement?.id) {
                // Update existing settlement
                const { error: updateError } = await supabase
                    .from('settlements')
                    .update(payload)
                    .eq('id', settlement.id);
                error = updateError;
            } else {
                // Insert new settlement
                const { error: insertError } = await supabase
                    .from('settlements')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            if (onShowToast) onShowToast('Settlement saved', 'success');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error saving settlement:', error);
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
                        <DollarSign className="w-6 h-6 text-green-600" />
                        {settlement?.id ? 'Edit Settlement' : 'Add Settlement'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Settlement Amounts */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Settlement Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Settlement Date</label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.settlement_date}
                                    onChange={e => setFormData({ ...formData, settlement_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                                <select
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Negotiating">Negotiating</option>
                                    <option value="Accepted">Accepted</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Gross Settlement</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full rounded-md border border-border bg-background pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.gross_settlement}
                                        onChange={e => setFormData({ ...formData, gross_settlement: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Attorney Fee (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.attorney_fee_percentage}
                                    onChange={e => setFormData({ ...formData, attorney_fee_percentage: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Case Expenses</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full rounded-md border border-border bg-background pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.case_expenses}
                                        onChange={e => setFormData({ ...formData, case_expenses: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Medical Liens</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full rounded-md border border-border bg-background pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={formData.medical_liens}
                                        onChange={e => setFormData({ ...formData, medical_liens: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calculated Summary */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Attorney Fee:</span>
                            <span className="font-medium">${calculated.attorney_fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span className="text-green-600">Client Net:</span>
                            <span className="text-green-600">${calculated.client_net.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                        <textarea
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                            placeholder="Additional notes..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
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
                            {loading ? 'Saving...' : 'Save Settlement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
