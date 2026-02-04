"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Plus, MoreHorizontal, Phone, MapPin, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import AddAutoInsuranceModal from "./forms/AddAutoInsuranceModal";

interface InsuranceTableProps {
    initialInsurance: any[];
}

export function InsuranceTable({ initialInsurance }: InsuranceTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [stateFilter, setStateFilter] = useState("All States");
    const [currentPage, setCurrentPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
    const itemsPerPage = 10;

    // Extract unique states for filter
    const uniqueStates = ["All States", ...Array.from(new Set(initialInsurance.map(i => i.state))).filter(Boolean).sort()];

    const filteredInsurance = initialInsurance.filter(i => {
        const matchesSearch =
            (i.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (i.phone || "").includes(searchTerm);

        const matchesState = stateFilter === "All States" || i.state === stateFilter;

        return matchesSearch && matchesState;
    });

    const totalPages = Math.ceil(filteredInsurance.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredInsurance.length);
    const currentInsurance = filteredInsurance.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    const handleSearchChange = (val: string) => { setSearchTerm(val); setCurrentPage(1); };
    const handleStateChange = (val: string) => { setStateFilter(val); setCurrentPage(1); };
    const clearFilters = () => { setSearchTerm(""); setStateFilter("All States"); setCurrentPage(1); };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        try {
            const { error } = await supabase
                .from('auto_insurance')
                .delete()
                .eq('id', id);

            if (error) throw error;

            router.refresh();
        } catch (error: any) {
            console.error('Error deleting insurance:', error);
            alert('Failed to delete insurance company');
        }
    };

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm">
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by company name or phone..."
                        className="w-full bg-muted/50 border-none rounded-md pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="text-sm text-muted-foreground whitespace-nowrap hidden sm:inline-block">State</span>
                        <select
                            className="w-full sm:w-32 bg-muted/50 border-none rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            value={stateFilter}
                            onChange={(e) => handleStateChange(e.target.value)}
                        >
                            {uniqueStates.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button
                            onClick={clearFilters}
                            className="text-xs text-muted-foreground hover:text-foreground underline px-2"
                        >
                            Clear Filters
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" />
                            Add Insurance
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{startIndex + 1}-{endIndex}</span> of <span className="font-medium text-foreground">{filteredInsurance.length}</span> companies
                    </div>
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
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-3 w-[40%]">Insurance Company</th>
                                <th className="px-6 py-3">Phone</th>
                                <th className="px-6 py-3">State</th>
                                <th className="px-6 py-3">Adjusters</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {currentInsurance.map((i) => (
                                <tr
                                    key={i.id}
                                    className="hover:bg-muted/30 transition-colors group"
                                >
                                    <td
                                        className="px-6 py-4 cursor-pointer"
                                        onClick={() => router.push(`/auto-insurance/${i.id}`)}
                                    >
                                        <div className="font-medium text-foreground">{i.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {i.phone && (
                                            <div className="flex items-center gap-2 text-foreground">
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                {i.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {i.state}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {i.adjusters > 0 && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                {i.adjusters}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="relative inline-block">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenActionMenu(openActionMenu === i.id ? null : i.id);
                                                }}
                                                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>

                                            {openActionMenu === i.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setOpenActionMenu(null)}
                                                    />
                                                    <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-lg z-20 py-1">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/auto-insurance/${i.id}`);
                                                                setOpenActionMenu(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-foreground"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            View Details
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenActionMenu(null);
                                                                handleDelete(i.id, i.name);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Delete
                                                        </button>
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

            <AddAutoInsuranceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={() => {
                    setIsAddModalOpen(false);
                    router.refresh();
                }}
            />
        </div>
    );
}
