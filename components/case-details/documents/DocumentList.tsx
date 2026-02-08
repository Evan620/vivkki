"use client";

import { FileText, Download, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Document {
    id: number;
    title: string;
    file_path: string;
    storage_path: string;
    created_at: string;
    description?: string;
    type?: string;
}

interface DocumentListProps {
    documents: Document[];
    casefileId: string;
    onUpdate?: () => void;
}

export function DocumentList({ documents, casefileId, onUpdate }: DocumentListProps) {
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleShowToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleDownload = async (doc: Document) => {
        try {
            const { data, error } = await supabase.storage
                .from('case-documents')
                .createSignedUrl(doc.storage_path || doc.file_path, 60);

            if (error) throw error;

            // Open the signed URL in a new tab
            window.open(data.signedUrl, '_blank');
        } catch (error: any) {
            console.error('Error downloading document:', error);
            handleShowToast('Failed to download document', 'error');
        }
    };

    const handleExternalLink = (doc: Document) => {
        // Copy the storage path or open in new tab
        const url = `${window.location.origin}/storage/documents/${doc.storage_path || doc.file_path}`;
        window.open(url, '_blank');
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Create unique file path
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${casefileId}/${fileName}`;

            // Upload file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('case-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Create document record in database
            const { error: dbError } = await supabase
                .from('documents')
                .insert([{
                    casefile_id: parseInt(casefileId),
                    title: file.name,
                    file_path: filePath,
                    storage_path: filePath,
                    type: fileExt,
                    description: null
                }]);

            if (dbError) throw dbError;

            handleShowToast('Document uploaded successfully', 'success');
            if (onUpdate) onUpdate();
        } catch (error: any) {
            console.error('Error uploading document:', error);
            handleShowToast(error.message || 'Failed to upload document', 'error');
        } finally {
            setUploading(false);
            // Reset file input
            e.target.value = '';
        }
    };

    const handleDelete = async (doc: Document) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('case-documents')
                .remove([doc.storage_path || doc.file_path]);

            if (storageError) console.warn('Storage deletion warning:', storageError);

            // Delete from database
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', doc.id);

            if (dbError) throw dbError;

            handleShowToast('Document deleted', 'success');
            if (onUpdate) onUpdate();
        } catch (error: any) {
            console.error('Error deleting document:', error);
            handleShowToast(error.message || 'Failed to delete document', 'error');
        }
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${
                    toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                }`}>
                    {toast.message}
                </div>
            )}

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-b border-emerald-100 dark:border-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        <h2 className="text-lg font-bold">Documents</h2>
                    </div>
                    <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors cursor-pointer">
                        <Plus className="w-4 h-4" />
                        {uploading ? 'Uploading...' : 'Upload'}
                        <input
                            type="file"
                            onChange={handleUpload}
                            disabled={uploading}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                    </label>
                </div>

                {!documents || documents.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <div className="flex justify-center mb-4">
                            <FileText className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                        <p>No documents found for this case.</p>
                        <p className="text-sm mt-2">Click "Upload" to add documents.</p>
                    </div>
                ) : (
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
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleExternalLink(doc)}
                                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
