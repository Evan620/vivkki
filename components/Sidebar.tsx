"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderOpen, Users, Car, Shield, Settings, Menu, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const menuItems = [
        { name: "Dashboard", href: "/", icon: LayoutDashboard },
        { name: "Cases", href: "/cases", icon: FolderOpen },
        { name: "Medical Providers", href: "/providers", icon: Users },
        { name: "Auto Insurance", href: "/auto-insurance", icon: Car },
        { name: "Health Insurance", href: "/health-insurance", icon: Shield },
    ];

    return (
        <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-sm h-screen fixed left-0 top-0 z-40 hidden md:flex flex-col">
            <div className="p-6 border-b border-border">
                <h1 className="text-xl font-bold tracking-tight">
                    Vikki <span className="text-muted-foreground font-light">Legal</span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Case Management</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    );
                })}

                <div className="pt-4 mt-4 border-t border-border">
                    <Link
                        href="/settings"
                        className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${pathname === "/settings"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        Settings
                    </Link>
                </div>
            </nav>

            <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {user?.email?.substring(0, 2).toUpperCase() || "AD"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.email || "admin@injuryok.com"}</p>
                        <p className="text-xs text-muted-foreground truncate">Admin</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
