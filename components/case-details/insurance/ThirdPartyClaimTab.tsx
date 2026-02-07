"use client";

import { Scale, DollarSign, User } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { ThirdPartyClaim, CaseDetail } from "@/types";
import { useState } from "react";
import { ThirdPartyClaimModal } from "./ThirdPartyClaimModal";

interface Defendant {
    id: number;
    first_name: string;
    last_name: string;
    liability_percentage?: number;
}

interface ThirdPartyClaimTabProps {
    thirdPartyClaims: ThirdPartyClaim[];
    defendants: Defendant[];
    casefileId: string;
    onUpdate?: () => void;
}

export function ThirdPartyClaimTab({
    thirdPartyClaims = [],
    defendants = [],
    casefileId,
    onUpdate
}: ThirdPartyClaimTabProps) {
    const [modalDefendant, setModalDefendant] = useState<Defendant | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleShowToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpdate = () => {
        if (onUpdate) onUpdate();
    };

    const handleOpenModal = (defendant: Defendant) => {
        setModalDefendant(defendant);
    };

    const getClaimForDefendant = (defId: number) => {
        return thirdPartyClaims.find(c => c.defendant_id === defId);
    };

    if (!defendants || defendants.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="text-4xl mb-4">⚖️</div>
                <p className="text-muted-foreground mb-4">No defendants found. Please add defendants first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {defendants.map(defendant => {
                const claim = getClaimForDefendant(defendant.id);
                const defendantName = `${defendant.first_name || ''} ${defendant.last_name || ''}`.trim() || 'Unknown Defendant';
                const liability = defendant.liability_percentage ?? 100;

                return (
                    <div key={defendant.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                <h3 className="font-semibold">{defendantName}</h3>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${liability === 100 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                    {liability}% Liability
                                </span>
                            </div>
                            <button
                                onClick={() => handleOpenModal(defendant)}
                                className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                            >
                                {claim ? 'Edit' : 'Add Liability Claim'}
                            </button>
                        </div>

                        {!claim ? (
                            <div className="p-8 text-center">
                                <p className="text-muted-foreground mb-4">No liability insurance information available</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-4">
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

                                <div className="bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        <h4 className="font-bold text-sm">Settlement Status</h4>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        <div className="bg-background rounded p-2 border border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground">Limits</p>
                                            <p className="font-bold text-sm">{formatCurrency(claim.policy_limits || 0)}</p>
                                        </div>
                                        <div className="bg-background rounded p-2 border border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground">Demand</p>
                                            <p className="font-bold text-sm block truncate">{formatCurrency(claim.demand_amount || 0)}</p>
                                        </div>
                                        <div className="bg-background rounded p-2 border border-border/50">
                                            <p className="text-[10px] uppercase text-muted-foreground">Offer</p>
                                            <p className="font-bold text-sm">{formatCurrency(claim.offer_amount || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}

            <ThirdPartyClaimModal
                isOpen={!!modalDefendant}
                onClose={() => setModalDefendant(null)}
                claim={modalDefendant ? getClaimForDefendant(modalDefendant.id) : null}
                defendantId={modalDefendant?.id || 0}
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
