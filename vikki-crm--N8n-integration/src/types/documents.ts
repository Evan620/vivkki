import { GenerationType, DefaultSelection, TemplateRule } from '../config/document-templates';

export { GenerationType, DefaultSelection, TemplateRule };

// Document generation payload interfaces
export interface BasePayload {
  template_type: string;
  case_id: number;
  case_number: string;
  [key: string]: any; // Allow additional fields
}

export interface PerClientPayload extends BasePayload {
  generation_mode: 'per_client';
  primary_client: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    [key: string]: any; // Additional client fields
  };
  case_context: {
    allClients: Array<{
      id: number;
      firstName: string;
      lastName: string;
      isDriver: boolean;
    }>;
  };
  document_name: string;
}

export interface AllClientsPayload extends BasePayload {
  generation_mode: 'all_clients';
  clients: Array<{
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    [key: string]: any; // Additional client fields
  }>;
  case_details: {
    totalClients: number;
    caseNumber: string;
    [key: string]: any; // Additional case fields
  };
  document_name: string;
}

export interface CaseLevelPayload extends BasePayload {
  generation_mode: 'case_level';
  case_details: {
    [key: string]: any; // Case fields
  };
  document_name: string;
}

export type DocumentPayload = PerClientPayload | AllClientsPayload | CaseLevelPayload;

// Document generation status
export interface GenerationStatus {
  templateType: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  progress?: number; // For per-client: current/total (e.g., 2/3)
  message?: string;
  pdfUrl?: string;
  error?: string;
}

