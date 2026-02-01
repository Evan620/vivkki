"use client";

import { Edit2 } from "lucide-react";
import { CaseDetail } from "@/types";

interface AccidentDetailsProps {
    caseDetail: CaseDetail;
}

export function AccidentDetails({ caseDetail }: AccidentDetailsProps) {
    // Formatting helpers
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString();
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return 'N/A';
        // Simple check if it's already formatted or generic time string
        return timeStr;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-b border-orange-100 dark:border-orange-900 flex items-center justify-between">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="text-2xl">🚗</span>
                        <span>Accident Details</span>
                    </h3>
                    <button
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        <span>Edit</span>
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900">
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Date of Loss</p>
                        <p className="text-base font-medium">{formatDate(caseDetail.dateOfLoss)}</p>
                    </div>

                    <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-900">
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">Time</p>
                        <p className="text-base font-medium">{formatTime(caseDetail.timeOfWreck)}</p>
                    </div>

                    <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">Accident Type</p>
                        <p className="text-base font-medium">{caseDetail.wreckType || 'N/A'}</p>
                    </div>

                    <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900">
                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">Police Report</p>
                        <p className="text-base font-medium">{caseDetail.policeReportNumber || 'Not available'}</p>
                    </div>

                    <div className="sm:col-span-2 p-4 bg-gray-50/50 dark:bg-gray-800/10 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Location</p>
                        <p className="text-base font-medium">
                            {[caseDetail.wreckStreet, caseDetail.wreckCity, caseDetail.wreckCounty, caseDetail.wreckState].filter(Boolean).join(', ') || 'Not specified'}
                        </p>
                    </div>

                    {caseDetail.vehicleDescription && (
                        <div className="sm:col-span-2 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">Vehicle & Damage</p>
                            <p className="text-base font-medium">
                                {caseDetail.vehicleDescription}{caseDetail.damageLevel && ` - ${caseDetail.damageLevel} damage`}
                            </p>
                        </div>
                    )}

                    {caseDetail.wreckDescription && (
                        <div className="sm:col-span-2 p-4 bg-gray-50/50 dark:bg-gray-800/10 rounded-xl border border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
                            <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                                {caseDetail.wreckDescription}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
