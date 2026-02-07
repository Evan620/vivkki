"use client";

import { Shield, DollarSign, User, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { FirstPartyClaim, Client } from "@/types";
import { useState } from "react";
import { FirstPartyClaimModal } from "./FirstPartyClaimModal";

interface FirstPartyClaimTabProps {
    firstPartyClaims: FirstPartyClaim[];
    clients: Client[];
    casefileId: string;
    onUpdate?: () => void;
}

export function FirstPartyClaimTab({
    firstPartyClaims = [],
    clients = [],
    casefileId,
    onUpdate
}: FirstPartyClaimTabProps) {
    const [modalClient, setModalClient] = useState<Client | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleShowToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpdate = () => {
        if (onUpdate) onUpdate();
    };

    const handleOpenModal = (client: Client) => {
        setModalClient(client);
    };

    // Helper to find claim for client
    const getClaimForClient = (clientId: number) => {
        // legacy was passing firstPartyClaimsByClient map, here we have flat list
        // Assuming one claim per client for simplicity or finding first
        return firstPartyClaims.find(c => c.client_id === clientId);
    };

    if (!clients || clients.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="text-4xl mb-4">🛡️</div>
                <p className="text-muted-foreground mb-4">No clients found. Please add clients first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {clients.map(client => {
                const claim = getClaimForClient(client.id);
                // Type safety for Client interface - assumes first_name/last_name exist
                const clientName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Unknown Client';
                const isDriver = client.is_driver;

                const pipAvailable = claim?.pip_available || 0;
                const pipUsed = claim?.pip_used || 0;
                const pipRemaining = pipAvailable - pipUsed;

                const medPayAvailable = claim?.med_pay_available || 0;
                const medPayUsed = claim?.med_pay_used || 0;
                const medPayRemaining = medPayAvailable - medPayUsed;

                return (
                    <div key={client.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        {/* Client Header */}
                        <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold">{clientName}</h3>
                                {isDriver && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">Driver</span>
                                )}
                            </div>
                            <button
                                onClick={() => handleOpenModal(client)}
                                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                            >
                                {claim ? 'Edit' : 'Add Insurance'}
                            </button>
                        </div>

                        {!claim ? (
                            <div className="p-8 text-center">
                                <p className="text-muted-foreground mb-4">No auto insurance information available</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
                                {/* Basic Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Insurance Company</p>
                                        <p className="font-medium">{claim.auto_insurance?.name || 'Not specified'}</p>
                                    </div>
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                                        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Policy / Claim #</p>
                                        <p className="text-sm font-mono">
                                            P: {claim.policy_number || 'N/A'}<br />
                                            C: {claim.claim_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* PIP Coverage */}
                                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <h4 className="font-bold text-sm">PIP Coverage</h4>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-background rounded p-2 border border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground">Available</p>
                                            <p className="font-bold text-sm">{formatCurrency(pipAvailable)}</p>
                                        </div>
                                        <div className="bg-background rounded p-2 border border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground">Used</p>
                                            <p className="font-bold text-sm">{formatCurrency(pipUsed)}</p>
                                        </div>
                                        <div className="bg-background rounded p-2 border border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground">Remaining</p>
                                            <p className={`font-bold text-sm ${pipRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(pipRemaining)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* MedPay Coverage */}
                                <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                        <h4 className="font-bold text-sm">MedPay Coverage</h4>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-background rounded p-2 border border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground">Available</p>
                                            <p className="font-bold text-sm">{formatCurrency(medPayAvailable)}</p>
                                        </div>
                                        <div className="bg-background rounded p-2 border border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground">Used</p>
                                            <p className="font-bold text-sm">{formatCurrency(medPayUsed)}</p>
                                        </div>
                                        <div className="bg-background rounded p-2 border border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground">Remaining</p>
                                            <p className={`font-bold text-sm ${medPayRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(medPayRemaining)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <FirstPartyClaimModal
                isOpen={!!modalClient}
                onClose={() => setModalClient(null)}
                claim={modalClient ? getClaimForClient(modalClient.id) : null}
                clientId={modalClient?.id || 0}
                casefileId={casefileId}
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
