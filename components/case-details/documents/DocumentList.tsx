"use client";

import { FileText, Download, ExternalLink } from "lucide-react";

interface Document {
    id: number;
    title: string;
    file_path: string;
    created_at: string;
    description?: string;
    type?: string;
}

interface DocumentListProps {
    documents: Document[];
}

export function DocumentList({ documents }: DocumentListProps) {
    if (!documents || documents.length === 0) {
        return (
            <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                <div className="flex justify-center mb-4">
                    <FileText className="h-12 w-12 text-muted-foreground/30" />
                </div>
                <p>No documents found for this case.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-emerald-100 dark:border-emerald-900">
                    <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-lg font-bold">Documents</h2>
                    </div>
                </div>
                <div className="divide-y divide-border">
                    {documents.map((doc) => (
                        <div key={doc.id} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{doc.title}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(doc.created_at).toLocaleDateString()} • {doc.type || 'Document'}
                                    </p>
                                    {doc.description && <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                                    <Download className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
