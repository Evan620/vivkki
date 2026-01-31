import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { FilterBar } from "@/components/FilterBar";
import { CaseStatusChart } from "@/components/charts/CaseStatusChart";
import { CaseIntakeChart } from "@/components/charts/CaseIntakeChart";
import { RecentActivity } from "@/components/RecentActivity";
import { AlertTriangle, Clock, Activity, Users, Building, AlertCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 transition-[margin]">
        <Header />

        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">

          {/* Top Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <StatCard
              title="Statute Alerts"
              value="5"
              subtitle="Cases approaching deadline (≤90 days) or expired"
              icon={AlertTriangle}
              alert={true}
            />
            <StatCard
              title="Active Cases"
              value="70"
              subtitle="Cases in progress"
              icon={Activity}
            />
            <StatCard
              title="Total Settlements"
              value="$15,000"
              subtitle="Year to date"
              icon={Building} // Placeholder icon
            />
            <StatCard
              title="Avg. Case Duration"
              value="60 days"
              subtitle="From intake to settlement"
              icon={Clock}
            />
            <StatCard
              title="Medical Providers"
              value="528"
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
                <p className="text-sm text-muted-foreground">Click a segment to filter by status</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <CaseStatusChart />
              </div>
            </div>

            {/* Case Intake */}
            <div className="xl:col-span-2 p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Case Intake</h3>
                <p className="text-sm text-muted-foreground">New cases per month</p>
              </div>
              <div className="flex-1">
                <CaseIntakeChart />
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
              <RecentActivity />
            </div>

            {/* Placeholder for "Case Stages" or other content to balance layout if needed, 
                 but matching the prompt's focus on "Recent Activity" being prominent */}
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
      </main>
    </div>
  );
}
