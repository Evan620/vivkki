
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HealthInsuranceDetails from "@/components/health-insurance/HealthInsuranceDetails";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        edit?: string;
    }>;
}

// Revalidate data every minute
export const revalidate = 60;

async function getHealthInsurance(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('health_insurance')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

async function getAdjusters(insuranceId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('health_adjusters')
        .select('*')
        .eq('health_insurance_id', insuranceId)
        .order('last_name', { ascending: true });

    if (error) {
        return [];
    }

    return data;
}

export default async function HealthInsuranceDetailsPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { edit } = await searchParams;
    const insurance = await getHealthInsurance(id);

    if (!insurance) {
        redirect('/health-insurance');
    }

    const adjusters = await getAdjusters(id);

    return (
        <>
            <Header pageName="Provider Details" />
            <div className="p-6 max-w-[1600px] mx-auto">
                <HealthInsuranceDetails
                    initialData={insurance}
                    initialAdjusters={adjusters}
                    initialEditMode={edit === 'true'}
                />
            </div>
        </>
    );
}
