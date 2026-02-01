"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
    "Overview",
    "Accident",
    "Clients",
    "Defendant",
    "Medical",
    "Insurance",
    "Case Notes",
    "Documents",
    "Work Log"
];

export function CaseTabs() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get("tab") || "Overview";

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl shadow-sm mb-6 overflow-hidden">
            <nav className="flex space-x-1 overflow-x-auto p-1" aria-label="Case Sections">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={cn(
                            "whitespace-nowrap py-3 px-4 font-medium text-sm transition-all rounded-lg",
                            activeTab === tab
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </nav>
        </div>
    );
}
