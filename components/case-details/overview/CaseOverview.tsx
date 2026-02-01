"use client";

import { CaseDetail } from "@/types";
import { CaseInfoSidebar } from "./CaseInfoSidebar";
import { QuickStats } from "./QuickStats";
import { QuickActions } from "./QuickActions";
import { SummaryCards } from "./SummaryCards";
import { RecentActivity } from "./RecentActivity";
import { SettlementManagement } from "./SettlementManagement";

interface CaseOverviewProps {
    caseDetail: CaseDetail;
}

export function CaseOverview({ caseDetail }: CaseOverviewProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
                <CaseInfoSidebar caseDetail={caseDetail} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
                <QuickActions />

                <section>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h3>
                    <QuickStats caseDetail={caseDetail} />
                </section>

                <SummaryCards caseDetail={caseDetail} />

                <RecentActivity caseDetail={caseDetail} />

                <SettlementManagement caseDetail={caseDetail} />
            </div>
        </div>
    );
}
