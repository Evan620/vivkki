"use client";

import { useState } from "react";
import {
    Scale, Users, AlertTriangle, ChevronUp, ChevronDown,
    Edit2, Trash2, Plus, Info, Shield
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { EditDefendantModal } from "./EditDefendantModal";
import { useRouter } from "next/navigation";
import AdjusterModal from "@/components/forms/AdjusterModal";

interface DefendantListProps {
    defendants: any[];
    casefileId: string;
    onUpdate?: () => void;
}

export function DefendantList({ defendants, casefileId, onUpdate }: DefendantListProps) {
    const router = useRouter();
    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedDefendant, setSelectedDefendant] = useState<any | null>(null);
    const [isAdjusterModalOpen, setIsAdjusterModalOpen] = useState(false);
    const [editingAdjuster, setEditingAdjuster] = useState<any | null>(null);
    const [currentDefendant, setCurrentDefendant] = useState<any | null>(null);

    const effectiveCasefileId = casefileId || defendants[0]?.casefile_id;

    const toggleExpand = (id: number) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleUpdate = () => {
        if (onUpdate) onUpdate();
    };

    const handleAddDefendant = () => {
        setSelectedDefendant(null);
        setIsEditModalOpen(true);
    };

    const handleEditDefendant = (defendant: any) => {
        setSelectedDefendant(defendant);
        setIsEditModalOpen(true);
    };

    const handleDeleteDefendant = async (id: string) => {
        if (!confirm("Are you sure you want to delete this defendant?")) return;

        try {
            const { error } = await supabase.from('defendants').delete().eq('id', id);
            if (error) throw error;
            handleUpdate();
        } catch (error) {
            console.error("Error deleting defendant", error);
        }
    };

    const handleAddAdjuster = (defendant: any) => {
        setEditingAdjuster(null);
        setCurrentDefendant(defendant);
        setIsAdjusterModalOpen(true);
    };

    const handleEditAdjuster = (adjuster: any, defendant: any) => {
        setEditingAdjuster(adjuster);
        setCurrentDefendant(defendant);
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
        if (!currentDefendant) return;

        // Find the third party claim for this defendant
        // We need to fetch it or get it from the defendant data
        try {
            // First, get the third party claim for this defendant
            const { data: thirdPartyClaim, error: claimError } = await supabase
                .from('third_party_claims')
                .select('id, auto_insurance_id')
                .eq('defendant_id', parseInt(currentDefendant.id))
                .single();

            if (claimError && claimError.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw claimError;
            }

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
                };

                if (thirdPartyClaim) {
                    adjusterPayload.third_party_claim_id = thirdPartyClaim.id;
                    adjusterPayload.auto_insurance_id = thirdPartyClaim.auto_insurance_id;
                } else if (currentDefendant.auto_insurance_id) {
                    adjusterPayload.auto_insurance_id = currentDefendant.auto_insurance_id;
                }

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

    const totalLiability = (defendants || []).reduce((sum, d) => sum + (d.liability_percentage || 0), 0);

    const getLiabilityStatus = () => {
        if (totalLiability > 100) return {
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-950/30',
            border: 'border-red-200 dark:border-red-900',
            icon: 'text-red-600 dark:text-red-400'
        };
        if (totalLiability < 100) return {
            color: 'text-yellow-600 dark:text-yellow-400',
            bg: 'bg-yellow-50 dark:bg-yellow-950/30',
            border: 'border-yellow-200 dark:border-yellow-900',
            icon: 'text-yellow-600 dark:text-yellow-400'
        };
        return {
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-950/30',
            border: 'border-green-200 dark:border-green-900',
            icon: 'text-green-600 dark:text-green-400'
        };
    };

    const liabilityStatus = getLiabilityStatus();

    if (!defendants || defendants.length === 0) {
        return (
            <>
                <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center text-muted-foreground animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-6xl mb-4 opacity-50">⚖️</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Defendants Found</h3>
                    <p className="mb-6">This case doesn't have any defendants yet.</p>
                    <button
                        onClick={handleAddDefendant}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add First Defendant
                    </button>
                </div>

                <EditDefendantModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    defendant={null}
                    casefileId={effectiveCasefileId} // Safe fallback used
                    onUpdate={handleUpdate}
                />
            </>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b border-orange-100 dark:border-orange-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-foreground">Defendants</h2>
                                <p className="text-sm text-muted-foreground">{defendants.length} defendants ({totalLiability}% total liability)</p>
                            </div>
                        </div>
                        <button
                            onClick={handleAddDefendant}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Defendant
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 bg-card">
                    {/* Liability Warning */}
                    {totalLiability !== 100 && (
                        <div className={`mt-0 ${liabilityStatus.bg} ${liabilityStatus.border} border rounded-lg p-4 flex items-center gap-3 shadow-sm`}>
                            <AlertTriangle className={`w-5 h-5 ${liabilityStatus.icon}`} />
                            <p className={`text-sm font-medium ${liabilityStatus.color}`}>
                                <strong>Liability Distribution:</strong> Total liability is {totalLiability}%
                                {totalLiability > 100 ? ' (exceeds 100%)' : ' (under 100%)'}
                                {totalLiability > 100 ? ' - Please adjust percentages to total 100%' : ' - Consider adding more defendants or adjusting percentages'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Defendant Cards */}
            <div className="space-y-4">
                {defendants.map((defendant, index) => (
                    <div key={defendant.id} className="bg-card rounded-xl sm:rounded-2xl shadow-sm border border-border overflow-hidden transition-all hover:shadow-md">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Scale className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        {defendant.first_name || 'Unknown'} {defendant.last_name || 'Defendant'}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>Defendant #{index + 1}</span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full bg-background border border-border shadow-sm`}>
                                            {defendant.liability_percentage ?? 100}% Liability
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleExpand(Number(defendant.id))}
                                    className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium flex items-center gap-1"
                                >
                                    {expandedIds.includes(Number(defendant.id)) ? 'Collapse' : 'Expand'}
                                    {expandedIds.includes(Number(defendant.id)) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => handleEditDefendant(defendant)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <Edit2 className="w-3 h-3" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteDefendant(defendant.id)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                </button>
                            </div>
                        </div>

                        {expandedIds.includes(Number(defendant.id)) && (
                            <div className="p-4 sm:p-6 space-y-6 bg-card">
                                {/* Details Grid */}
                                <div>
                                    <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <Scale className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                        Defendant Information
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/50">
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Full Name</p>
                                            <p className="text-sm font-bold text-foreground">{defendant.first_name} {defendant.last_name}</p>
                                        </div>
                                        <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-900/50">
                                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">Is Policyholder</p>
                                            <p className="text-sm font-medium text-foreground">{defendant.is_policyholder ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/50">
                                            <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">Liability Percentage</p>
                                            <p className="text-sm font-bold text-foreground">{defendant.liability_percentage}%</p>
                                        </div>

                                        {!defendant.is_policyholder && (
                                            <div className="sm:col-span-2 lg:col-span-3 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/50">
                                                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">Policyholder Name</p>
                                                <p className="text-sm font-medium text-foreground">{defendant.policyholder_first_name} {defendant.policyholder_last_name}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Insurance */}
                                <div>
                                    <h4 className="text-md font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        Insurance Information
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Insurance Company</p>
                                            <p className="text-sm font-medium text-foreground">{defendant.auto_insurance?.name || 'Not provided'}</p>
                                        </div>
                                        <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Policy Number</p>
                                            <p className="text-sm font-mono font-medium text-foreground">{defendant.policy_number || 'Not provided'}</p>
                                        </div>
                                        <div className="p-4 bg-muted/40 rounded-lg border border-border/50">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Claim Number</p>
                                            <p className="text-sm font-mono font-medium text-foreground">{defendant.claim_number || 'Not provided'}</p>
                                        </div>
                                        {defendant.notes && (
                                            <div className="sm:col-span-2 p-4 bg-muted/40 rounded-lg border border-border/50">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</p>
                                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{defendant.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Adjusters */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-md font-semibold text-foreground flex items-center gap-2">
                                            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            Adjuster Information
                                        </h4>
                                        <button
                                            onClick={() => handleAddAdjuster(defendant)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Adjuster
                                        </button>
                                    </div>
                                    {defendant.auto_adjusters && defendant.auto_adjusters.length > 0 ? (
                                        <div className="space-y-4">
                                            {defendant.auto_adjusters.map((adjuster: any) => (
                                                <div key={adjuster.id} className="p-4 bg-muted/40 rounded-lg border border-border/50 relative group">
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditAdjuster(adjuster, defendant)}
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
                                                    <div className="flex items-start justify-between mb-3 pr-20">
                                                        <h5 className="text-sm font-semibold text-foreground">{adjuster.first_name} {adjuster.last_name}</h5>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {adjuster.email && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Email</p>
                                                                <p className="text-sm font-medium text-foreground">{adjuster.email}</p>
                                                            </div>
                                                        )}
                                                        {adjuster.phone && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Phone</p>
                                                                <p className="text-sm font-medium text-foreground">{adjuster.phone}</p>
                                                            </div>
                                                        )}
                                                        {adjuster.fax && (
                                                            <div>
                                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Fax</p>
                                                                <p className="text-sm font-medium text-foreground">{adjuster.fax}</p>
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
                                                onClick={() => handleAddAdjuster(defendant)}
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
                ))}
            </div>

            <InstructionsBlock />

            <EditDefendantModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                defendant={selectedDefendant}
                casefileId={effectiveCasefileId}
                onUpdate={handleUpdate}
            />

            <AdjusterModal
                isOpen={isAdjusterModalOpen}
                onClose={() => {
                    setIsAdjusterModalOpen(false);
                    setEditingAdjuster(null);
                    setCurrentDefendant(null);
                }}
                onSubmit={handleAdjusterSubmit}
                initialData={editingAdjuster}
            />
        </div>
    );
}

function InstructionsBlock() {
    return (
        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl p-6 shadow-sm">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" /> Instructions
            </h4>
            <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 block" />
                    <span>Add all parties who may be at fault for the accident</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 block" />
                    <span>Assign liability percentages that total 100%</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 block" />
                    <span>Include adjuster contact information for each defendant</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 block" />
                    <span>Policyholder information is required if defendant is not the policyholder</span>
                </li>
                <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 block" />
                    <span>Liability percentages help determine settlement distribution</span>
                </li>
            </ul>
        </div>
    );
}
