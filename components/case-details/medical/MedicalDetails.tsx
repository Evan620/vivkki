"use client";

import { useMemo, useState } from "react";
import { DollarSign, Filter, Heart, FileText, Plus, Shield, Receipt, CreditCard, AlertTriangle, User, Edit2, Trash2 } from "lucide-react";
import { calculateMedicalBillBalanceDue, formatCurrency } from "@/lib/calculations";
import type { MedicalBill, Client, HealthClaim } from "@/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import AdjusterModal from "@/components/forms/AdjusterModal";
import { useRouter } from "next/navigation";

interface MedicalDetailsProps {
    medicalBills: MedicalBill[];
    clients: Client[];
    healthClaim?: HealthClaim | null;
    casefileId: number;
}

export function MedicalDetails({
    medicalBills = [],
    clients = [],
    healthClaim,
    casefileId
}: MedicalDetailsProps) {
    const router = useRouter();
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [isAdjusterModalOpen, setIsAdjusterModalOpen] = useState(false);
    const [editingAdjuster, setEditingAdjuster] = useState<any | null>(null);

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

    const handleAddAdjuster = () => {
        setEditingAdjuster(null);
        setIsAdjusterModalOpen(true);
    };

    const handleEditAdjuster = (adjuster: any) => {
        setEditingAdjuster(adjuster);
        setIsAdjusterModalOpen(true);
    };

    const handleDeleteAdjuster = async (adjusterId: number) => {
        if (!confirm('Are you sure you want to delete this adjuster?')) return;

        try {
            // First, remove the adjuster reference from health_claims
            if (healthClaim) {
                await supabase
                    .from('health_claims')
                    .update({ health_adjuster_id: null })
                    .eq('id', healthClaim.id);
            }

            // Then delete the adjuster
            const { error } = await supabase
                .from('health_adjusters')
                .delete()
                .eq('id', adjusterId);

            if (error) throw error;
            router.refresh();
        } catch (error: any) {
            console.error('Error deleting adjuster:', error);
            alert('Failed to delete adjuster: ' + (error.message || 'Unknown error'));
        }
    };

    const handleAdjusterSubmit = async (adjusterData: any) => {
        if (!healthClaim || !healthClaim.health_insurance_id) return;

        try {
            if (editingAdjuster) {
                // Update existing adjuster
                const { error } = await supabase
                    .from('health_adjusters')
                    .update(adjusterData)
                    .eq('id', editingAdjuster.id);

                if (error) throw error;
            } else {
                // Create new adjuster
                const adjusterPayload: any = {
                    ...adjusterData,
                    health_insurance_id: healthClaim.health_insurance_id
                };

                const { data: newAdjuster, error: insertError } = await supabase
                    .from('health_adjusters')
                    .insert([adjusterPayload])
                    .select()
                    .single();

                if (insertError) throw insertError;

                // Link adjuster to health claim
                if (newAdjuster && healthClaim.id) {
                    const { error: updateError } = await supabase
                        .from('health_claims')
                        .update({ health_adjuster_id: newAdjuster.id })
                        .eq('id', healthClaim.id);

                    if (updateError) throw updateError;
                }
            }
            router.refresh();
        } catch (error: any) {
            console.error('Error saving adjuster:', error);
            throw error;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Health Insurance Section */}
            {healthClaim ? (
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-100 dark:border-green-900">
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <h2 className="text-lg font-bold">Health Insurance</h2>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* Health Insurance Company Information */}
                        {healthClaim.health_insurance && (
                            <div>
                                <h3 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    Insurance Company
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Company Name</p>
                                        <p className="font-medium">{healthClaim.health_insurance.name || 'Not specified'}</p>
                                    </div>
                                    {healthClaim.health_insurance.street_address && (
                                        <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Address</p>
                                            <p className="text-sm">
                                                {healthClaim.health_insurance.street_address}
                                                {healthClaim.health_insurance.city && `, ${healthClaim.health_insurance.city}`}
                                                {healthClaim.health_insurance.state && `, ${healthClaim.health_insurance.state}`}
                                                {healthClaim.health_insurance.zip_code && ` ${healthClaim.health_insurance.zip_code}`}
                                            </p>
                                        </div>
                                    )}
                                    {healthClaim.health_insurance.phone && (
                                        <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Phone</p>
                                            <p className="text-sm font-medium">{healthClaim.health_insurance.phone}</p>
                                        </div>
                                    )}
                                    {healthClaim.health_insurance.email && (
                                        <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Email</p>
                                            <p className="text-sm font-medium">{healthClaim.health_insurance.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Health Claim Details */}
                        <div>
                            <h3 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                Claim Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {healthClaim.policy_number && (
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Policy Number</p>
                                        <p className="text-sm font-mono font-medium">{healthClaim.policy_number}</p>
                                    </div>
                                )}
                                {healthClaim.group_number && (
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Group Number</p>
                                        <p className="text-sm font-mono font-medium">{healthClaim.group_number}</p>
                                    </div>
                                )}
                                {healthClaim.claim_number && (
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Claim Number</p>
                                        <p className="text-sm font-mono font-medium">{healthClaim.claim_number}</p>
                                    </div>
                                )}
                                {healthClaim.amount_billed !== undefined && healthClaim.amount_billed !== null && (
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Amount Billed</p>
                                        <p className="text-sm font-medium">{formatCurrency(healthClaim.amount_billed)}</p>
                                    </div>
                                )}
                                {healthClaim.amount_paid !== undefined && healthClaim.amount_paid !== null && (
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Amount Paid</p>
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">{formatCurrency(healthClaim.amount_paid)}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Health Adjuster Information */}
                        {healthClaim.health_adjusters && healthClaim.health_adjusters.length > 0 ? (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        Adjuster Information
                                    </h3>
                                    <button
                                        onClick={handleAddAdjuster}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Adjuster
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {healthClaim.health_adjusters.map((adjuster: any) => (
                                        <div key={adjuster.id} className="p-3 bg-muted/20 rounded-lg border border-border/50 relative group">
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditAdjuster(adjuster)}
                                                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                    title="Edit adjuster"
                                                >
                                                    <Edit2 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAdjuster(adjuster.id)}
                                                    className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                    title="Delete adjuster"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-20">
                                                <div>
                                                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Name</p>
                                                    <p className="font-medium text-sm">
                                                        {adjuster.first_name} {adjuster.middle_name ? `${adjuster.middle_name} ` : ''}{adjuster.last_name}
                                                    </p>
                                                </div>
                                                {adjuster.email && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Email</p>
                                                        <p className="text-sm font-medium">{adjuster.email}</p>
                                                    </div>
                                                )}
                                                {adjuster.phone && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Phone</p>
                                                        <p className="text-sm font-medium">{adjuster.phone}</p>
                                                    </div>
                                                )}
                                                {adjuster.fax && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Fax</p>
                                                        <p className="text-sm font-medium">{adjuster.fax}</p>
                                                    </div>
                                                )}
                                                {adjuster.street_address && (
                                                    <div className="sm:col-span-2">
                                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Address</p>
                                                        <p className="text-sm">
                                                            {adjuster.street_address}
                                                            {adjuster.city && `, ${adjuster.city}`}
                                                            {adjuster.state && `, ${adjuster.state}`}
                                                            {adjuster.zip_code && ` ${adjuster.zip_code}`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-md font-semibold text-foreground flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        Adjuster Information
                                    </h3>
                                    <button
                                        onClick={handleAddAdjuster}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Adjuster
                                    </button>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-lg border border-border/50 text-center">
                                    <p className="text-sm text-muted-foreground mb-2">No adjuster assigned</p>
                                    <button
                                        onClick={handleAddAdjuster}
                                        className="text-xs text-primary hover:text-primary/80 font-medium"
                                    >
                                        Add your first adjuster
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b border-green-100 dark:border-green-900">
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
                            <h2 className="text-lg font-bold">Health Insurance</h2>
                        </div>
                    </div>
                    <div className="p-8 text-center">
                        <p className="text-muted-foreground mb-4">No health insurance information available for this case.</p>
                    </div>
                </div>
            )}

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

            <AdjusterModal
                isOpen={isAdjusterModalOpen}
                onClose={() => {
                    setIsAdjusterModalOpen(false);
                    setEditingAdjuster(null);
                }}
                onSubmit={handleAdjusterSubmit}
                initialData={editingAdjuster}
            />
        </div>
    );
}
