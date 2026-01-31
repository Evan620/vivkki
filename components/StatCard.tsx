import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle: string;
    icon?: LucideIcon;
    alert?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, alert }: StatCardProps) {
    return (
        <div className={`p-6 rounded-xl border ${alert ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-card'} flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className={`text-sm font-medium ${alert ? 'text-destructive' : 'text-muted-foreground'}`}>{title}</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
                    </div>
                </div>
                {Icon && (
                    <div className={`p-2 rounded-lg ${alert ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{subtitle}</p>

            {/* Decorative gradient blob for "cool" effect */}
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
        </div>
    );
}
