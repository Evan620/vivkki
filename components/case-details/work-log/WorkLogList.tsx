"use client";

import { Clock, User } from "lucide-react";
import { CaseDetail } from "@/types";

interface WorkLogListProps {
    logs: CaseDetail['recentActivity'];
}

export function WorkLogList({ logs }: WorkLogListProps) {
    if (!logs || logs.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                No work logs found.
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 border-b border-gray-100 dark:border-gray-900">
                    <div className="flex items-center gap-2">
                        <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-lg font-bold">Work Logs</h2>
                    </div>
                </div>
                <div className="divide-y divide-border">
                    {logs.map((log) => (
                        <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{log.author}</p>
                                        <p className="text-xs text-muted-foreground">{log.date}</p>
                                    </div>
                                </div>
                                <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full capitalize">
                                    {log.type.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed pl-10">
                                {log.content}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
