import { Search, Bell, Plus, RefreshCw } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";

interface HeaderProps {
    pageName?: string;
}

export function Header({ pageName = "Dashboard" }: HeaderProps) {
    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Home</span>
                <span>/</span>
                <span>{pageName}</span>
            </div>

            <div className="flex items-center gap-4">
                {/* Actions from screenshot: Refresh, Generate SOU, New Case, Statute Alerts */}
                <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>

                <button className="hidden sm:flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium px-4 py-2 rounded-md transition-colors">
                    Generate SOU
                </button>

                <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-md transition-colors">
                    <Plus className="w-4 h-4" />
                    New Case
                </button>

                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
                </button>
                <div className="border-l border-border h-6 mx-2" />
                <ModeToggle />
            </div>
        </header>
    );
}
