export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return 'Not provided';

  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
}

export function maskSSN(ssn: string | null | undefined): string {
  if (!ssn) return 'Not provided';

  const cleaned = ssn.replace(/\D/g, '');

  if (cleaned.length === 9) {
    return `***-**-${cleaned.slice(5)}`;
  }

  return 'Invalid SSN';
}

export function formatSSN(ssn: string | null | undefined): string {
  if (!ssn) return 'Not provided';

  const cleaned = ssn.replace(/\D/g, '');

  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }

  return ssn;
}

export function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatDateForInput(date: string | null | undefined): string {
  if (!date) return '';

  try {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}
