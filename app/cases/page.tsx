
import { Header } from "@/components/Header";
import { CasesTable } from "@/components/CasesTable";

export default function CasesPage() {
    return (
        <>
            <Header pageName="Cases" />
            <div className="p-6 max-w-[1600px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Cases</h1>
                    <p className="text-muted-foreground mt-2">Manage and track all ongoing legal cases.</p>
                </div>
                <CasesTable />
            </div>
        </>
    );
}
