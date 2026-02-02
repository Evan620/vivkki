
import { Header } from "@/components/Header";
import { ProvidersTable } from "@/components/ProvidersTable";
import { createClient } from "@/lib/supabase/server";
import { MedicalProvider } from "@/types";

// Revalidate every minute
export const revalidate = 60;

async function fetchProviders() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('medical_providers')
        .select('*')
        .order('name', { ascending: true });

    if (error) {
        console.error("Error fetching providers:", error);
        return [];
    }

    // Normalize data if necessary (e.g. phone/phone_1 mapping as per legacy)
    return (data || []).map((p: any) => ({
        ...p,
        phone: p.phone || p.phone_1,
        fax: p.fax || p.fax_1,
        email: p.email || p.email_1,
    })) as MedicalProvider[];
}

export default async function ProvidersPage() {
    const providers = await fetchProviders();

    return (
        <>
            <Header pageName="Medical Providers" />
            <div className="p-6 max-w-[1600px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Medical Providers</h1>
                    <p className="text-muted-foreground mt-2">Manage your medical provider network</p>
                </div>
                <ProvidersTable initialProviders={providers} />
            </div>
        </>
    );
}
