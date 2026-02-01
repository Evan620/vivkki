"use client";

import { CaseDetail } from "@/types";
import { FileText, Info, CheckCircle2, Circle } from "lucide-react";

interface RecentActivityProps {
    caseDetail: CaseDetail;
}

export function RecentActivity({ caseDetail }: RecentActivityProps) {
    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Recent Activity</h3>
                <button className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                    View All →
                </button>
            </div>
            <div className="divide-y divide-border">
                {caseDetail.recentActivity.map((activity) => (
                    <div key={activity.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex gap-3">
                            <div className="mt-0.5">
                                {activity.type === 'note' && <FileText className="w-4 h-4 text-blue-500" />}
                                {activity.type === 'info_update' && <Info className="w-4 h-4 text-muted-foreground" />}
                                {activity.type === 'status_change' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-foreground mb-1 line-clamp-2">{activity.content}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{activity.date}</span>
                                    <span>•</span>
                                    <span className="font-medium">{activity.author}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
