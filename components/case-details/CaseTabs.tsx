"use client";

import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

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

interface CaseTabsProps {
    isLoading?: boolean;
}

export function CaseTabs({ isLoading = false }: CaseTabsProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get("tab") || "Overview";

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl shadow-sm mb-6 overflow-hidden relative">
            {isLoading && (
                <div className="absolute top-0 right-0 p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary/60" />
                </div>
            )}
            <nav className="flex space-x-1 overflow-x-auto p-1" aria-label="Case Sections">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={cn(
                            "whitespace-nowrap py-3 px-4 font-medium text-sm transition-all duration-200 rounded-lg relative",
                            activeTab === tab
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        {tab}
                        {activeTab === tab && isLoading && (
                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary/30 rounded-full overflow-hidden">
                                <span className="block w-full h-full bg-primary animate-[loading_1s_ease-in-out_infinite]" />
                            </span>
                        )}
                    </button>
                ))}
            </nav>
        </div>
    );
}
