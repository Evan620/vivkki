// Document Helper Utilities

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'N/A';
  }
}

export function formatSSN(ssn: string | null | undefined): string {
  if (!ssn) return 'N/A';
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return ssn;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function generateCaseName(clients: any[]): string {
  if (!clients || clients.length === 0) return 'Unknown Case';
  if (clients.length === 1) {
    const client = clients[0];
    const firstName = client.firstName || client.first_name || '';
    const lastName = client.lastName || client.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Client';
  }
  // Multiple clients - use primary client or first client
  const primaryClient = clients.find(c => c.client_number === 1) || clients[0];
  const firstName = primaryClient.firstName || primaryClient.first_name || '';
  const lastName = primaryClient.lastName || primaryClient.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Multiple Clients';
}

export function getRecipientEmail(
  templateType: string,
  caseData: {
    client?: any;
    firstPartyClaim?: any;
    thirdPartyClaim?: any;
    healthClaim?: any;
    healthAdjuster?: any;
    medicalProvider?: any;
  },
  selectedParty?: 'first' | 'third'
): string | null {
  // For 1st party LOR
  if (templateType === 'cotton_1st_party_lor' || selectedParty === 'first') {
    return caseData.firstPartyClaim?.adjuster_email || 
           caseData.firstPartyClaim?.auto_adjusters?.[0]?.email || 
           null;
  }

  // For 3rd party LOR
  if (templateType === 'cotton_3rd_party_lor' || selectedParty === 'third') {
    return caseData.thirdPartyClaim?.adjuster_email || 
           caseData.thirdPartyClaim?.auto_adjusters?.[0]?.email || 
           null;
  }

  // For HIPAA
  if (templateType === 'cotton_hipaa_request') {
    return caseData.medicalProvider?.email || null;
  }

  // For subro
  if (templateType === 'cotton_subro_letter') {
    return caseData.healthAdjuster?.email || 
           caseData.healthClaim?.health_adjusters?.[0]?.email || 
           null;
  }

  return null;
}
