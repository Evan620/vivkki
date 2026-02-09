"use client";

import { CaseDetail } from "@/types";
import { Users, Shield, Receipt } from "lucide-react";

interface SummaryCardsProps {
    caseDetail: CaseDetail;
}

export function SummaryCards({ caseDetail }: SummaryCardsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Clients */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Clients</h3>
                    <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                    {caseDetail.clients.length}
                </div>
                <div className="text-sm text-foreground truncate">
                    {caseDetail.clients.map(c => c.name).join(", ")}
                </div>
            </div>

            {/* Defendants */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Defendants</h3>
                    <Shield className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                    {caseDetail.defendants.length}
                </div>
                <div className="text-sm text-foreground truncate" title={caseDetail.defendants[0]?.liability_percentage ? `${caseDetail.defendants[0].liability_percentage}% liability` : 'No liability info'}>
                    {caseDetail.defendants[0]?.liability_percentage ?? 'N/A'}% liability
                </div>
            </div>

            {/* Medical Bills */}
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Medical Bills</h3>
                    <Receipt className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                    ${caseDetail.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{caseDetail.medicalProvidersCount} providers</span>
                    <span className="text-destructive font-medium">Bal: ${caseDetail.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
        </div>
    );
}
