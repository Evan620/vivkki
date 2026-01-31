import { FileText, Phone, Mail, User } from "lucide-react";

const activities = [
    {
        id: 1,
        text: "Case note added: Client called for an update. Sent Jim an email. -DS",
        date: "Jan 31, 12:08 AM",
        icon: Phone,
    },
    {
        id: 2,
        text: "Case note added: Uploaded BCBS Letter to case file. - DS",
        date: "Jan 30, 07:24 PM",
        icon: FileText,
    },
    {
        id: 3,
        text: "First party claim information updated",
        date: "Jan 30, 07:18 PM",
        icon: User,
    },
    {
        id: 4,
        text: "Case note added: Saved new adjuster info and updated case. - DS",
        date: "Jan 30, 07:15 PM",
        icon: User,
    },
    {
        id: 5,
        text: 'Stage/status automatically updated to "Processing - Treating" after generating 1st Party Letter of Representation',
        date: "Jan 30, 08:11 AM",
        icon: FileText,
    },
];

export function RecentActivity() {
    return (
        <div className="space-y-6">
            {activities.map((activity, index) => (
                <div key={activity.id} className="relative pl-6 pb-6 last:pb-0 group">
                    {/* Timeline Line */}
                    {index !== activities.length - 1 && (
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
