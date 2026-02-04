"use client"

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { FilterBar } from "@/components/FilterBar";
import { CaseStatusChart } from "@/components/charts/CaseStatusChart";
import { CaseStagesChart } from "@/components/charts/CaseStagesChart";
import { CaseIntakeChart } from "@/components/charts/CaseIntakeChart";
import { RecentActivity } from "@/components/RecentActivity";
import { AlertTriangle, Clock, Activity, Users, Building } from "lucide-react";
import { CASE_STAGES, getAllStatuses } from "@/lib/constants/caseStages";

// Helper to determine statute alert
function hasStatuteAlert(deadline: string | null) {
    if (!deadline) return false;
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days <= 90;
}

interface DashboardClientProps {
    initialCases: any[];
    initialProviderCount: number;
    initialSettlements: any[];
    initialWorkLogs: any[];
}

export function DashboardClient({
    initialCases,
    initialProviderCount,
    initialSettlements,
    initialWorkLogs
}: DashboardClientProps) {
    const [cases, setCases] = useState(initialCases);
    const [workLogs, setWorkLogs] = useState(initialWorkLogs);
    const [dateRangeMonths, setDateRangeMonths] = useState(6);
    const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({});
    const [stageFilter, setStageFilter] = useState<Record<string, boolean>>({});

    // Initialize filters
    useEffect(() => {
        const allStatuses = getAllStatuses();
        if (Object.keys(statusFilter).length === 0) {
            const init: Record<string, boolean> = {};
            allStatuses.forEach(st => { init[st] = true; });
            setStatusFilter(init);
        }

        if (Object.keys(stageFilter).length === 0) {
            const init: Record<string, boolean> = {};
            CASE_STAGES.forEach(st => { init[st] = true; });
            setStageFilter(init);
        }
    }, []);

    // Calculate filtered data and chart data
    const {
        totalCases,
        activeCasesCount,
        statuteAlertsCount,
        avgCaseAge,
        statusChartData,
        stageChartData,
        intakeChartData
    } = useCalculatedData(cases, dateRangeMonths, statusFilter, stageFilter);

    // Calculate settlements
    const totalSettlementValue = initialSettlements?.reduce((sum: number, s: any) => sum + (s.gross_settlement || 0), 0) || 0;
    const formattedSettlement = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalSettlementValue);

    return (
        <>
            <Header />

            <div className="p-6 space-y-8 max-w-[1600px] mx-auto">

                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <StatCard
                        title="Statute Alerts"
                        value={String(statuteAlertsCount)}
                        subtitle="Cases approaching deadline (≤90 days)"
                        icon={AlertTriangle}
                        alert={statuteAlertsCount > 0}
                    />
                    <StatCard
                        title="Active Cases"
                        value={String(activeCasesCount)}
                        subtitle="Cases in progress"
                        icon={Activity}
                    />
                    <StatCard
                        title="Total Settlements"
                        value={formattedSettlement}
                        subtitle="Year to date"
                        icon={Building}
                    />
                    <StatCard
                        title="Avg. Case Age"
                        value={`${avgCaseAge} days`}
                        subtitle="Average time since intake"
                        icon={Clock}
                    />
                    <StatCard
                        title="Medical Providers"
                        value={String(initialProviderCount || 0)}
                        subtitle="Active in network"
                        icon={Users}
                    />
                </div>

                <div className="relative z-50">
                    <FilterBar
                        dateRangeMonths={dateRangeMonths}
                        onDateRangeChange={setDateRangeMonths}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        stageFilter={stageFilter}
                        onStageFilterChange={setStageFilter}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Case Status */}
                    <div className="xl:col-span-1 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-foreground">Case Status</h3>
                            <p className="text-sm text-muted-foreground">Distribution by status</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <CaseStatusChart data={statusChartData} />
                        </div>
                    </div>

                    {/* Case Intake */}
                    <div className="xl:col-span-1 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-foreground">Case Intake</h3>
                            <p className="text-sm text-muted-foreground">New cases per month</p>
                        </div>
                        <div className="flex-1">
                            <CaseIntakeChart data={intakeChartData} />
                        </div>
                    </div>

                    {/* Case Stages */}
                    <div className="xl:col-span-1 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-foreground">Case Stages</h3>
                            <p className="text-sm text-muted-foreground">Distribution by stage</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <CaseStagesChart data={stageChartData} />
                        </div>
                    </div>
                </div>

                {/* Recent Activity - Full Width */}
                <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                        <p className="text-sm text-muted-foreground">Latest updates across all cases</p>
                    </div>
                    <RecentActivity activities={workLogs || []} />
                </div>

            </div>
        </>
    );
}

