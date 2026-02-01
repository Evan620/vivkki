"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, MoreHorizontal, AlertTriangle, Archive, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Case {
    id: number; // details say bigserial, so usually number or string. JS handles bigint as string sometimes if too large, but usually number for IDs in Supabase JS unless configured otherwise. Let's assume number or string. Supabase usually returns numbers for int8.
    // Wait, Supabase IDs are usually numbers if bigserial, but often safer as strings. Let's check what the migration said: `id bigserial PRIMARY KEY`.
    // I will type it as string | number to be safe, or check the return type.
    // Actually, let's look at the mock data, it used strings "1", "2".
    // I'll stick to any for now or try to be specific if I can.
    case_number: string; // The migration says case_number is NOT in the main file 20251010... wait.
    // 20251010... has `wreck_type`, etc. NOT `case_number`?
    // Ah, `20251010...` didn't have `case_number` in the `casefiles` table definition I read!
    // It had `id`. Maybe `case_number` IS the `id`?
    // Let's re-read the migration carefully.
    // Line 100: `id bigserial PRIMARY KEY`.
    // No `case_number` column in `20251010051318_create_vikki_crm_schema.sql`.
    // Maybe it was added later? "20251030..."?
    // I better check if `case_number` exists. If not, I'll use `id` as case number.

    // Schema mapping:
    // name -> computed? or distinct column? not in initial schema.
    // client_count -> `client_count`
    // daysOpen -> computed from `created_at`
    // statuteAlert -> `statute_alert`
    // statuteDaysLeft -> computed?
    name?: string; // There is no 'name' column in the initial schema.
    // But `clients` table exists. Maybe the "Case Name" is the Client's Last Name?
    // Usually cases are named after the primary client (e.g., "Smith v. Jones" or "Smith").
    // The previous mock data had "Aimon", "Alletto" (Last names).
    // So I need to fetch the PRIMARY CLIENT's last name.

    stage: string;
    status: string;
    created_at: string;
    statute_alert?: string;
    client_count?: number;
    statute_of_limitations?: string; // Check if this exists
}

export function CasesTable() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [cases, setCases] = useState<any[]>([]); // Using any for now to debug schema mismatch if any
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchCases = async () => {
            setLoading(true);
            try {
                // Fetch cases with their primary client to create a name
                // "clients" table has "is_driver" or "client_number".
                // I'll fetch `*, clients(first_name, last_name)`
                // Note: Supabase JS relationship: `clients` linked to `casefiles`.
                const { data, error } = await supabase
                    .from('casefiles')
                    .select('*, clients(*)')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Transform data to match UI needs
                const formattedData = (data || []).map((c: any) => {
                    const primaryClient = c.clients?.find((cl: any) => cl.client_number === 1) || c.clients?.[0];
                    const caseName = primaryClient ? `${primaryClient.last_name}` : `Case #${c.id}`;
                    const daysOpen = Math.floor((new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 3600 * 24));
                    return {
                        ...c,
                        name: caseName,
                        caseNumber: `#${c.id}`, // Use ID as case number for now
                        daysOpen,
                        clientsCount: c.client_count, // Use the column
                        statuteAlert: c.statute_alert || "No alert", // Use DB column or default
                        // statuteDaysLeft calculation if needed
                    };
                });

                setCases(formattedData);
            } catch (err) {
                console.error('Error fetching cases:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCases();
    }, []);

    const filteredCases = cases.filter(c => {
        const searchLower = searchTerm.toLowerCase();
        return (c.name?.toLowerCase().includes(searchLower) ||
            String(c.caseNumber).toLowerCase().includes(searchLower));
    });

    const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredCases.length);
    const currentCases = filteredCases.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                        Showing <span className="font-medium text-foreground">{filteredCases.length > 0 ? startIndex + 1 : 0}-{endIndex}</span> of <span className="font-medium text-foreground">{filteredCases.length}</span> cases
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
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        No cases found.
                                    </td>
                                </tr>
                            ) : currentCases.map((c) => (
                                <tr
                                    key={c.id}
                                    onClick={() => router.push(`/cases/${c.id}`)}
                                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="block group/link">
                                            <div className="font-medium text-foreground group-hover/link:text-primary transition-colors">{c.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                                <span>Case {c.caseNumber}</span>
                                                {c.clientsCount !== undefined && (
                                                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{c.clientsCount} clients</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-foreground">{c.stage || 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            {c.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-foreground">{c.daysOpen} days</div>
                                        <div className="text-xs text-muted-foreground">Since sign-up</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.statuteAlert === "STATUTE EXPIRED" ? (
                                            <div className="text-destructive font-bold flex items-center gap-1.5 animate-pulse">
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                STATUTE EXPIRED
                                            </div>
                                        ) : (
                                            <div className={`${c.statuteAlert?.includes("days left") ? "text-orange-500 font-medium" : "text-muted-foreground"} flex items-center gap-1.5`}>
                                                {c.statuteAlert !== "No alert" && <AlertTriangle className="w-3.5 h-3.5" />}
                                                {c.statuteAlert}
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
