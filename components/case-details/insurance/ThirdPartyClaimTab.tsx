"use client";

import { useState } from "react";
import { Scale, DollarSign, User, Plus, Edit2, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { ThirdPartyClaim, CaseDetail } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import AdjusterModal from "@/components/forms/AdjusterModal";
import InsuranceClaimModal from "@/components/forms/InsuranceClaimModal";
import { useRouter } from "next/navigation";

// Need Defendant type roughly matches CaseDetail['defendants'][0] but with more fields if fetched fully.
// For now we map strictly to what we need
interface Defendant {
    id: number;
    first_name: string;
    last_name: string;
    liability_percentage?: number;
    // other fields...
}

interface ThirdPartyClaimTabProps {
    thirdPartyClaims: ThirdPartyClaim[];
    defendants: Defendant[];
}

export function ThirdPartyClaimTab({
    thirdPartyClaims = [],
    defendants = []
}: ThirdPartyClaimTabProps) {
    const router = useRouter();
    const [isAdjusterModalOpen, setIsAdjusterModalOpen] = useState(false);
    const [editingAdjuster, setEditingAdjuster] = useState<any | null>(null);
    const [currentClaim, setCurrentClaim] = useState<any | null>(null);
    const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
    const [editingClaim, setEditingClaim] = useState<any | null>(null);
    const [currentDefendant, setCurrentDefendant] = useState<any | null>(null);

    const getClaimForDefendant = (defId: number) => {
        return thirdPartyClaims.find(c => c.defendant_id === defId);
    };

    const handleAddAdjuster = (claim: any) => {
        setEditingAdjuster(null);
        setCurrentClaim(claim);
        setIsAdjusterModalOpen(true);
    };

    const handleEditAdjuster = (adjuster: any, claim: any) => {
        setEditingAdjuster(adjuster);
        setCurrentClaim(claim);
        setIsAdjusterModalOpen(true);
    };

    const handleDeleteAdjuster = async (adjusterId: number) => {
        if (!confirm('Are you sure you want to delete this adjuster?')) return;

        try {
            const { error } = await supabase
                .from('auto_adjusters')
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
        if (!currentClaim) return;

        try {
            if (editingAdjuster) {
                // Update existing adjuster
                const { error } = await supabase
                    .from('auto_adjusters')
                    .update(adjusterData)
                    .eq('id', editingAdjuster.id);

                if (error) throw error;
            } else {
                // Create new adjuster - link to both third_party_claim_id and auto_insurance_id
                const adjusterPayload: any = {
                    ...adjusterData,
                    third_party_claim_id: currentClaim.id,
                    auto_insurance_id: currentClaim.auto_insurance_id
                };

                const { error } = await supabase
                    .from('auto_adjusters')
                    .insert([adjusterPayload]);

                if (error) throw error;
            }
            router.refresh();
        } catch (error: any) {
            console.error('Error saving adjuster:', error);
            throw error;
        }
    };

    const handleAddInsurance = (defendant: any) => {
        setEditingClaim(null);
        setCurrentDefendant(defendant);
        setIsInsuranceModalOpen(true);
    };

    const handleEditInsurance = (claim: any, defendant: any) => {
        setEditingClaim(claim);
        setCurrentDefendant(defendant);
        setIsInsuranceModalOpen(true);
    };

    const handleInsuranceSubmit = async (claimData: any) => {
        try {
            if (editingClaim) {
                // Update existing claim
                const { error } = await supabase
                    .from('third_party_claims')
                    .update(claimData)
                    .eq('id', editingClaim.id);

                if (error) throw error;
            } else {
                // Create new claim
                const { error } = await supabase
                    .from('third_party_claims')
                    .insert([claimData]);

                if (error) throw error;
            }
            router.refresh();
        } catch (error: any) {
            console.error('Error saving insurance claim:', error);
            throw error;
        }
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
                                onClick={() => claim ? handleEditInsurance(claim, defendant) : handleAddInsurance(defendant)}
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

                                {/* Adjusters Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-md font-semibold text-foreground flex items-center gap-2">
                                            <User className="w-4 h-4 text-primary" />
                                            Adjuster Information
                                        </h4>
                                        <button
                                            onClick={() => handleAddAdjuster(claim)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Adjuster
                                        </button>
                                    </div>
                                    {claim.auto_adjusters && claim.auto_adjusters.length > 0 ? (
                                        <div className="space-y-3">
                                            {claim.auto_adjusters.map((adjuster: any) => (
                                                <div key={adjuster.id} className="p-3 bg-muted/20 rounded-lg border border-border/50 relative group">
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditAdjuster(adjuster, claim)}
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
                                                            <p className="font-medium text-sm">{adjuster.first_name} {adjuster.last_name}</p>
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
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-muted/20 rounded-lg border border-border/50 text-center">
                                            <p className="text-sm text-muted-foreground mb-2">No adjusters assigned</p>
                                            <button
                                                onClick={() => handleAddAdjuster(claim)}
                                                className="text-xs text-primary hover:text-primary/80 font-medium"
                                            >
                                                Add your first adjuster
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}

            <AdjusterModal
                isOpen={isAdjusterModalOpen}
                onClose={() => {
                    setIsAdjusterModalOpen(false);
                    setEditingAdjuster(null);
                    setCurrentClaim(null);
                }}
                onSubmit={handleAdjusterSubmit}
                initialData={editingAdjuster}
            />

            <InsuranceClaimModal
                isOpen={isInsuranceModalOpen}
                onClose={() => {
                    setIsInsuranceModalOpen(false);
                    setEditingClaim(null);
                    setCurrentDefendant(null);
                }}
                onSubmit={handleInsuranceSubmit}
                initialData={editingClaim}
                type="third-party"
                defendantId={currentDefendant?.id}
            />
        </div>
    );
}