// Hook to calculate filtered data
function useCalculatedData(
    cases: any[],
    dateRangeMonths: number,
    statusFilter: Record<string, boolean>,
    stageFilter: Record<string, boolean>
) {
    const totalCases = cases?.length || 0;

    // Active Cases (not closed in stage or status - matches legacy logic)
    const activeCasesCount = cases?.filter((c: any) => {
        const stage = (c.stage || '').trim();
        const status = (c.status || '').trim();
        return stage !== 'Closed' && status !== 'Closed';
    }).length || 0;

    // Statute Alerts (≤ 90 days)
    const statuteAlertsCount = cases?.filter((c: any) => hasStatuteAlert(c.statute_deadline)).length || 0;

    // Avg Case Age
    let avgCaseAge = 0;
    if (cases && cases.length > 0) {
        const now = new Date().getTime();
        const totalAge = cases.reduce((acc: number, c: any) => acc + (now - new Date(c.created_at).getTime()), 0);
        avgCaseAge = Math.floor((totalAge / cases.length) / (1000 * 60 * 60 * 24));
    }

    // Apply filters
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - dateRangeMonths);
    const filtered = (cases || []).filter(c => {
        const created = c.created_at ? new Date(c.created_at) : null;
        if (created && created < cutoff) return false;
        const st = (c.stage || '').trim();
        if (st && stageFilter && Object.keys(stageFilter).length > 0 && stageFilter[st] === false) return false;
        const status = (c.status || '').trim();
        if (status && statusFilter && Object.keys(statusFilter).length > 0 && statusFilter[status] === false) return false;
        return true;
    });

    // Status Chart Data
    const statusCounts: Record<string, number> = {};
    filtered.forEach((c: any) => {
        const s = c.status || 'Unknown';
        statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const statusChartData = Object.entries(statusCounts).map(([name, value], index) => ({
        name,
        value,
        color: ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#f43f5e", "#06b6d4", "#ec4899", "#14b8a6"][index % 8] || "#e4e4e7"
    }));

    // Stage Chart Data
    const stageCounts: Record<string, number> = {};
    filtered.forEach((c: any) => {
        const stage = (c.stage || '').trim();
        if (stage) {
            stageCounts[stage] = (stageCounts[stage] || 0) + 1;
        }
    });
    const stageChartData = Object.entries(stageCounts).map(([name, value], index) => ({
        name,
        value,
        color: ["#8b5cf6", "#eab308", "#ef4444", "#14b8a6", "#2563eb", "#f59e0b"][index % 6] || "#e4e4e7"
    }));

    // Intake Chart Data (Group by Month)
    const intakeCounts: Record<string, number> = {};
    const now = new Date();
    for (let i = dateRangeMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        intakeCounts[key] = 0;
    }
    filtered.forEach((c: any) => {
        if (!c.created_at) return;
        const d = new Date(c.created_at);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (intakeCounts[key] !== undefined) intakeCounts[key]++;
    });
    const intakeChartData = Object.entries(intakeCounts).map(([name, cases]) => ({ name, cases }));

    return {
        totalCases,
        activeCasesCount,
        statuteAlertsCount,
        avgCaseAge,
        statusChartData,
        stageChartData,
        intakeChartData
    };
}
