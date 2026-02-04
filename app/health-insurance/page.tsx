
import { Header } from "@/components/Header";
import { HealthInsuranceTable } from "@/components/HealthInsuranceTable";
import { createClient } from "@/lib/supabase/server";

// Revalidate every minute
export const revalidate = 60;

async function fetchHealthInsurance() {
    const supabase = await createClient();

    // Fetch insurance companies
    const { data: insuranceData, error: insuranceError } = await supabase
        .from('health_insurance')
        .select('*')
        .order('name', { ascending: true });

    if (insuranceError) {
        console.error("Error fetching health insurance:", insuranceError);
        return [];
    }

    if (!insuranceData || insuranceData.length === 0) {
        return [];
    }

    // Fetch adjuster counts for each insurance company
    const { data: adjusterCounts, error: adjusterError } = await supabase
        .from('health_adjusters')
        .select('health_insurance_id');

    if (adjusterError) {
        console.error("Error fetching adjuster counts:", adjusterError);
    }

    // Count adjusters per insurance company
    const adjusterCountMap = new Map<number, number>();
    if (adjusterCounts) {
        adjusterCounts.forEach((adj: any) => {
            if (adj.health_insurance_id) {
                const count = adjusterCountMap.get(adj.health_insurance_id) || 0;
                adjusterCountMap.set(adj.health_insurance_id, count + 1);
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

export default async function HealthInsurancePage() {
    const insuranceData = await fetchHealthInsurance();

    return (
        <>
            <Header pageName="Health Insurance" />
            <div className="p-6 max-w-[1600px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Health Insurance</h1>
                    <p className="text-muted-foreground mt-2">Manage health insurance companies</p>
                </div>
                <HealthInsuranceTable initialInsurance={insuranceData} />
            </div>
        </>
    );
}
