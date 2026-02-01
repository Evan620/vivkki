"use client";

import { CaseDetail } from "@/types";
import { User } from "lucide-react";

interface CaseInfoSidebarProps {
    caseDetail: CaseDetail;
}

export function CaseInfoSidebar({ caseDetail }: CaseInfoSidebarProps) {
    return (
        <div className="space-y-6">
            <button className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                View Client Information
            </button>

            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">Case Status</h3>

                <div className="space-y-4">
                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Social Security Number</div>
                        <div className="font-mono text-foreground text-sm">{caseDetail.ssn}</div>
                    </div>

                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Stage</div>
                        <div className="font-medium text-foreground">{caseDetail.stage}</div>
                    </div>

                    <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Status</div>
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                            {caseDetail.status}
                        </div>
                    </div>

                    <div className="pt-2 border-t border-border space-y-3">
                        <div>
                            <div className="text-xs text-muted-foreground mb-0.5">Date of Loss:</div>
                            <div className="text-sm font-medium text-foreground">{caseDetail.dateOfLoss}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-0.5">Created:</div>
                            <div className="text-sm text-foreground">{caseDetail.createdDate}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground mb-0.5">Updated:</div>
                            <div className="text-sm text-foreground">{caseDetail.updatedDate}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
