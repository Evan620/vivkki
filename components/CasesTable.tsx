"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, MoreHorizontal, AlertTriangle, Archive, Plus, Loader2, X, Eye } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { CASE_STAGES, CASE_STATUSES, getStatusesForStage } from "@/lib/constants/caseStages";

interface Case {
    id: number;
    case_number: string;
    stage: string;
    status: string;
    created_at: string;
    statute_alert?: string;
    client_count?: number;
    statute_of_limitations?: string;
    is_archived: boolean;
    name?: string;
    daysOpen: number;
    statuteDaysLeft?: number;
    statuteAlertLevel?: 'none' | 'warning' | 'critical' | 'expired';
    // Helper properties added during mapping
    caseNumber: string;
    statuteAlert: string;
    clientsCount?: number;
}

export function CasesTable() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

    // Data state
    const [allCases, setAllCases] = useState<Case[]>([]);
    const [filteredCases, setFilteredCases] = useState<Case[]>([]);

    // Single-value filters to match styling
    const [stageFilter, setStageFilter] = useState("All Stages");
    const [statusFilter, setStatusFilter] = useState("All Statuses");
    const [daysOpenFilter, setDaysOpenFilter] = useState("All Time");

    // Action menu state
    const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

    const itemsPerPage = 10;

    useEffect(() => {
        fetchCases();

        const channel = supabase
            .channel('casefiles-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'casefiles' }, () => {
                fetchCases();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        applyFilters();
    }, [allCases, searchTerm, viewMode, stageFilter, statusFilter, daysOpenFilter]);

    // Reset page and dependent filters when filters change
    const handleStageChange = (val: string) => {
        setStageFilter(val);
        setStatusFilter("All Statuses"); // Reset status when stage changes
        setCurrentPage(1);
    };

    const handleStatusChange = (val: string) => { setStatusFilter(val); setCurrentPage(1); };
    const handleDaysOpenChange = (val: string) => { setDaysOpenFilter(val); setCurrentPage(1); };
    const handleViewModeChange = () => {
        setViewMode(prev => prev === 'active' ? 'archived' : 'active');
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setStageFilter("All Stages");
        setStatusFilter("All Statuses");
        setDaysOpenFilter("All Time");
        setCurrentPage(1);
    };

    const fetchCases = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('casefiles')
                .select('*, clients(*)');

            if (error) throw error;

            const formattedData = (data || []).map((c: any) => {
                const primaryClient = c.clients?.find((cl: any) => cl.client_number === 1) || c.clients?.[0];
                const caseName = primaryClient ? `${primaryClient.last_name}` : `Case #${c.id}`;
                const daysOpen = Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24));

                let alertLevel: Case['statuteAlertLevel'] = 'none';
                if (c.statute_alert === "STATUTE EXPIRED") alertLevel = 'expired';
                else if (c.statute_alert?.includes("days left")) alertLevel = 'warning';

                return {
                    ...c,
                    name: caseName,
                    caseNumber: `#${c.id}`,
                    daysOpen,
                    clientsCount: c.client_count,
                    statuteAlert: c.statute_alert || "No alert",
                    statuteAlertLevel: alertLevel,
                    is_archived: c.is_archived || false
                };
            });

            setAllCases(formattedData);
        } catch (err) {
            console.error('Error fetching cases:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = allCases.filter(c => {
            // View Mode
            if (viewMode === 'active' && c.is_archived) return false;
            if (viewMode === 'archived' && !c.is_archived) return false;

            // Search
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matches = (c.name?.toLowerCase().includes(searchLower) ||
                    String(c.caseNumber).toLowerCase().includes(searchLower));
                if (!matches) return false;
            }

            // Stage
            if (stageFilter !== "All Stages" && c.stage !== stageFilter) return false;

            // Status
            if (statusFilter !== "All Statuses" && c.status !== statusFilter) return false;

            // Days Open
            if (daysOpenFilter !== "All Time") {
                const limit = parseInt(daysOpenFilter);
                if (c.daysOpen > limit) return false;
            }

            return true;
        });

        // Default Sort: Newest First
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setFilteredCases(result);
    };

    const handleArchiveToggle = async (id: number, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('casefiles')
                .update({
                    is_archived: !currentStatus,
                    archived_at: !currentStatus ? new Date().toISOString() : null
                })
                .eq('id', id);

            if (error) throw error;

            setAllCases(prev => prev.map(c =>
                c.id === id ? { ...c, is_archived: !currentStatus } : c
            ));

            setOpenActionMenu(null);
        } catch (err) {
            console.error('Error toggling archive status:', err);
            alert('Failed to update archive status');
        }
    };

    // Pagination
    const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredCases.length);
    const currentCases = filteredCases.slice(startIndex, endIndex);

    // Derived statuses based on selected stage
    const availableStatuses = stageFilter === "All Stages"
        ? Array.from(new Set(Object.values(CASE_STATUSES).flat()))
        : getStatusesForStage(stageFilter);

    if (loading && allCases.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm">
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by client name or case..."
                        className="w-full bg-muted/50 border-none rounded-md pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {/* Stage Dropdown */}
                        <select
                            className="w-full sm:w-32 bg-muted/50 border-none rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            value={stageFilter}
                            onChange={(e) => handleStageChange(e.target.value)}
                        >
                            <option value="All Stages">All Stages</option>
                            {CASE_STAGES.map(stage => (
                                <option key={stage} value={stage}>{stage}</option>
                            ))}
                        </select>

                        {/* Status Dropdown */}
                        <select
                            className="w-full sm:w-32 bg-muted/50 border-none rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => handleStatusChange(e.target.value)}
                        >
                            <option value="All Statuses">All Statuses</option>
                            {availableStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>

                        {/* Days Open Dropdown */}
                        <select
                            className="w-full sm:w-32 bg-muted/50 border-none rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            value={daysOpenFilter}
                            onChange={(e) => handleDaysOpenChange(e.target.value)}
                        >
                            <option value="All Time">All Time</option>
                            <option value="30">Last 30 Days</option>
                            <option value="60">Last 60 Days</option>
                            <option value="90">Last 90 Days</option>
                            <option value="180">Last 180 Days</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                            onClick={clearFilters}
                            className="text-xs text-muted-foreground hover:text-foreground underline px-2 whitespace-nowrap"
                        >
                            Clear Filters
                        </button>

                        <button
                            onClick={handleViewModeChange}
                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${viewMode === 'archived'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-muted/50 hover:bg-muted text-foreground'
                                }`}
                        >
                            <Archive className="w-4 h-4" />
                            {viewMode === 'active' ? 'View Archives' : 'Active Cases'}
                        </button>

                        <button
                            onClick={() => router.push('/cases/new')}
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            New Case
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                    <div className="text-sm text-muted-foreground">
                        {viewMode === 'archived' && <span className="mr-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium">Archived View</span>}
                        Showing <span className="font-medium text-foreground">{filteredCases.length > 0 ? startIndex + 1 : 0}-{endIndex}</span> of <span className="font-medium text-foreground">{filteredCases.length}</span> results
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-xs font-medium rounded-md bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-xs font-medium rounded-md bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-3">Case Name</th>
                                <th className="px-6 py-3">Stage</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Days Open</th>
                                <th className="px-6 py-3">Statute Alert</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {currentCases.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <p>No cases found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentCases.map((c) => (
                                <tr
                                    key={c.id}
                                    className={`hover:bg-muted/30 transition-colors group cursor-pointer ${c.is_archived ? 'opacity-75 bg-muted/10' : ''}`}
                                    onClick={() => router.push(`/cases/${c.id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="block group/link">
                                            <div className="font-medium text-foreground group-hover/link:text-primary transition-colors flex items-center gap-2">
                                                {c.name}
                                                {c.is_archived && <Archive className="w-3 h-3 text-muted-foreground" />}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                <span>Case {c.caseNumber}</span>
                                                {c.client_count !== undefined && (
                                                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{c.client_count} clients</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-foreground">{c.stage || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                            {c.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-foreground font-mono">{c.daysOpen}</div>
                                        <div className="text-xs text-muted-foreground">days</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.statuteAlert === "STATUTE EXPIRED" ? (
                                            <div className="text-destructive font-bold flex items-center gap-1.5 animate-pulse">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                EXPIRED
                                            </div>
                                        ) : (
                                            <div className={`${c.statuteAlert?.includes("days left") ? "text-orange-500 font-medium" : "text-muted-foreground"} flex items-center gap-1.5`}>
                                                {c.statuteAlert !== "No alert" && <AlertTriangle className="w-3.5 h-3.5" />}
                                                {c.statuteAlert}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right relative">
                                        <div className="relative inline-block text-left">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenActionMenu(openActionMenu === c.id ? null : c.id);
                                                }}
                                                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>

                                            {/* Action Menu Dropdown */}
                                            {openActionMenu === c.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenActionMenu(null);
                                                        }}
                                                    ></div>
                                                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 z-20 animate-in fade-in zoom-in-95 duration-100 border border-border">
                                                        <div className="py-1" role="menu">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/cases/${c.id}`);
                                                                    setOpenActionMenu(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleArchiveToggle(c.id, c.is_archived);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                                                            >
                                                                <Archive className="w-4 h-4" />
                                                                {c.is_archived ? 'Unarchive Case' : 'Archive Case'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
