"use client";


import { Header } from "@/components/Header";
import { CaseHeader } from "@/components/case-details/CaseHeader";
import { CaseTabs } from "@/components/case-details/CaseTabs";
import { CaseOverview } from "@/components/case-details/overview/CaseOverview";
import { MedicalDetails } from "@/components/case-details/medical/MedicalDetails";
import { AccidentDetails } from "@/components/case-details/accident/AccidentDetails";
import { InsuranceDetails } from "@/components/case-details/insurance/InsuranceDetails";
import { ClientList } from "@/components/case-details/clients/ClientList";
import { DefendantList } from "@/components/case-details/defendants/DefendantList";
import { WorkLogList } from "@/components/case-details/work-log/WorkLogList";
import { DocumentList } from "@/components/case-details/documents/DocumentList";
import { TabTransition } from "@/components/case-details/TabTransition";
import { CaseDetail } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, use, Suspense } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

async function fetchCaseDetail(id: string): Promise<CaseDetail | null> {
    const { data: caseData, error } = await supabase
        .from('casefiles')
        .select(`
            *,
            clients (*),
            defendants (
                *,
                third_party_claims (*)
            ),
            work_logs (*),
            settlements (*)
        `)
        .eq('id', id)
        .single();

    if (error || !caseData) {
        console.error("Error fetching case:", error);
        return null;
    }

    // Map Supabase data to CaseDetail interface
    const primaryClient = caseData.clients?.find((c: any) => c.client_number === 1) || caseData.clients?.[0];
    const clientName = primaryClient ? `${primaryClient.last_name}` : `Case #${caseData.id}`;

    // Calculate days open
    const createdDate = new Date(caseData.created_at);
    const now = new Date();
    const daysOpen = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24));

    // Statute logic
    const statuteDate = caseData.statute_deadline ? new Date(caseData.statute_deadline).toLocaleDateString() : "N/A";
    const statuteDaysLeft = caseData.days_until_statute || 0;

    const totalBilled = 0;
    const outstandingRecords = 0;

    return {
        id: String(caseData.id),
        caseNumber: `#${caseData.id}`,
        name: clientName,
        ssn: primaryClient?.ssn || "N/A",
        stage: caseData.stage || "Intake",
        status: caseData.status || "Active",
        dateOfLoss: caseData.date_of_loss ? new Date(caseData.date_of_loss).toLocaleDateString() : "N/A",
        createdDate: createdDate.toLocaleString(),
        updatedDate: new Date(caseData.updated_at).toLocaleString(),
        daysOpen: daysOpen,
        statuteDate: statuteDate,
        statuteDaysLeft: statuteDaysLeft,

        medicalProvidersCount: 0,
        totalBilled: totalBilled,
        outstandingRecords: outstandingRecords,

        // Accident Details Mapping
        timeOfWreck: caseData.time_of_wreck,
        wreckType: caseData.wreck_type,
        wreckStreet: caseData.wreck_street,
        wreckCity: caseData.wreck_city,
        wreckCounty: caseData.wreck_county,
        wreckState: caseData.wreck_state,
        isPoliceInvolved: caseData.is_police_involved,
        policeForce: caseData.police_force,
        isPoliceReport: caseData.is_police_report,
        policeReportNumber: caseData.police_report_number,
        vehicleDescription: caseData.vehicle_description,
        damageLevel: caseData.damage_level,
        wreckDescription: caseData.wreck_description,

        clients: (caseData.clients || []).map((c: any) => ({
            id: String(c.id),
            name: `${c.first_name} ${c.last_name}`,
            role: c.is_driver ? "Driver" : "Passenger"
        })),

        defendants: (caseData.defendants || []).map((d: any) => {
            const thirdPartyClaims = d.third_party_claims || [];
            // Assuming simplified model where info is on the claim directly
            const primaryClaim = thirdPartyClaims[0] || null;

            return {
                id: String(d.id),
                first_name: d.first_name,
                last_name: d.last_name,
                defendant_number: d.defendant_number,
                liability_percentage: d.liability_percentage,
                is_policyholder: d.is_policyholder,
                policyholder_first_name: d.policyholder_first_name,
                policyholder_last_name: d.policyholder_last_name,
                relationship_type: d.relationship_type,
                related_to_defendant_id: d.related_to_defendant_id,
                email: d.email,
                phone_number: d.phone_number,

                // Insurance from claim
                auto_insurance_id: primaryClaim?.auto_insurance_id,
                // If we need the name, we might need a separate fetch or join. 
                // For now, let's leave it undefined or try to fetch it if critical.
                // Actually, earlier fetchInsuranceData fetched it. 
                // We can rely on 'insurance' tab fetching for detailed insurance view, 
                // but for this 'defendants' view we might miss the name if not joined.
                // Let's rely on primaryClaim values for scalar fields:
                policy_number: primaryClaim?.policy_number,
                claim_number: primaryClaim?.claim_number,

                // Adjuster from claim fields
                adjuster_name: primaryClaim?.adjuster_name,
                adjuster_email: primaryClaim?.adjuster_email,
                adjuster_phone: primaryClaim?.adjuster_phone,
                adjuster_fax: primaryClaim?.adjuster_fax,

                third_party_claim: primaryClaim ? {
                    id: primaryClaim.id,
                    lor_sent: primaryClaim.lor_sent,
                    loa_received: primaryClaim.loa_received,
                    last_request_date: primaryClaim.last_request_date
                } : undefined,

                notes: d.notes,
                casefile_id: String(d.casefile_id)
            };
        }),

        balanceDue: 0,

        settlement: {
            gross: caseData.settlements?.[0]?.gross_settlement || 0,
            attorneyFee: caseData.settlements?.[0]?.attorney_fee || 0,
            caseExpenses: caseData.settlements?.[0]?.case_expenses || 0,
            medicalLiens: caseData.settlements?.[0]?.medical_liens || 0,
            clientNet: caseData.settlements?.[0]?.client_net || 0,
            date: caseData.settlements?.[0]?.settlement_date || "N/A",
            status: caseData.settlements?.[0]?.status || "Pending"
        },

        recentActivity: (caseData.work_logs || []).slice(0, 5).map((log: any) => ({
            id: String(log.id),
            type: 'note' as const,
            content: log.description,
            author: log.user_name || 'System',
            date: new Date(log.timestamp).toLocaleString(),
        }))
    };
}

