"use client";

import { useState } from "react";
import { Search, Plus, MoreHorizontal, Phone, Shield } from "lucide-react";
interface HealthInsuranceTableProps {
    initialInsurance: any[];
}

export function HealthInsuranceTable({ initialInsurance }: HealthInsuranceTableProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredInsurance = initialInsurance.filter(i =>
        (i.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.phone || "").includes(searchTerm)
    );

    const totalPages = Math.ceil(filteredInsurance.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredInsurance.length);
    const currentInsurance = filteredInsurance.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    const handleSearchChange = (val: string) => { setSearchTerm(val); setCurrentPage(1); };
    const clearFilters = () => { setSearchTerm(""); setCurrentPage(1); };

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

                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground hover:text-foreground underline px-2"
                    >
                        Clear Filters
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                        <Plus className="w-4 h-4" />
                        Add Health Insurance
                    </button>
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
                                <th className="px-6 py-3 w-[45%]">Insurance Company</th>
                                <th className="px-6 py-3">Phone</th>
                                <th className="px-6 py-3">Adjusters</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {currentInsurance.map((i) => (
                                <tr key={i.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
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
                                        {i.adjusters && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                                {i.adjusters}
                                            </span>
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
