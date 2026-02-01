export interface Casefile {
  id: number;
  stage: 'Intake' | 'Processing' | 'Demand' | 'Closed';
  status: 'New' | 'Incomplete' | 'Treating' | 'Awaiting B&R' | 'Awaiting Subro' | 'Ready for Demand' | 'Demand Sent' | 'Counter Received' | 'Counter Sent' | 'Reduction Sent' | 'Proposed Settlement Statement Sent' | 'Release Sent' | 'Payment Instructions Sent' | 'Closed';
  clientCount: number;
  defendantCount: number;
  dateOfLoss: string;
  timeOfWreck: string;
  wreckType: string;
  wreckStreet: string;
  wreckCity: string;
  wreckState: string;
  wreckCounty: string;
  wreckDescription: string;
  isPoliceInvolved: boolean;
  policeForce: string;
  isPoliceReport: boolean;
  policeReportNumber: string;
  vehicleDescription: string;
  damageLevel: string;
  wreckNotes: string;
  signUpDate: string;
  statuteDeadline: string;
  daysUntilStatute: number;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: number;
  casefileId: number;
  clientNumber: number;
  clientOrder: number;
  isDriver: boolean;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  ssn: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  maritalStatus: string;
  injuryDescription: string;
  priorAccidents: string;
  priorInjuries: string;
  workImpact: string;
  referrer: string;
  referrerRelationship: string;
  hasHealthInsurance: boolean;
}

export interface Defendant {
  id: number;
  casefileId: number;
  defendantNumber: number;
  firstName: string;
  lastName: string;
  isPolicyholder: boolean;
  policyholderFirstName: string;
  policyholderLastName: string;
  autoInsuranceId: number;
  policyNumber: string;
  liabilityPercentage: number;
  notes: string;
  relatedToDefendantId?: number | null;
  relationshipType?: string;
}

export interface WorkLogEntry {
  id: number;
  casefileId: number;
  description: string;
  timestamp: string;
  userName: string;
}

export interface MedicalBill {
  id: number;
  clientId: number;
  medicalProviderId: number;
  amountBilled: number;
  insurancePaid: number;
  insuranceAdjusted: number;
  medpayPaid: number;
  patientPaid: number;
  reductionAmount: number;
  piExpense: number;
  balanceDue: number;
  hipaaSent: boolean;
  billReceived: boolean;
  recordsReceived: boolean;
  lienFiled: boolean;
  inCollections: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AutoAdjuster {
  id: number;
  thirdPartyClaimId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mailingAddress: string;
  city: string;
  state: string;
  zipCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedDocument {
  id: number;
  casefileId: number;
  documentType: string;
  documentName: string;
  filePath: string;
  fileUrl?: string;
  generatedBy?: string;
  generatedAt: string;
  metadata: Record<string, any>;
}

export interface MedicalProviderCatalog {
  id: number;
  name: string;
  type?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  fax?: string;
  email?: string;
  request_method?: string;
}

export interface CasefileWithDetails extends Casefile {
  clients: Client[];
  defendants: Defendant[];
  workLogs: WorkLogEntry[];
  medicalBills: MedicalBill[];
  autoAdjusters: AutoAdjuster[];
  generatedDocuments: GeneratedDocument[];
}

export interface Database {
  casefiles: Casefile[];
  clients: Client[];
  defendants: Defendant[];
  workLogs: WorkLogEntry[];
  medicalBills: MedicalBill[];
  autoAdjusters: AutoAdjuster[];
  generatedDocuments: GeneratedDocument[];
}