async function fetchMedicalData(caseId: string) {
    const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('casefile_id', caseId);

    if (!clients || clients.length === 0) {
        return { medicalBills: [], clients: [], healthClaim: null };
    }

    const clientIds = clients.map(c => c.id);

    const { data: bills } = await supabase
        .from('medical_bills')
        .select(`
            *,
            medical_provider:medical_providers(*),
            client:clients(id, first_name, last_name)
        `)
        .in('client_id', clientIds);

    const { data: healthClaims } = await supabase
        .from('health_claims')
        .select('*, health_insurance:health_insurance(*)')
        .in('client_id', clientIds);

    const healthClaim = healthClaims?.[0] || null;

    return {
        medicalBills: bills || [],
        clients: clients,
        healthClaim: healthClaim
    };
}

async function fetchInsuranceData(caseId: string) {
    try {
        // 1. Fetch clients & defendants
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('*')
            .eq('casefile_id', caseId);
        if (clientsError) {
            console.error('Error fetching clients:', clientsError);
        }

        const { data: defendants, error: defendantsError } = await supabase
            .from('defendants')
            .select('*')
            .eq('casefile_id', caseId);
        if (defendantsError) {
            console.error('Error fetching defendants:', defendantsError);
        }

        const clientIds = (clients || []).map(c => c.id);
        const defendantIds = (defendants || []).map(d => d.id);

        // 2. Fetch First Party Claims
        let firstPartyClaims: any[] = [];
        if (clientIds.length > 0) {
            const { data, error } = await supabase
                .from('first_party_claims')
                .select('*, auto_insurance(name)')
                .in('client_id', clientIds);
            if (error) {
                console.error('Error fetching first party claims:', error);
            }
            firstPartyClaims = data || [];
        }

        // 3. Fetch Third Party Claims
        let thirdPartyClaims: any[] = [];
        if (defendantIds.length > 0) {
            const { data, error } = await supabase
                .from('third_party_claims')
                .select('*, auto_insurance(name)')
                .in('defendant_id', defendantIds);
            if (error) {
                console.error('Error fetching third party claims:', error);
            }
            thirdPartyClaims = data || [];
        }

        return {
            firstPartyClaims,
            thirdPartyClaims,
            clients: clients || [],
            defendants: defendants || []
        };
    } catch (error) {
        console.error('Error in fetchInsuranceData:', error);
        // Return empty structure to prevent UI breakage
        return {
            firstPartyClaims: [],
            thirdPartyClaims: [],
            clients: [],
            defendants: []
        };
    }
}

async function fetchWorkLogs(caseId: string) {
    const { data } = await supabase
        .from('work_logs')
        .select('*')
        .eq('casefile_id', caseId)
        .order('timestamp', { ascending: false });

    // Map to recentActivity format for reuse or use new type. 
    // WorkLogList expects 'CaseDetail["recentActivity"]' which matches mapped format.
    return (data || []).map((log: any) => ({
        id: String(log.id),
        type: 'note' as const, // default to note or map based on log content
        content: log.description,
        author: log.user_name || 'System',
        date: new Date(log.timestamp).toLocaleString(),
    }));
}

