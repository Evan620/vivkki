"use client";

import { useState } from "react";
import { Search, Filter, MoreHorizontal, AlertTriangle, Archive, Plus } from "lucide-react";

interface Case {
    id: string;
    caseNumber: string;
    name: string;
    stage: string;
    status: string;
    daysOpen: number;
    statuteAlert: string;
    clientsCount?: number;
    statuteDaysLeft?: number;
}

const mockCases: Case[] = [
    { id: "1", name: "Aimon", caseNumber: "#46", stage: "Demand", status: "Ready for Demand", daysOpen: 299, statuteAlert: "No alert" },
    { id: "2", name: "Alletto", caseNumber: "#47", stage: "Demand", status: "Active", daysOpen: 375, statuteAlert: "No alert" },
    { id: "3", name: "Allison", caseNumber: "#48", stage: "Demand", status: "Active", daysOpen: 611, statuteAlert: "115 days left", statuteDaysLeft: 115 },
    { id: "4", name: "Baxter Family", caseNumber: "#49", stage: "Processing", status: "Active", daysOpen: 303, statuteAlert: "No alert", clientsCount: 3 },
    { id: "5", name: "Booker-Whitehead", caseNumber: "#50", stage: "Processing", status: "Active", daysOpen: 157, statuteAlert: "No alert", clientsCount: 2 },
    { id: "6", name: "Bourne", caseNumber: "#99", stage: "Demand", status: "Negotiating", daysOpen: 550, statuteAlert: "99 days left", statuteDaysLeft: 99 },
    { id: "7", name: "Carr", caseNumber: "#53", stage: "Processing", status: "Active", daysOpen: 295, statuteAlert: "No alert" },
    { id: "8", name: "Childress Family", caseNumber: "#54", stage: "Processing", status: "Active", daysOpen: 303, statuteAlert: "No alert", clientsCount: 3 },
    { id: "9", name: "Clack", caseNumber: "#55", stage: "Processing", status: "Active", daysOpen: 212, statuteAlert: "No alert" },
    { id: "10", name: "client-Test", caseNumber: "#103", stage: "Demand", status: "Demand Sent", daysOpen: 52, statuteAlert: "No alert", clientsCount: 2 },
    { id: "11", name: "Cobb-Hoffman", caseNumber: "#56", stage: "Demand", status: "Active", daysOpen: 235, statuteAlert: "No alert", clientsCount: 2 },
    { id: "12", name: "Cole-Hagenes-Test", caseNumber: "#131", stage: "Processing", status: "Treating", daysOpen: 12, statuteAlert: "No alert", clientsCount: 2 },
    { id: "13", name: "Conrady", caseNumber: "#57", stage: "Demand", status: "Demand Sent", daysOpen: 485, statuteAlert: "STATUTE EXPIRED", statuteDaysLeft: -1 },
    { id: "14", name: "Copier Family", caseNumber: "#80", stage: "Treating", status: "Active", daysOpen: 73, statuteAlert: "No alert", clientsCount: 5 },
    { id: "15", name: "Cullum", caseNumber: "#59", stage: "Processing", status: "Awaiting B&R", daysOpen: 142, statuteAlert: "No alert" },
    { id: "16", name: "Dacus", caseNumber: "#111", stage: "Processing", status: "Treating", daysOpen: 34, statuteAlert: "No alert" },
    { id: "17", name: "Davis-Cagle", caseNumber: "#52", stage: "Litigation", status: "Active", daysOpen: 303, statuteAlert: "No alert", clientsCount: 2 },
    { id: "18", name: "Degand", caseNumber: "#60", stage: "Demand", status: "Active", daysOpen: 249, statuteAlert: "No alert" },
    { id: "19", name: "Ellis", caseNumber: "#61", stage: "Processing", status: "Awaiting B&R", daysOpen: 262, statuteAlert: "No alert" },
    { id: "20", name: "Ergenbright Family", caseNumber: "#62", stage: "Demand", status: "Negotiating", daysOpen: 443, statuteAlert: "No alert", clientsCount: 5 },
    { id: "21", name: "Flores", caseNumber: "#63", stage: "Demand", status: "Demand Sent", daysOpen: 240, statuteAlert: "No alert" },
    { id: "22", name: "Galberth", caseNumber: "#64", stage: "Demand", status: "Payment Instructions Sent", daysOpen: 354, statuteAlert: "No alert" },
    { id: "23", name: "Garcia", caseNumber: "#65", stage: "Demand", status: "Proposed Settlement Statement Sent", daysOpen: 324, statuteAlert: "No alert" },
    { id: "24", name: "Glore", caseNumber: "#66", stage: "Demand", status: "Negotiating", daysOpen: 415, statuteAlert: "No alert" },
    { id: "25", name: "Granger", caseNumber: "#68", stage: "Demand", status: "Active", daysOpen: 554, statuteAlert: "110 days left", statuteDaysLeft: 110 },
    { id: "26", name: "Torres", caseNumber: "#83", stage: "Demand", status: "Ready for Demand", daysOpen: 814, statuteAlert: "STATUTE EXPIRED", statuteDaysLeft: -1 },
];

export function CasesTable() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filteredCases = mockCases.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredCases.length);
    const currentCases = filteredCases.slice(startIndex, endIndex);

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/50 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by client name or case..."
                        className="w-full bg-muted/50 border-none rounded-md pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-muted/50 hover:bg-muted text-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        <Archive className="w-4 h-4 text-muted-foreground" />
                        Archives
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors">
                        <Plus className="w-4 h-4" />
                        New Case
                    </button>
                    <button className="p-2 bg-muted/50 hover:bg-muted rounded-md text-foreground transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium text-foreground">{startIndex + 1}-{endIndex}</span> of <span className="font-medium text-foreground">{filteredCases.length}</span> cases
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
                                <th className="px-6 py-3">Case Name</th>
                                <th className="px-6 py-3">Stage</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Days Open</th>
                                <th className="px-6 py-3">Statute Alert</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {currentCases.map((c) => (
                                <tr key={c.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{c.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                            <span>Case {c.caseNumber}</span>
                                            {c.clientsCount && (
                                                <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{c.clientsCount} clients</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-foreground">{c.stage}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-foreground">{c.daysOpen} days</div>
                                        <div className="text-xs text-muted-foreground">Since sign-up</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.statuteDaysLeft !== undefined && c.statuteDaysLeft < 0 ? (
                                            <div className="text-destructive font-bold flex items-center gap-1.5 animate-pulse">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                STATUTE EXPIRED
                                            </div>
                                        ) : c.statuteDaysLeft !== undefined && c.statuteDaysLeft <= 120 ? (
                                            <div className="text-orange-500 font-medium flex items-center gap-1.5">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                {c.statuteAlert}
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground">{c.statuteAlert}</div>
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
