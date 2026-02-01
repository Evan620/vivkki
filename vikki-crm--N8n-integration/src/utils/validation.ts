export const validateEmail = (email: string): string | undefined => {
  // Email is optional, but if provided, must be valid format
  if (!email || email.trim() === '') return undefined;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Invalid email format';
  return undefined;
};

export const validatePhone = (phone: string): string | undefined => {
  if (!phone) return 'Phone is required';
  const phoneRegex = /^\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  if (!phoneRegex.test(phone.replace(/[-()\s]/g, ''))) {
    return 'Invalid phone format';
  }
  return undefined;
};

export const validateZipCode = (zip: string): string | undefined => {
  if (!zip) return 'Zip code is required';
  if (!/^\d{5}$/.test(zip)) return 'Zip code must be 5 digits';
  return undefined;
};

export const validateSSN = (ssn: string): string | undefined => {
  if (!ssn) return 'SSN is required';
  const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
  if (!ssnRegex.test(ssn)) return 'Invalid SSN format (XXX-XX-XXXX)';
  return undefined;
};

export const validateDateNotFuture = (date: string): string | undefined => {
  if (!date) return 'Date is required';
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate > today) return 'Date cannot be in the future';
  return undefined;
};

export const validateRequired = (value: string, fieldName: string): string | undefined => {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return undefined;
};

export const formatPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
};

export const formatSSN = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
};
