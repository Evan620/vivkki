"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { FirstPartyClaimTab } from "./FirstPartyClaimTab";
import { ThirdPartyClaimTab } from "./ThirdPartyClaimTab";
import { FirstPartyClaim, ThirdPartyClaim, Client, CaseDetail } from "@/types";

interface InsuranceDetailsProps {
    firstPartyClaims: FirstPartyClaim[];
    thirdPartyClaims: ThirdPartyClaim[];
    clients: Client[];
    defendants: CaseDetail['defendants']; // Using type from CaseDetail which has basic info needed for mapping
}

type SubTab = 'first-party' | 'third-party';

export function InsuranceDetails({
    firstPartyClaims,
    thirdPartyClaims,
    clients,
    defendants
}: InsuranceDetailsProps) {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('first-party');

    // Map CaseDetail defendants (id, name, liability) to format needed for ThirdPartyClaimTab (first_name, last_name)
    // Since CaseDetail only gives combined name, we might need to parse it or just pass it through if child component is flexible.
    // However, fetchCaseDetail maps defendants to { id, name, liability }.
    // ThirdPartyClaimTab expects { id, first_name, last_name }.
    // We should probably enhance fetchCaseDetail to provide first/last name or map it here.
    const mappedDefendants = defendants.map(d => {
        return {
            id: parseInt(d.id),
            first_name: d.first_name,
            last_name: d.last_name,
            liability_percentage: d.liability_percentage || 0
        };
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-b border-blue-100 dark:border-blue-900">
                    <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-lg font-bold">Insurance Claims</h2>
                    </div>
                    <nav className="flex gap-4">
                        <button
                            onClick={() => setActiveSubTab('first-party')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeSubTab === 'first-party'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-background text-muted-foreground hover:bg-muted border border-border'
                                }`}
                        >
                            First Party
                        </button>
                        <button
                            onClick={() => setActiveSubTab('third-party')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeSubTab === 'third-party'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-background text-muted-foreground hover:bg-muted border border-border'
                                }`}
                        >
                            Third Party
                        </button>
                    </nav>
                </div>
            </div>

            {activeSubTab === 'first-party' && (
                <FirstPartyClaimTab
                    firstPartyClaims={firstPartyClaims}
                    // Map generic client from props to specific shape if needed, 
                    // dependent on how 'clients' are passed from parent page
                    clients={clients}
                />
            )}

            {activeSubTab === 'third-party' && (
                <ThirdPartyClaimTab
                    thirdPartyClaims={thirdPartyClaims}
                    defendants={mappedDefendants}
                />
            )}
        </div>
    );
}
