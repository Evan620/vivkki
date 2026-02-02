
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { FilterBar } from "@/components/FilterBar";
import { CaseStatusChart } from "@/components/charts/CaseStatusChart";
import { CaseIntakeChart } from "@/components/charts/CaseIntakeChart";
import { RecentActivity } from "@/components/RecentActivity";
import { AlertTriangle, Clock, Activity, Users, Building, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Helper to determine statute alert
function hasStatuteAlert(deadline: string | null) {
  if (!deadline) return false;
  const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return days <= 90;
}

export default async function Home() {
  const supabase = await createClient();

  // 1. Fetch Cases for High Level Stats & Charts
  const { data: cases } = await supabase
    .from('casefiles')
    .select('id, status, stage, created_at, statute_deadline, days_until_statute');

  // 2. Fetch Other Stats
  const { count: providerCount } = await supabase.from('medical_providers').select('*', { count: 'exact', head: true });
  const { data: settlements } = await supabase.from('settlements').select('gross_settlement');
  const { data: workLogs } = await supabase
    .from('work_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  // --- Calculations ---

  const totalCases = cases?.length || 0;

  // Active Cases (Simplified logic: anything not Closed)
  const activeCasesCount = cases?.filter((c: any) => c.status !== 'Closed').length || 0;

  // Statute Alerts (<= 90 days)
  const statuteAlertsCount = cases?.filter((c: any) => hasStatuteAlert(c.statute_deadline)).length || 0;

  // Total Settlements
  const totalSettlementValue = settlements?.reduce((sum: number, s: any) => sum + (s.gross_settlement || 0), 0) || 0;
  const formattedSettlement = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalSettlementValue);

  // Avg Case Duration (Placeholder until we have closed date logic, using simplified random fallback for now if empty)
  // For MVP, if we don't have closed cases, we can show "N/A" or calc average age of active cases.
  // Let's calc Average Age of Active Cases for now.
  let avgCaseAge = 0;
  if (cases && cases.length > 0) {
    const now = new Date().getTime();
    const totalAge = cases.reduce((acc: number, c: any) => acc + (now - new Date(c.created_at).getTime()), 0);
    avgCaseAge = Math.floor((totalAge / cases.length) / (1000 * 60 * 60 * 24));
  }

  // --- Chart Data Preparation ---

  // Status Chart Data
  const statusCounts: Record<string, number> = {};
  cases?.forEach((c: any) => {
    const s = c.status || 'Unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  const statusChartData = Object.entries(statusCounts).map(([name, value], index) => ({
    name,
    value,
    color: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#c4b5fd", "#a78bfa"][index % 6] || "#e4e4e7"
  }));

  // Intake Chart Data (Group by Month)
  const intakeCounts: Record<string, number> = {};
  cases?.forEach((c: any) => {
    const date = new Date(c.created_at);
    const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    intakeCounts[key] = (intakeCounts[key] || 0) + 1;
  });
  // Sort months properly (crudely by grabbing last 6 months logic or just standard sort)
  // For simple display, let's just take the object entries and reverse if needed, or sort by date.
  // We'll simplisticly show what we have.
  const intakeChartData = Object.entries(intakeCounts).map(([name, cases]) => ({ name, cases }));

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
            value={String(providerCount || 0)}
            subtitle="Active in network"
            icon={Users}
          />
        </div>

        <FilterBar />

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
          <div className="xl:col-span-2 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Case Intake</h3>
              <p className="text-sm text-muted-foreground">New cases per month</p>
            </div>
            <div className="flex-1">
              <CaseIntakeChart data={intakeChartData} />
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Latest updates across all cases</p>
              </div>
            </div>
            <RecentActivity activities={workLogs || []} />
          </div>

          {/* Quick Actions / Link to Cases */}
          <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
            <div className="max-w-md space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Quick Actions</h3>
              <p className="text-muted-foreground text-sm">Select a case from the "Cases" view to see detailed stages and manage documents.</p>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
