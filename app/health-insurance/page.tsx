
import { Header } from "@/components/Header";
import { HealthInsuranceTable } from "@/components/HealthInsuranceTable";
import { createClient } from "@/lib/supabase/server";

// Revalidate every minute
export const revalidate = 60;

async function fetchHealthInsurance() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('health_insurance')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching health insurance:", error);
        return [];
    }

    return data || [];
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
