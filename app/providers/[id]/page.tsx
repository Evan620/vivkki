import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MedicalProviderDetails from "@/components/providers/MedicalProviderDetails";

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

// Revalidate data every minute
export const revalidate = 60;

async function getProvider(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('medical_providers')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return null;
    }

    return data;
}

export default async function MedicalProviderPage({ params }: PageProps) {
    const { id } = await params;
    const provider = await getProvider(id);

    if (!provider) {
        redirect('/providers');
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 md:ml-64 transition-[margin]">
                <Header pageName="Provider Details" />
                <div className="p-6">
                    <MedicalProviderDetails initialProvider={provider} />
                </div>
            </main>
        </div>
    );
}
