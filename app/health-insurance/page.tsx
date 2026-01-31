import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { HealthInsuranceTable } from "@/components/HealthInsuranceTable";

export default function HealthInsurancePage() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 transition-[margin]">
                <Header pageName="Health Insurance" />
                <div className="p-6 max-w-[1600px] mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Health Insurance</h1>
                        <p className="text-muted-foreground mt-2">Manage health insurance companies</p>
                    </div>
                    <HealthInsuranceTable />
                </div>
            </main>
        </div>
    );
}
