
import { Header } from "@/components/Header";
import { InsuranceTable } from "@/components/InsuranceTable";
import { createClient } from "@/lib/supabase/server";

// Revalidate every minute
export const revalidate = 60;

async function fetchAutoInsurance() {
    const supabase = await createClient();

    // Fetch insurance companies
    const { data: insuranceData, error: insuranceError } = await supabase
        .from('auto_insurance')
        .select('*')
        .order('name', { ascending: true });

    if (insuranceError) {
        console.error("Error fetching auto insurance:", insuranceError);
        return [];
    }

    if (!insuranceData || insuranceData.length === 0) {
        return [];
    }

    // Fetch adjuster counts for each insurance company
    const { data: adjusterCounts, error: adjusterError } = await supabase
        .from('auto_adjusters')
        .select('auto_insurance_id')
        .eq('is_archived', false);

    if (adjusterError) {
        console.error("Error fetching adjuster counts:", adjusterError);
    }

    // Count adjusters per insurance company
    const adjusterCountMap = new Map<number, number>();
    if (adjusterCounts) {
        adjusterCounts.forEach((adj: any) => {
            if (adj.auto_insurance_id) {
                const count = adjusterCountMap.get(adj.auto_insurance_id) || 0;
                adjusterCountMap.set(adj.auto_insurance_id, count + 1);
            }
        });
    }

    // Add adjuster count to each insurance company
    const insuranceWithAdjusters = insuranceData.map(insurance => ({
        ...insurance,
        adjusters: adjusterCountMap.get(insurance.id) || 0
    }));

    return insuranceWithAdjusters;
}

export default async function AutoInsurancePage() {
    const insuranceData = await fetchAutoInsurance();

    return (
        <>
            <Header pageName="Auto Insurance" />
            <div className="p-6 max-w-[1600px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Auto Insurance</h1>
                    <p className="text-muted-foreground mt-2">Manage auto insurance companies</p>
                </div>
                <InsuranceTable initialInsurance={insuranceData} />
            </div>
        </>
    );
}
