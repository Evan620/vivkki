import { Calendar, Filter } from "lucide-react";

export function FilterBar() {
    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm">
            <div>
                <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                <p className="text-xs text-muted-foreground">Refine charts using live data filters</p>
            </div>

            <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors bg-background text-foreground">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    Last 6 months
                </button>

                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors bg-background text-foreground">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    Status: All
                </button>

                <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors bg-background text-foreground">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    Stages: All
                </button>
            </div>
        </div>
    );
}
