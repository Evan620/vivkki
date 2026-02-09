"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import DocumentGenerationModal from "@/components/forms/DocumentGenerationModal";

interface QuickActionsProps {
    casefileId: number;
    clients?: any[];
    defendants?: any[];
    medicalBills?: any[];
}

export function QuickActions({ casefileId, clients = [], defendants = [], medicalBills = [] }: QuickActionsProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleGenerateDocuments = () => {
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        // Optionally refresh the page or update data
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    return (
        <>
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

            <DocumentGenerationModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                casefileId={casefileId}
                clients={clients}
                defendants={defendants}
                medicalBills={medicalBills}
                onSuccess={handleSuccess}
            />
        </>
    );
}
