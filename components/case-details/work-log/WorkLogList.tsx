"use client";

import { Clock, User, Plus, Edit, Trash2 } from "lucide-react";
import { CaseDetail } from "@/types";
import { useState } from "react";
import { AddWorkLogModal } from "./AddWorkLogModal";
import { supabase } from "@/lib/supabaseClient";

interface WorkLogListProps {
    logs: CaseDetail['recentActivity'];
    casefileId: string;
    onUpdate?: () => void;
}

export function WorkLogList({ logs, casefileId, onUpdate }: WorkLogListProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<CaseDetail['recentActivity'][0] | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleShowToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleUpdate = () => {
        if (onUpdate) onUpdate();
    };

    const handleDelete = async (logId: string) => {
        if (!confirm('Are you sure you want to delete this work log?')) return;

        try {
            const { error } = await supabase
                .from('work_logs')
                .delete()
                .eq('id', logId);

            if (error) throw error;
            handleShowToast('Work log deleted', 'success');
            handleUpdate();
        } catch (error: any) {
            console.error('Error deleting work log:', error);
            handleShowToast(error.message || 'Failed to delete', 'error');
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
                    toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                    {toast.message}
                </div>
            )}

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <h2 className="text-lg font-bold">Work Logs</h2>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Log
                    </button>
                </div>

                {!logs || logs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        No work logs found. Click "Add Log" to create one.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors group">
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
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingLog(log)}
                                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(log.id)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full capitalize">
                                            {log.type.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed pl-10">
                                    {log.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AddWorkLogModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                casefileId={casefileId}
                onUpdate={handleUpdate}
                onShowToast={handleShowToast}
            />

            <AddWorkLogModal
                isOpen={!!editingLog}
                onClose={() => setEditingLog(null)}
                casefileId={casefileId}
                workLog={editingLog}
                onUpdate={handleUpdate}
                onShowToast={handleShowToast}
            />
        </div>
    );
}
