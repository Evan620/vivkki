"use client";

import { CaseDetail } from "@/types";
import { Clock, Users, Receipt, AlertCircle, FileText } from "lucide-react";

interface QuickStatsProps {
    caseDetail: CaseDetail;
}

export function QuickStats({ caseDetail }: QuickStatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Days Open
                </div>
                <div className="text-2xl font-bold text-foreground">
                    {caseDetail.daysOpen}
                    <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
                </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    Medical Providers
                </div>
                <div className="text-2xl font-bold text-foreground">
                    {caseDetail.medicalProvidersCount}
                    <span className="text-sm font-normal text-muted-foreground ml-1">providers</span>
                </div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Receipt className="w-3.5 h-3.5" />
                    Total Billed
                </div>
                <div className="text-2xl font-bold text-foreground">
                    ${caseDetail.totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">medical bills</div>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    Outstanding B&R
                </div>
                <div className="text-2xl font-bold text-foreground">
                    {caseDetail.outstandingRecords}
                    <span className="text-sm font-normal text-muted-foreground ml-1">records</span>
                </div>
            </div>

            <div className="col-span-2 md:col-span-4 bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-orange-500/10 p-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                    <div className="text-sm font-medium text-orange-800">Statute</div>
                    <div className="text-lg font-bold text-orange-900">
                        {caseDetail.statuteDaysLeft}d <span className="text-sm font-normal opacity-75">remaining</span>
                    </div>
                </div>
                <div className="ml-auto text-sm font-medium text-orange-800 bg-orange-500/10 px-3 py-1 rounded-full">
                    {caseDetail.statuteDate}
                </div>
            </div>
        </div>
    );
}
