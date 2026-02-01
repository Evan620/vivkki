"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CaseDetail } from "@/types";

interface CaseHeaderProps {
    caseDetail: CaseDetail;
}

export function CaseHeader({ caseDetail }: CaseHeaderProps) {
    return (
        <div className="flex flex-col gap-4 mb-6">
            <Link
                href="/cases"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Link>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        Case {caseDetail.caseNumber} - {caseDetail.name}
                    </h1>
                    <div className="text-sm text-muted-foreground">
                        {caseDetail.dateOfLoss}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Stage</span>
                        <span className="font-medium text-foreground">{caseDetail.stage}</span>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Status</span>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-green-500" />
                            <span className="font-medium text-foreground">{caseDetail.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