async function fetchDocuments(caseId: string) {
    const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('casefile_id', caseId)
        .order('created_at', { ascending: false });
    return data || [];
}

function CaseDetailsContent({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab')?.toLowerCase() || 'overview';

    const [caseDetail, setCaseDetail] = useState<CaseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [medicalData, setMedicalData] = useState<any>(null);
    const [isTabTransitioning, setIsTabTransitioning] = useState(false);

    const loadData = async (currentTab?: string) => {
        const tabToLoad = currentTab || activeTab;
        setIsTabTransitioning(true);
        try {
            const detail = await fetchCaseDetail(id);
            setCaseDetail(detail);

            let newMedicalData = null;

            if (tabToLoad === 'medical' || tabToLoad === 'clients') {
                const medical = await fetchMedicalData(id);
                newMedicalData = medical;
            } else if (tabToLoad === 'insurance' || tabToLoad === 'defendant') {
                const insuranceData = await fetchInsuranceData(id);
                newMedicalData = insuranceData;
            } else if (tabToLoad === 'work log' || tabToLoad === 'case notes') {
                const logs = await fetchWorkLogs(id);
                newMedicalData = { workLogs: logs };
            } else if (tabToLoad === 'documents') {
                const docs = await fetchDocuments(id);
                newMedicalData = { documents: docs };
            }

            setMedicalData(newMedicalData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setTimeout(() => setIsTabTransitioning(false), 50);
        }
    };

    const handleDocumentsChange = (documents: any[]) => {
        setMedicalData((prev: any) => ({ ...prev, documents }));
    };

    useEffect(() => {
        loadData();
    }, [id, activeTab]);

    // Render content based on current tab and data
    const renderContent = () => {
        if (!caseDetail) return null;

        const dataToUse = isTabTransitioning ? medicalData : medicalData;

        switch (activeTab) {
            case 'medical':
                return dataToUse ? (
                    <MedicalDetails
                        medicalBills={dataToUse.medicalBills}
                        clients={dataToUse.clients}
                        healthClaim={dataToUse.healthClaim}
                        casefileId={parseInt(id)}
                        onUpdate={loadData}
                    />
                ) : <Loader2 className="h-8 w-8 animate-spin mx-auto my-8" />;
            case 'accident':
                return <AccidentDetails caseDetail={caseDetail} casefileId={id} onUpdate={loadData} />;
            case 'insurance':
                return dataToUse ? (
                    <InsuranceDetails
                        firstPartyClaims={dataToUse.firstPartyClaims}
                        thirdPartyClaims={dataToUse.thirdPartyClaims}
                        clients={dataToUse.clients}
                        defendants={caseDetail.defendants}
                        casefileId={id}
                        onUpdate={loadData}
                    />
                ) : <Loader2 className="h-8 w-8 animate-spin mx-auto my-8" />;
            case 'clients':
                return dataToUse ? (
                    <ClientList
                        clients={dataToUse.clients}
                        medicalBills={dataToUse.medicalBills}
                        casefileId={id}
                        onUpdate={loadData}
                    />
                ) : <Loader2 className="h-8 w-8 animate-spin mx-auto my-8" />;
            case 'defendant':
                return (
                    <DefendantList
                        defendants={caseDetail.defendants}
                        casefileId={id}
                    />
                );
            case 'work log':
            case 'case notes':
                return dataToUse ? (
                    <WorkLogList logs={dataToUse.workLogs} casefileId={id} onUpdate={loadData} />
                ) : <Loader2 className="h-8 w-8 animate-spin mx-auto my-8" />;
            case 'documents':
                return dataToUse ? (
                    <DocumentList
                        documents={dataToUse.documents}
                        casefileId={id}
                        onUpdate={loadData}
                        onDocumentsChange={handleDocumentsChange}
                    />
                ) : <Loader2 className="h-8 w-8 animate-spin mx-auto my-8" />;
            default:
                return <CaseOverview caseDetail={caseDetail} casefileId={id} onUpdate={loadData} />;
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!caseDetail) {
        return <div className="p-8 text-center text-red-500">Case not found.</div>;
    }

    return (
        <div className="bg-muted/10 min-h-screen">
            <Header pageName="Cases" />
            <div className="p-6 max-w-[1600px] mx-auto">
                <CaseHeader caseDetail={caseDetail} />
                <CaseTabs isLoading={isTabTransitioning} />
                <TabTransition>
                    <div
                        className={`transition-all duration-300 ease-out ${
                            isTabTransitioning
                                ? 'opacity-60 scale-[0.99]'
                                : 'opacity-100 scale-100'
                        }`}
                        key={activeTab}
                    >
                        {renderContent()}
                    </div>
                </TabTransition>
            </div>
        </div>
    );
}

export default function CaseDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <CaseDetailsContent params={params} />
        </Suspense>
    );
}
