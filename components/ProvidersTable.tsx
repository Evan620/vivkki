"use client";

import { useState } from "react";
import { Search, Filter, MoreHorizontal, MapPin, Phone, Plus } from "lucide-react";
import { MedicalProvider } from "@/types";

interface ProvidersTableProps {
    initialProviders: MedicalProvider[];
}

export function ProvidersTable({ initialProviders }: ProvidersTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("All Types");
    const [stateFilter, setStateFilter] = useState("All States");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Extract unique types and states for filters
    const uniqueTypes = ["All Types", ...Array.from(new Set(initialProviders.map(p => p.type || "Other"))).filter(Boolean).sort()];
    const uniqueStates = ["All States", ...Array.from(new Set(initialProviders.map(p => p.state))).filter(Boolean).sort()];

    const filteredProviders = initialProviders.filter(p => {
        const matchesSearch =
            (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.phone || "").includes(searchTerm);

        const matchesType = typeFilter === "All Types" || p.type === typeFilter;
        const matchesState = stateFilter === "All States" || p.state === stateFilter;

        return matchesSearch && matchesType && matchesState;
    });

    const totalPages = Math.ceil(filteredProviders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProviders.length);
    const currentProviders = filteredProviders.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    const handleSearchChange = (val: string) => { setSearchTerm(val); setCurrentPage(1); };
    const handleTypeChange = (val: string) => { setTypeFilter(val); setCurrentPage(1); };
    const handleStateChange = (val: string) => { setStateFilter(val); setCurrentPage(1); };
    const clearFilters = () => { setSearchTerm(""); setTypeFilter("All Types"); setStateFilter("All States"); setCurrentPage(1); };

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm">
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name, city, or phone..."
                        className="w-full bg-muted/50 border-none rounded-md pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground"
                        value={searchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            className="w-full sm:w-40 bg-muted/50 border-none rounded-md px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            value={typeFilter}
                            onChange={(e) => handleTypeChange(e.target.value)}
                        >
                            {uniqueTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
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
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                            <Plus className="w-4 h-4" />
                            Add Provider
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{startIndex + 1}-{endIndex}</span> of <span className="font-medium text-foreground">{filteredProviders.length}</span> providers
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
                                <th className="px-6 py-3 w-[40%]">Provider Name</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Location</th>
                                <th className="px-6 py-3">Phone</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {currentProviders.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{p.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${p.type === 'Chiropractic' ? 'bg-blue-500/10 text-blue-500' :
                                                p.type === 'Hospital' ? 'bg-red-500/10 text-red-500' :
                                                    p.type === 'Imaging/Radiology' || p.type === 'Imaging' ? 'bg-purple-500/10 text-purple-500' :
                                                        p.type === 'Physical Therapy' ? 'bg-green-500/10 text-green-500' :
                                                            'bg-muted text-muted-foreground'}`}>
                                            {p.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {[p.city, p.state].filter(Boolean).join(", ")}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {p.phone && (
                                            <div className="flex items-center gap-2 text-foreground">
                                                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                                {p.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
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
