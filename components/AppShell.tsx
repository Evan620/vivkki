"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Hide sidebar on login page and any explicit auth routes
    const isAuthPage = pathname === "/login" || pathname === "/auth" || pathname?.startsWith("/auth/");

    if (isAuthPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen" suppressHydrationWarning>
            <Sidebar />
            <main className="flex-1 md:ml-64 transition-[margin]">
                {children}
            </main>
        </div>
    );
}
