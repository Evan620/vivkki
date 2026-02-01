import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { InsuranceTable } from "@/components/InsuranceTable";
import { createClient } from "@/lib/supabase/server";

// Revalidate every minute
export const revalidate = 60;

async function fetchAutoInsurance() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('auto_insurance')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching auto insurance:", error);
        return [];
    }

    return data || [];
}

export default async function AutoInsurancePage() {
    const insuranceData = await fetchAutoInsurance();

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 transition-[margin]">
                <Header pageName="Auto Insurance" />
                <div className="p-6 max-w-[1600px] mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Auto Insurance</h1>
                        <p className="text-muted-foreground mt-2">Manage auto insurance companies</p>
                    </div>
                    <InsuranceTable initialInsurance={insuranceData} />
                </div>
            </main>
        </div>
    );
}
