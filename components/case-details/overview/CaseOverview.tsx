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
    medicalBills?: any[];
}

export function CaseOverview({ caseDetail, medicalBills = [] }: CaseOverviewProps) {
    // Extract clients and defendants from caseDetail
    const clients = caseDetail.clients?.map(c => ({
        id: parseInt(c.id),
        first_name: c.name?.split(' ')[0] || '',
        last_name: c.name?.split(' ').slice(1).join(' ') || '',
        firstName: c.name?.split(' ')[0] || '',
        lastName: c.name?.split(' ').slice(1).join(' ') || '',
        is_driver: c.role === 'Driver',
        isDriver: c.role === 'Driver',
    })) || [];

    const defendants = caseDetail.defendants?.map(d => ({
        id: parseInt(d.id),
        first_name: d.name?.split(' ')[0] || '',
        last_name: d.name?.split(' ').slice(1).join(' ') || '',
        firstName: d.name?.split(' ')[0] || '',
        lastName: d.name?.split(' ').slice(1).join(' ') || '',
    })) || [];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-1">
                <CaseInfoSidebar caseDetail={caseDetail} />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
                <QuickActions 
                    casefileId={parseInt(caseDetail.id)}
                    clients={clients}
                    defendants={defendants}
                    medicalBills={medicalBills}
                />

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
