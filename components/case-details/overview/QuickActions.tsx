"use client";

import { FileText } from "lucide-react";

export function QuickActions() {
    const handleGenerateDocuments = () => {
        // TODO: Implement document generation
        console.log('Generate documents clicked');
        alert('Document generation feature coming soon!');
    };

    return (
        <div className="mb-6">
            <h3 className="font-medium text-foreground mb-3">Quick Actions</h3>
            <button 
                onClick={handleGenerateDocuments}
                className="flex flex-col items-center justify-center gap-2 bg-card border border-border hover:border-primary/50 hover:bg-muted/50 p-4 rounded-xl transition-all w-32 h-24 group cursor-pointer"
            >
                <FileText className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium text-foreground text-center line-clamp-2">Generate Documents</span>
            </button>
        </div>
    );
}
