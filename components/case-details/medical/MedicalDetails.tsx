"use client";

import { useMemo, useState } from "react";
import { DollarSign, Filter, Heart, FileText, Plus, Shield, Receipt, CreditCard, AlertTriangle } from "lucide-react";
import { calculateMedicalBillBalanceDue, formatCurrency } from "@/lib/calculations";
import type { MedicalBill, Client, HealthClaim } from "@/types";
import { cn } from "@/lib/utils";
import { MedicalBillModal } from "./MedicalBillModal";

interface MedicalDetailsProps {
    medicalBills: MedicalBill[];
    clients: Client[];
    healthClaim?: HealthClaim | null;
    casefileId: number;
    onUpdate?: () => void;
}

export function MedicalDetails({
    medicalBills = [],
    clients = [],
    healthClaim,
    casefileId,
    onUpdate
}: MedicalDetailsProps) {
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<MedicalBill | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleShowToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpdate = () => {
        if (onUpdate) onUpdate();
    };

    const handleAddBill = () => {
        setIsAddModalOpen(true);
    };

    const handleEditBill = (bill: MedicalBill) => {
        setEditingBill(bill);
    };

    // Filter bills by selected client
    const filteredBills = useMemo(() => {
        if (!selectedClientId) return medicalBills;
        return medicalBills.filter(bill => bill.client_id === selectedClientId);
    }, [medicalBills, selectedClientId]);

    // Calculate financial totals
    const financialTotals = useMemo(() => {
        return filteredBills.reduce(
            (totals, bill) => {
                const balanceDue = calculateMedicalBillBalanceDue(bill);
                return {
                    totalBilled: totals.totalBilled + (bill.total_billed || 0),
                    insurancePaid: totals.insurancePaid + (bill.insurance_paid || 0),
                    insuranceAdjusted: totals.insuranceAdjusted + (bill.insurance_adjusted || 0),
                    medpayPaid: totals.medpayPaid + (bill.medpay_paid || 0),
                    patientPaid: totals.patientPaid + (bill.patient_paid || 0),
                    reductionAmount: totals.reductionAmount + (bill.reduction_amount || 0),
                    piExpense: totals.piExpense + (bill.pi_expense || 0),
                    balanceDue: totals.balanceDue + balanceDue
                };
            },
            {
                totalBilled: 0,
                insurancePaid: 0,
                insuranceAdjusted: 0,
                medpayPaid: 0,
                patientPaid: 0,
                reductionAmount: 0,
                piExpense: 0,
                balanceDue: 0
            }
        );
    }, [filteredBills]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                            <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Billed</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(financialTotals.totalBilled)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Paid</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(financialTotals.insurancePaid + financialTotals.medpayPaid + financialTotals.patientPaid)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                            <DollarSign className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Adjustments</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(financialTotals.insuranceAdjusted)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50/50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                            <DollarSign className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Balance Due</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(financialTotals.balanceDue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Medical Providers Section */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-muted/30 border-b border-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-green-600" />
                        <div>
                            <h3 className="font-bold text-lg">Medical Providers</h3>
                            <p className="text-sm text-muted-foreground">
                                {filteredBills.length} records found
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedClientId || ""}
                                onChange={(e) => setSelectedClientId(e.target.value ? parseInt(e.target.value) : null)}
                                className="h-9 px-3 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">All Clients</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.first_name} {client.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleAddBill}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Bill
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Provider</th>
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3 text-center">HIPAA</th>
                                <th className="px-4 py-3 text-right">Billed</th>
                                <th className="px-4 py-3 text-right">Paid</th>
                                <th className="px-4 py-3 text-right">Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No medical bills found for this selection.
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => {
                                    const balanceDue = calculateMedicalBillBalanceDue(bill);
                                    const clientName = bill.client ? `${bill.client.first_name} ${bill.client.last_name}` : 'Unknown';

                                    return (
                                        <tr key={bill.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex flex-col">
                                                    <span className="text-foreground">{bill.medical_provider?.name || 'Unknown Provider'}</span>
                                                    <span className="text-xs text-muted-foreground">{bill.medical_provider?.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{clientName}</td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={bill.hipaa_sent}
                                                    readOnly
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(bill.total_billed)}</td>
                                            <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                                                {formatCurrency(bill.insurance_paid)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={cn(
                                                    "font-bold",
                                                    balanceDue > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                                )}>
                                                    {formatCurrency(balanceDue)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <MedicalBillModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                bill={null}
                clients={clients}
                casefileId={String(casefileId)}
                onUpdate={handleUpdate}
                onShowToast={handleShowToast}
            />

            <MedicalBillModal
                isOpen={!!editingBill}
                onClose={() => setEditingBill(null)}
                bill={editingBill}
                clients={clients}
                casefileId={String(casefileId)}
                onUpdate={handleUpdate}
                onShowToast={handleShowToast}
            />

            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
                    toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
