"use client";

import { CaseDetail } from "@/types";
import { Edit2 } from "lucide-react";

interface SettlementManagementProps {
    caseDetail: CaseDetail;
}

export function SettlementManagement({ caseDetail }: SettlementManagementProps) {
    const { settlement } = caseDetail;
    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Settlement Management</h3>
                <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</span>
                    <span className="font-medium text-foreground bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-md text-sm">
                        {settlement.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Gross Settlement:</div>
                    <div className="text-xl font-bold text-foreground">
                        ${settlement.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Attorney Fee (33.33%):</div>
                    <div className="text-xl font-bold text-foreground">
                        ${settlement.attorneyFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Case Expenses:</div>
                    <div className="text-xl font-bold text-foreground">
                        ${settlement.caseExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Medical Liens:</div>
                    <div className="text-xl font-bold text-foreground">
                        ${settlement.medicalLiens.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div>
                    <div className="text-sm font-medium text-green-600 mb-1">Client Net:</div>
                    <div className="text-xl font-bold text-green-600">
                        ${settlement.clientNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="text-sm text-muted-foreground">
                    Settlement Date: <span className="font-medium text-foreground">{settlement.date}</span>
                </div>
                <button className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors">
                    <Edit2 className="w-4 h-4" />
                    Click edit to add settlement information
                </button>
            </div>
        </div>
    );
}
