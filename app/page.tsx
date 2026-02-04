import { DashboardClient } from "@/components/DashboardClient";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Fetch initial data server-side
  const { data: cases } = await supabase
    .from('casefiles')
    .select('id, status, stage, created_at, statute_deadline, days_until_statute');

  const { count: providerCount } = await supabase.from('medical_providers').select('*', { count: 'exact', head: true });
  const { data: settlements } = await supabase.from('settlements').select('gross_settlement');
  const { data: workLogs } = await supabase
    .from('work_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(5);

  return (
    <DashboardClient
      initialCases={cases || []}
      initialProviderCount={providerCount || 0}
      initialSettlements={settlements || []}
      initialWorkLogs={workLogs || []}
    />
  );
}
