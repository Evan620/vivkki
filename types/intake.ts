export interface ClientFormData {
    id?: string;
    isDriver: boolean;
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    ssn: string;
    maritalStatus: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    primaryPhone: string;
    secondaryPhone: string;
    email: string;
    referrer: string;
    referrerRelationship: string;
    injuryDescription: string;
    priorAccidents: string;
    priorInjuries: string;
    workImpact: string;
    // Health insurance (per client)
    hasHealthInsurance: boolean;
    healthInsuranceId: number;
    healthMemberId: string;
    healthAdjusterId?: number;
    healthAdjusterInfo?: {
        first_name: string;
        middle_name?: string;
        last_name: string;
        email: string;
        phone: string;
        fax: string;
        street_address: string;
        city: string;
        state: string;
        zip_code: string;
    };
    // Auto insurance (per client/passenger)
    hasAutoInsurance: boolean;
    autoInsuranceId: number;
    autoPolicyNumber: string;
    autoClaimNumber: string;
    hasMedpay: boolean;
    medpayAmount: string;
    hasUmCoverage: boolean;
    umAmount: string;
    autoAdjusterId?: number;
    autoAdjusterFirstName?: string;
    autoAdjusterLastName?: string;
    autoAdjusterEmail?: string;
    autoAdjusterPhone?: string;
    autoAdjusterInfo?: {
        first_name: string;
        middle_name?: string;
        last_name: string;
        email: string;
        phone: string;
        fax: string;
        street_address: string;
        city: string;
        state: string;
        zip_code: string;
    };
    // Medical providers (per client)
    selectedProviders: number[];
    // Client relationship fields
    relationshipToPrimary: string;
    usesPrimaryAddress: boolean;
    usesPrimaryPhone: boolean;
}

export interface DefendantFormData {
    id?: string;
    firstName: string;
    lastName: string;
    isPolicyholder: boolean;
    policyholderFirstName: string;
    policyholderLastName: string;
    autoInsuranceId: number;
    policyNumber: string;
    claimNumber: string; // Add claim number field
    liabilityPercentage: number;
    notes: string;
    // Defendant relationship tracking
    relatedToDefendantId: number | null;
    relationshipType: string;
    // Adjuster information
    autoAdjusterId?: number;
    adjusterFirstName: string;
    adjusterLastName: string;
    adjusterEmail: string;
    adjusterPhone: string;
    adjusterMailingAddress: string;
    adjusterCity: string;
    adjusterState: string;
    adjusterZipCode: string;
}

export const RELATIONSHIP_TYPES = [
    { value: '', label: 'None / No Relationship' },
    { value: 'Mother', label: 'Mother' },
    { value: 'Father', label: 'Father' },
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Son', label: 'Son' },
    { value: 'Daughter', label: 'Daughter' },
    { value: 'Brother', label: 'Brother' },
    { value: 'Sister', label: 'Sister' },
    { value: 'Guardian', label: 'Guardian' },
    { value: 'Parent', label: 'Parent' },
    { value: 'Child', label: 'Child' },
    { value: 'Other', label: 'Other' },
];

export const CLIENT_RELATIONSHIP_TYPES = [
    { value: '', label: 'Primary Client (Self)' },
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Child', label: 'Child' },
    { value: 'Son', label: 'Son' },
    { value: 'Daughter', label: 'Daughter' },
    { value: 'Parent', label: 'Parent' },
    { value: 'Sibling', label: 'Sibling' },
    { value: 'Brother', label: 'Brother' },
    { value: 'Sister', label: 'Sister' },
    { value: 'Friend', label: 'Friend' },
    { value: 'Other', label: 'Other' },
];

export interface MedicalProviderFormData {
    name: string;
    serviceType: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
}

export interface IntakeFormData {
    // Case information
    dateOfLoss: string;
    timeOfWreck: string;
    wreckType: string;
    wreckStreet: string;
    wreckCity: string;
    wreckCounty: string;
    wreckState: string;
    isPoliceInvolved: boolean;
    policeForce: string;
    isPoliceReport: boolean;
    policeReportNumber: string;
    vehicleDescription: string;
    damageLevel: string;
    wreckDescription: string;
    signUpDate: string;

    // Multiple clients (each with their own insurance and providers)
    clients: ClientFormData[];

    // Medical providers catalog (for selection)
    medicalProviders: MedicalProviderFormData[];

    // Multiple defendants
    defendants: DefendantFormData[];
}

export interface MedicalProvider {
    id: number;
    name: string;
    type: string;
    city: string;
    request_method: string;
    created_at: string;
    // Optional fields for extended details
    street_address?: string;
    state?: string;
    zip_code?: string;
    phone?: string;
    fax?: string;
    email?: string;
    notes?: string;
    temporary?: boolean;
}

export interface FormErrors {
    [key: string]: string;
}

export interface AutoInsurance {
    id: number;
    name: string;
    phone: string;
    city: string;
    state: string;
    created_at: string;
}

export interface HealthInsurance {
    id: number;
    name: string;
    phone: string;
    city: string;
    state: string;
    created_at: string;
}
