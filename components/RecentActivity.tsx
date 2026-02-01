import { FileText, Phone, Mail, User, Activity } from "lucide-react";
import { formatDistanceToNow, parseISO } from 'date-fns';

export interface ActivityItem {
    id: number | string;
    text: string;
    date: string;
    icon: any; // Lucide icon
}

interface RecentActivityProps {
    activities: {
        id: number | string;
        description: string;
        created_at: string;
        action_type?: string;
    }[];
}

export function RecentActivity({ activities }: RecentActivityProps) {

    const getIcon = (actionType: string | undefined) => {
        switch (actionType?.toLowerCase()) {
            case 'call': return Phone;
            case 'email': return Mail;
            case 'user': return User;
            case 'document': return FileText;
            default: return Activity;
        }
    };

    const formattedActivities = activities.map(act => ({
        id: act.id,
        text: act.description,
        date: act.created_at ? formatDistanceToNow(parseISO(act.created_at), { addSuffix: true }) : 'Unknown date',
        icon: getIcon(act.action_type)
    }));

    if (formattedActivities.length === 0) {
        return <div className="text-muted-foreground text-sm">No recent activity.</div>;
    }

    return (
        <div className="space-y-6">
            {formattedActivities.map((activity, index) => (
                <div key={activity.id} className="relative pl-6 pb-6 last:pb-0 group">
                    {/* Timeline Line */}
                    {index !== formattedActivities.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-0 w-px bg-border group-hover:bg-primary/50 transition-colors" />
                    )}

                    {/* Dot */}
                    <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-card border border-border flex items-center justify-center group-hover:border-primary transition-colors z-10">
                        <activity.icon className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                    </div>

                    <div className="flex flex-col gap-1">
                        <p className="text-sm text-foreground">{activity.text}</p>
                        <span className="text-xs text-muted-foreground font-mono">{activity.date}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
