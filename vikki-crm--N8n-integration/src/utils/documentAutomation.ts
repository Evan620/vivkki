interface HipaaRequestData {
  casefileId: number;
  clientData: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    date_of_birth?: string;
    ssn?: string;
    street_address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    primary_phone?: string;
    email?: string;
  };
  providerData: {
    id: number;
    name: string;
    type: string;
    city: string;
  };
}

interface GenerateDocumentResponse {
  success: boolean;
  error?: string;
  documentUrl?: string;
}

export const generateHipaaRequest = async (
  data: HipaaRequestData
): Promise<GenerateDocumentResponse> => {
  try {
    const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

    if (!n8nWebhookUrl) {
      console.error('N8N webhook URL not configured');
      return {
        success: false,
        error: 'Document automation is not configured. Please contact your administrator.',
      };
    }

    const payload = {
      documentType: 'hipaa_template',
      casefileId: data.casefileId,
      client: {
        firstName: data.clientData.first_name,
        lastName: data.clientData.last_name,
        middleName: data.clientData.middle_name || '',
        dateOfBirth: data.clientData.date_of_birth || '',
        ssn: data.clientData.ssn || '',
        address: {
          street: data.clientData.street_address || '',
          city: data.clientData.city || '',
          state: data.clientData.state || '',
          zipCode: data.clientData.zip_code || '',
        },
        phone: data.clientData.primary_phone || '',
        email: data.clientData.email || '',
      },
      provider: {
        id: data.providerData.id,
        name: data.providerData.name,
        type: data.providerData.type,
        city: data.providerData.city,
      },
      generatedDate: new Date().toISOString(),
    };

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('N8N webhook error:', errorText);
      return {
        success: false,
        error: `Failed to generate document: ${response.statusText}`,
      };
    }

    const result = await response.json();

    return {
      success: true,
      documentUrl: result.documentUrl || result.url,
    };
  } catch (error) {
    console.error('Error calling document automation webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
};
