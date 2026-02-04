"use client"

import { Calendar, Filter, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { CASE_STAGES, getAllStatuses } from "@/lib/constants/caseStages";

interface FilterBarProps {
    dateRangeMonths: number;
    onDateRangeChange: (months: number) => void;
    statusFilter: Record<string, boolean>;
    onStatusFilterChange: (filter: Record<string, boolean>) => void;
    stageFilter: Record<string, boolean>;
    onStageFilterChange: (filter: Record<string, boolean>) => void;
}

export function FilterBar({
    dateRangeMonths,
    onDateRangeChange,
    statusFilter,
    onStatusFilterChange,
    stageFilter,
    onStageFilterChange
}: FilterBarProps) {
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showStageDropdown, setShowStageDropdown] = useState(false);
    const statusRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
                setShowStatusDropdown(false);
            }
            if (stageRef.current && !stageRef.current.contains(event.target as Node)) {
                setShowStageDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allStatuses = getAllStatuses();
    const selectedStatusCount = Object.values(statusFilter).filter(v => v).length;
    const selectedStageCount = Object.values(stageFilter).filter(v => v).length;

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 rounded-lg border border-border bg-card/50 backdrop-blur-sm">
            <div>
                <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                <p className="text-xs text-muted-foreground">Refine charts using live data filters</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {/* Date Range Filter */}
                <div className="relative">
                    <select
                        value={dateRangeMonths}
                        onChange={(e) => onDateRangeChange(parseInt(e.target.value))}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors bg-background text-foreground appearance-none pr-8 cursor-pointer"
                    >
                        <option value={3}>Last 3 months</option>
                        <option value={6}>Last 6 months</option>
                        <option value={12}>Last 12 months</option>
                    </select>
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative" ref={statusRef}>
                    <button
                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors bg-background text-foreground"
                    >
                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                        Status: {selectedStatusCount === allStatuses.length ? 'All' : `${selectedStatusCount} selected`}
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>

                    {showStatusDropdown && (
                        <div className="absolute top-full mt-1 right-0 z-[100] min-w-[200px] max-h-[300px] overflow-auto bg-card border border-border rounded-md shadow-lg p-3">
                            <div className="space-y-2">
                                {allStatuses.map(status => (
                                    <label key={status} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={statusFilter[status] !== false}
                                            onChange={(e) => {
                                                onStatusFilterChange({
                                                    ...statusFilter,
                                                    [status]: e.target.checked
                                                });
                                            }}
                                            className="rounded border-border"
                                        />
                                        <span className="text-foreground">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stage Filter */}
                <div className="relative" ref={stageRef}>
                    <button
                        onClick={() => setShowStageDropdown(!showStageDropdown)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors bg-background text-foreground"
                    >
                        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                        Stages: {selectedStageCount === CASE_STAGES.length ? 'All' : `${selectedStageCount} selected`}
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </button>

                    {showStageDropdown && (
                        <div className="absolute top-full mt-1 right-0 z-[100] min-w-[180px] bg-card border border-border rounded-md shadow-lg p-3">
                            <div className="space-y-2">
                                {CASE_STAGES.map(stage => (
                                    <label key={stage} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={stageFilter[stage] !== false}
                                            onChange={(e) => {
                                                onStageFilterChange({
                                                    ...stageFilter,
                                                    [stage]: e.target.checked
                                                });
                                            }}
                                            className="rounded border-border"
                                        />
                                        <span className="text-foreground">{stage}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
