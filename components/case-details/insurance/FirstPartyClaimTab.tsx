"use client";

import { useState } from "react";
import { Shield, DollarSign, User, Plus, Edit2, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { FirstPartyClaim, Client } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import AdjusterModal from "@/components/forms/AdjusterModal";
import InsuranceClaimModal from "@/components/forms/InsuranceClaimModal";
import { useRouter } from "next/navigation";

interface FirstPartyClaimTabProps {
    firstPartyClaims: FirstPartyClaim[];
    clients: Client[];
    casefileId?: string;
    onUpdate?: () => void;
}

export function FirstPartyClaimTab({
    firstPartyClaims = [],
    clients = [],
    casefileId,
    onUpdate
}: FirstPartyClaimTabProps) {
    const router = useRouter();
    const [isAdjusterModalOpen, setIsAdjusterModalOpen] = useState(false);
    const [editingAdjuster, setEditingAdjuster] = useState<any | null>(null);
    const [currentClaim, setCurrentClaim] = useState<any | null>(null);
    const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
    const [editingClaim, setEditingClaim] = useState<any | null>(null);
    const [currentClient, setCurrentClient] = useState<any | null>(null);

    // Helper to find claim for client
    const getClaimForClient = (clientId: number) => {
        // legacy was passing firstPartyClaimsByClient map, here we have flat list
        // Assuming one claim per client for simplicity or finding first
        return firstPartyClaims.find(c => c.client_id === clientId);
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
                // Create new adjuster
                const adjusterPayload: any = {
                    ...adjusterData,
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

    const handleAddInsurance = (client: any) => {
        setEditingClaim(null);
        setCurrentClient(client);
        setIsInsuranceModalOpen(true);
    };

    const handleEditInsurance = (claim: any, client: any) => {
        setEditingClaim(claim);
        setCurrentClient(client);
        setIsInsuranceModalOpen(true);
    };

    const handleInsuranceSubmit = async (claimData: any) => {
        try {
            if (editingClaim) {
                // Update existing claim
                const { error } = await supabase
                    .from('first_party_claims')
                    .update(claimData)
                    .eq('id', editingClaim.id);

                if (error) throw error;
            } else {
                // Create new claim
                const { error } = await supabase
                    .from('first_party_claims')
                    .insert([claimData]);

                if (error) throw error;
            }
            router.refresh();
        } catch (error: any) {
            console.error('Error saving insurance claim:', error);
            throw error;
        }
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
                                onClick={() => claim ? handleEditInsurance(claim, client) : handleAddInsurance(client)}
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
                );
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
                    setCurrentClient(null);
                }}
                onSubmit={handleInsuranceSubmit}
                initialData={editingClaim}
                type="first-party"
                clientId={currentClient?.id}
                casefileId={currentClient?.casefile_id}
            />
        </div>
    );
}
