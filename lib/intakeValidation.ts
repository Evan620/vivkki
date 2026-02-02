import type { IntakeFormData, FormErrors, ClientFormData, DefendantFormData } from '@/types/intake';

export const validateStep1 = (data: IntakeFormData): FormErrors => {
    const errors: FormErrors = {};
    if (!data.dateOfLoss) errors.dateOfLoss = 'Date of loss is required';
    if (!data.timeOfWreck) errors.timeOfWreck = 'Time of wreck is required';
    if (!data.wreckState) errors.wreckState = 'State is required';
    if (!data.wreckCity) errors.wreckCity = 'City is required';
    // Add other required fields validation
    return errors;
};

export const validateStep2 = (data: IntakeFormData): FormErrors => {
    const errors: FormErrors = {};
    if (!data.clients || data.clients.length === 0) {
        errors.clients = 'At least one client is required';
    } else {
        data.clients.forEach((client, index) => {
            if (!client.firstName) errors[`clients.${index}.firstName`] = 'First name is required';
            if (!client.lastName) errors[`clients.${index}.lastName`] = 'Last name is required';
            if (!client.dateOfBirth) errors[`clients.${index}.dateOfBirth`] = 'Date of birth is required';
            // Phone, etc.
        });
    }
    return errors;
};

export const validateStep3 = (data: IntakeFormData): FormErrors => {
    const errors: FormErrors = {};
    // Validation for medical providers if needed
    return errors;
};

export const validateStep4 = (data: IntakeFormData): FormErrors => {
    const errors: FormErrors = {};
    // Validation for insurance if needed
    return errors;
};

export const validateStep5 = (data: IntakeFormData): FormErrors => {
    const errors: FormErrors = {};
    const totalLiability = data.defendants.reduce((sum, def) => sum + (def.liabilityPercentage || 0), 0);
    if (totalLiability !== 100) {
        errors.defendants = `Total liability must equal 100% (Current: ${totalLiability}%)`;
    }
    return errors;
};

export const validateIntakeForm = (step: number, data: IntakeFormData): FormErrors => {
    switch (step) {
        case 1: return validateStep1(data);
        case 2: return validateStep2(data);
        case 3: return validateStep3(data);
        case 4: return validateStep4(data);
        case 5: return validateStep5(data);
        default: return {};
    }
};
