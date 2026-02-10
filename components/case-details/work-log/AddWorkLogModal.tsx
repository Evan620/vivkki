"use client";

import { useState, useEffect } from "react";
import { X, Save, Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface WorkLog {
    id: string;
    content: string;
    author: string;
    date: string;
    type: string;
}

interface AddWorkLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    casefileId: string;
    workLog?: WorkLog | null;
    onUpdate: () => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function AddWorkLogModal({
    isOpen,
    onClose,
    casefileId,
    workLog,
    onUpdate,
    onShowToast
}: AddWorkLogModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        user_name: "",
        log_type: "note"
    });

    useEffect(() => {
        if (isOpen) {
            if (workLog) {
                setFormData({
                    description: workLog.content,
                    user_name: workLog.author,
                    log_type: workLog.type
                });
            } else {
                setFormData({
                    description: "",
                    user_name: "",
                    log_type: "note"
                });
            }
        }
    }, [isOpen, workLog]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                casefile_id: casefileId,
                description: formData.description,
                user_name: formData.user_name || "System",
                timestamp: new Date().toISOString()
            };

            let error;
            if (workLog) {
                const { error: updateError } = await supabase
                    .from('work_logs')
                    .update(payload)
                    .eq('id', workLog.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('work_logs')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            if (onShowToast) onShowToast(workLog ? 'Work log updated' : 'Work log added', 'success');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error saving work log:', error);
            if (onShowToast) onShowToast(error.message || 'Failed to save', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground">
                        {workLog ? 'Edit Work Log' : 'Add Work Log'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Description *
                        </label>
                        <textarea
                            required
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                            placeholder="Enter work log details..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Author Name
                        </label>
                        <input
                            type="text"
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Your name (optional)"
                            value={formData.user_name}
                            onChange={e => setFormData({ ...formData, user_name: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.description.trim()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : workLog ? 'Update' : 'Add Log'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
