export interface MedicalProvider {
    id: number;
    name: string;
    type: string;
    city: string;
    state: string;
    zip_code?: string;
    street_address?: string;
    phone?: string;
    fax?: string;
    email?: string;
    address?: string; // Legacy support
    request_method: 'Email' | 'Fax' | 'Mail';
    notes?: string;
}

export interface Client {
    id: number;
    casefile_id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email?: string;
    primary_phone?: string;
    secondary_phone?: string;
    date_of_birth?: string;
    ssn?: string;
    marital_status?: string;
    is_driver?: boolean;

    // Address
    street_address?: string; // or address in some places?
    city?: string;
    state?: string;
    zip_code?: string;
    address?: string; // Legacy usage fallback

    // Medical Info
    injury_description?: string;
    prior_accidents?: string;
    prior_injuries?: string;
    work_impact?: string;

    // Referral
    referrer?: string;
    referrer_relationship?: string;

    client_order?: number;
}

export interface MedicalBill {
    id: number;
    client_id: number;
    medical_provider_id: number;
    medical_provider?: MedicalProvider;
    client?: Client;

    // Status flags
    hipaa_sent: boolean;
    bill_received: boolean;
    records_received: boolean;

    // Financials
    total_billed: number;
    insurance_paid: number;
    insurance_adjusted: number;
    medpay_paid: number;
    patient_paid: number;
    reduction_amount: number;
    pi_expense: number;
    balance_due: number;

    // Dates & Info
    date_of_service?: string;
    bill_number?: string;
    notes?: string;
}

export interface HealthClaim {
    id: number;
    client_id: number;
    health_insurance_id: number;
    policy_number?: string;
    group_number?: string;
    claim_number?: string;
    amount_billed?: number;
    amount_paid?: number;
    notes?: string;
    health_insurance?: {
        name: string;
        phone?: string;
        email?: string;
        street_address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
    };
    health_adjuster?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        fax?: string;
    };
    health_adjusters?: any[];
}

export interface CaseDetail {
    id: string;
    caseNumber: string;
    name: string;
    ssn: string;
    stage: string;
    status: string;
    dateOfLoss: string;
    createdDate: string;
    updatedDate: string;
    daysOpen: number;
    statuteDate: string;
    statuteDaysLeft: number;
    medicalProvidersCount: number;
    totalBilled: number;
    outstandingRecords: number;

    // Accident Details
    timeOfWreck?: string;
    wreckType?: string;
    wreckStreet?: string;
    wreckCity?: string;
    wreckCounty?: string;
    wreckState?: string;
    isPoliceInvolved?: boolean;
    policeForce?: string;
    isPoliceReport?: boolean;
    policeReportNumber?: string;
    vehicleDescription?: string;
    damageLevel?: string;
    wreckDescription?: string;

    clients: {
        id: string;
        name: string;
        role: string;
    }[];
    // Defendants
    defendants: {
        id: string;
        first_name: string;
        last_name: string;
        defendant_number?: number; // Order
        liability_percentage?: number;
        is_policyholder?: boolean;
        policyholder_first_name?: string;
        policyholder_last_name?: string;
        relationship_type?: string;
        related_to_defendant_id?: number;

        // Contact
        email?: string;
        phone_number?: string;

        // Insurance (Direct or via Relation)
        auto_insurance_id?: number;
        auto_insurance?: { name: string };
        policy_number?: string;
        claim_number?: string;
        notes?: string;

        // Nested Relations
        auto_adjusters?: {
            id: number;
            first_name: string;
            last_name: string;
            email?: string;
            phone?: string;
            fax?: string;
            mailing_address?: string;
            city?: string;
            state?: string;
            zip_code?: string;
        }[];

        third_party_claim?: {
            id: number;
            lor_sent?: boolean;
            loa_received?: boolean;
            last_request_date?: string;
        };
    }[];
    balanceDue: number;
    settlement: {
        gross: number;
        attorneyFee: number;
        caseExpenses: number;
        medicalLiens: number;
        clientNet: number;
        date: string;
        status: string;
    };
    recentActivity: {
        id: string;
        type: 'note' | 'status_change' | 'document' | 'info_update';
        content: string;
        author: string;
        date: string;
    }[];
}

export interface FirstPartyClaim {
    id: number;
    client_id: number;
    auto_insurance_id?: number;
    auto_insurance?: { name: string };
    policy_number?: string;
    claim_number?: string;

    // Adjuster (legacy fields)
    adjuster_name?: string;
    adjuster_email?: string;
    adjuster_phone?: string;
    adjuster_fax?: string;

    // Auto adjusters array
    auto_adjusters?: any[];

    // Coverages
    pip_available?: number;
    pip_used?: number;
    med_pay_available?: number;
    med_pay_used?: number;
    um_uim_coverage?: string;
    property_damage?: number;
}

export interface ThirdPartyClaim {
    id: number;
    defendant_id: number;
    auto_insurance_id?: number;
    auto_insurance?: { name: string };
    policy_number?: string;
    claim_number?: string;

    // Adjuster (legacy fields)
    adjuster_name?: string;
    adjuster_email?: string;
    adjuster_phone?: string;
    adjuster_fax?: string;

    // Auto adjusters array
    auto_adjusters?: any[];

    // Liability
    policy_limits?: number;
    liability_disputed?: boolean;

    // Settlement
    demand_amount?: number;
    offer_amount?: number;
    settlement_amount?: number;
    demand_date?: string;
    offer_date?: string;
    settlement_date?: string;
    notes?: string;
}

