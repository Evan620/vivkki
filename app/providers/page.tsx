import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ProvidersTable } from "@/components/ProvidersTable";

export default function ProvidersPage() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 transition-[margin]">
                <Header pageName="Medical Providers" />
                <div className="p-6 max-w-[1600px] mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Medical Providers</h1>
                        <p className="text-muted-foreground mt-2">Manage your medical provider network</p>
                    </div>
                    <ProvidersTable />
                </div>
            </main>
        </div>
    );
}
