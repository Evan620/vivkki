/**
 * Calculation utilities for Vikki CRM
 * 
 * Provides functions for calculating case metrics, deadlines, and financial totals
 * used throughout the application for case management and reporting.
 */

// We will define these types in types/index.ts, but for now we use any to avoid circular deps if needed
// or just import them after we create the types file.
// For the utility file, we can keep it loose or import properly. Let's use any for flexibility during migration.

/**
 * Calculate medical bill balance due
 * @param bill - Medical bill object
 * @returns Balance due amount
 */
export function calculateMedicalBillBalance(bill: any): number {
    const amountBilled = parseFloat(bill.amountBilled || bill.amount_billed || bill.total_billed || 0) || 0;
    const insurancePaid = parseFloat(bill.insurancePaid || bill.insurance_paid || 0) || 0;
    const insuranceAdjusted = parseFloat(bill.insuranceAdjusted || bill.insurance_adjusted || 0) || 0;
    const medpayPaid = parseFloat(bill.medpayPaid || bill.medpay_paid || 0) || 0;
    const patientPaid = parseFloat(bill.patientPaid || bill.patient_paid || 0) || 0;
    const reductionAmount = parseFloat(bill.reductionAmount || bill.reduction_amount || 0) || 0;
    const piExpense = parseFloat(bill.piExpense || bill.pi_expense || 0) || 0;

    const balance = amountBilled - insurancePaid - insuranceAdjusted - medpayPaid - patientPaid - reductionAmount - piExpense;

    // Return 0 if NaN or negative
    return isNaN(balance) ? 0 : Math.max(0, balance);
}

// Alias for backwards compatibility
export const calculateMedicalBillBalanceDue = calculateMedicalBillBalance;

/**
 * Format currency
 */
export function formatCurrency(amount: number | string | undefined | null): string {
    if (amount === undefined || amount === null) return '$0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(num);
}
