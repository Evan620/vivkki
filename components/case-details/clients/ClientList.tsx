"use client";

import { useState, useMemo } from "react";
import { User, Phone, Mail, MapPin, ChevronUp, ChevronDown, Edit2, Trash2, Heart, Activity, DollarSign, Car, Plus } from "lucide-react";
import { Client, MedicalBill } from "@/types";
import { formatCurrency } from "@/lib/calculations";

interface ClientListProps {
    clients: Client[];
    medicalBills?: MedicalBill[];
}

export function ClientList({ clients, medicalBills = [] }: ClientListProps) {
    const [expandedClient, setExpandedClient] = useState<number | null>(clients[0]?.id || null);

    // Calculate medical bills per client
    const getClientMedicalBills = (clientId: number) => {
        return medicalBills.filter(bill => bill.client_id === clientId);
    };

    // Calculate totals for a client's medical bills
    const calculateClientTotals = (clientId: number) => {
        const clientBills = getClientMedicalBills(clientId);
        return {
            totalBilled: clientBills.reduce((sum, bill) => sum + (bill.total_billed || 0), 0),
            totalPaid: clientBills.reduce((sum, bill) => sum + (bill.insurance_paid || 0) + (bill.patient_paid || 0) + (bill.medpay_paid || 0), 0),
            totalAdjusted: clientBills.reduce((sum, bill) => sum + (bill.insurance_adjusted || 0), 0),
            totalReduced: clientBills.reduce((sum, bill) => sum + (bill.reduction_amount || 0), 0),
            balanceDue: clientBills.reduce((sum, bill) => sum + (bill.balance_due || 0), 0),
            billCount: clientBills.length
        };
    };

    // Calculate grand total across all clients
    const grandTotals = useMemo(() => {
        return clients.reduce((totals, client) => {
            const clientBills = getClientMedicalBills(client.id);
            return {
                totalBilled: totals.totalBilled + clientBills.reduce((sum, bill) => sum + (bill.total_billed || 0), 0),
                totalPaid: totals.totalPaid + clientBills.reduce((sum, bill) => sum + (bill.insurance_paid || 0) + (bill.patient_paid || 0) + (bill.medpay_paid || 0), 0),
                totalAdjusted: totals.totalAdjusted + clientBills.reduce((sum, bill) => sum + (bill.insurance_adjusted || 0), 0),
                totalReduced: totals.totalReduced + clientBills.reduce((sum, bill) => sum + (bill.reduction_amount || 0), 0),
                balanceDue: totals.balanceDue + clientBills.reduce((sum, bill) => sum + (bill.balance_due || 0), 0),
                billCount: totals.billCount + clientBills.length
            };
        }, { totalBilled: 0, totalPaid: 0, totalAdjusted: 0, totalReduced: 0, balanceDue: 0, billCount: 0 });
    }, [clients, medicalBills]);

    // Helpers
    const formatDate = (dateStr?: string) => dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';
    const formatPhone = (phone?: string) => phone || 'N/A';
    const maskSSN = (ssn?: string) => ssn ? `***-**-${ssn.slice(-4)}` : 'N/A';

    if (!clients || clients.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                <div className="flex justify-center mb-4">
                    <User className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Clients Found</h3>
                <p>This case doesn't have any clients yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        Clients
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {clients.length} client{clients.length !== 1 ? 's' : ''} ({clients.filter(c => c.is_driver).length} driver)
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" /> Add Client
                </button>
            </div>

            {/* Client Lists */}
            <div className="space-y-4">
                {clients.map((client, index) => (
                    <div key={client.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        {/* Client Header Bar */}
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <div>
                                    <h3 className="font-bold text-lg">
                                        {client.first_name} {client.last_name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>Client #{index + 1}</span>
                                        {client.is_driver && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full text-xs font-medium">
                                                <Car className="w-3 h-3" /> Driver
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                                    className="text-sm text-primary font-medium hover:underline"
                                >
                                    {expandedClient === client.id ? 'Collapse' : 'Expand'}
                                </button>
                                <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedClient === client.id && (
                            <div className="p-6 space-y-8">
                                {/* Personal Info */}
                                <div>
                                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                                        <User className="w-4 h-4" /> Personal Information
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Full Name</p>
                                            <p className="font-medium">{client.first_name} {client.middle_name} {client.last_name}</p>
                                        </div>
                                        <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Date of Birth</p>
                                            <p className="font-medium">{formatDate(client.date_of_birth)}</p>
                                        </div>
                                        <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">SSN</p>
                                            <p className="font-mono font-medium">{maskSSN(client.ssn)}</p>
                                        </div>
                                        <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Marital Status</p>
                                            <p className="font-medium">{client.marital_status || 'Unknown'}</p>
                                        </div>
                                        <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Is Driver</p>
                                            <p className="font-medium">{client.is_driver ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div>
                                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <Phone className="w-4 h-4" /> Contact Information
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2 p-4 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Address</p>
                                            <p className="font-medium">
                                                {[client.street_address || client.address, client.city, client.state, client.zip_code].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Primary Phone</p>
                                            <p className="font-medium">{formatPhone(client.primary_phone)}</p>
                                        </div>
                                        <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Secondary Phone</p>
                                            <p className="font-medium">{formatPhone(client.secondary_phone)}</p>
                                        </div>
                                        <div className="sm:col-span-2 p-4 bg-muted/20 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                                            <p className="font-medium">{client.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Medical Info */}
                                <div>
                                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                                        <Heart className="w-4 h-4" /> Medical Information
                                    </h4>
                                    <div className="space-y-4">
                                        {client.injury_description && (
                                            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Injury Description</p>
                                                <p className="text-sm whitespace-pre-wrap">{client.injury_description}</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Prior Accidents</p>
                                                <p className="font-medium">{client.prior_accidents || 'None'}</p>
                                            </div>
                                            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Prior Injuries</p>
                                                <p className="font-medium">{client.prior_injuries || 'None'}</p>
                                            </div>
                                            <div className="sm:col-span-2 p-4 bg-muted/20 rounded-lg border border-border/50">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Work Impact</p>
                                                <p className="font-medium">{client.work_impact || 'Not specified'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Referral Info */}
                                {(client.referrer || client.referrer_relationship) && (
                                    <div>
                                        <h4 className="font-semibold mb-4 text-orange-600 dark:text-orange-400">Referral Information</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Referred By</p>
                                                <p className="font-medium">{client.referrer}</p>
                                            </div>
                                            <div className="p-4 bg-muted/20 rounded-lg border border-border/50">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Relationship</p>
                                                <p className="font-medium">{client.referrer_relationship}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Medical Bills Summary */}
                                {(() => {
                                    const totals = calculateClientTotals(client.id);
                                    return (
                                        <div>
                                            <h4 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                                                <Activity className="w-4 h-4" /> Medical Bills Summary
                                            </h4>
                                            {totals.billCount > 0 ? (
                                                <>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                                                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900">
                                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Total Billed</p>
                                                            <p className="text-lg font-bold">{formatCurrency(totals.totalBilled)}</p>
                                                            <p className="text-xs text-muted-foreground">{totals.billCount} bills</p>
                                                        </div>
                                                        <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900">
                                                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Total Paid</p>
                                                            <p className="text-lg font-bold">{formatCurrency(totals.totalPaid)}</p>
                                                            <p className="text-xs text-muted-foreground">Paid</p>
                                                        </div>
                                                        <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900">
                                                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">Balance Due</p>
                                                            <p className={`text-lg font-bold ${totals.balanceDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600'}`}>
                                                                {formatCurrency(totals.balanceDue)}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">Outstanding</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-muted p-3 rounded-lg text-sm text-center">
                                                        Adjustments: <span className="font-medium">{formatCurrency(totals.totalAdjusted)}</span> |
                                                        Reductions: <span className="font-medium">{formatCurrency(totals.totalReduced)}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="bg-muted/30 border border-border p-4 rounded-lg text-center text-muted-foreground text-sm">
                                                    No medical bills for this client.
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Grand Totals */}
            {grandTotals.billCount > 0 && (
                <div className="bg-card border-2 border-primary/20 rounded-xl shadow-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-6 h-6 text-primary" />
                        <h3 className="text-lg font-bold">Grand Total - All Clients</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Total Billed</p>
                            <p className="text-xl font-bold">{formatCurrency(grandTotals.totalBilled)}</p>
                            <p className="text-xs text-muted-foreground">{grandTotals.billCount} bills</p>
                        </div>
                        <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900">
                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">Total Paid</p>
                            <p className="text-xl font-bold">{formatCurrency(grandTotals.totalPaid)}</p>
                            <p className="text-xs text-muted-foreground">All Payments</p>
                        </div>
                        <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900">
                            <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">Total Balance Due</p>
                            <p className={`text-xl font-bold ${grandTotals.balanceDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600'}`}>
                                {formatCurrency(grandTotals.balanceDue)}
                            </p>
                            <p className="text-xs text-muted-foreground">Outstanding</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
