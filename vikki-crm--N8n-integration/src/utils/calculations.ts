/**
 * Calculation utilities for Vikki CRM
 * 
 * Provides functions for calculating case metrics, deadlines, and financial totals
 * used throughout the application for case management and reporting.
 */

import type { Client, MedicalBill } from '../types';

/**
 * Calculate days open since sign-up date
 * @param signUpDate - Date when client signed up (ISO string)
 * @returns Number of days since sign-up
 */
export function calculateDaysOpen(signUpDate: string): number {
  const today = new Date();
  const signup = new Date(signUpDate);
  return Math.floor((today.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate statute deadline (accident date + 2 years)
 * @param accidentDate - Date of accident (ISO string)
 * @returns Statute deadline date (ISO string)
 */
export function calculateStatuteDeadline(accidentDate: string): string {
  const accident = new Date(accidentDate);
  accident.setFullYear(accident.getFullYear() + 2);
  return accident.toISOString().split('T')[0];
}

/**
 * Calculate days remaining until statute deadline
 * @param statuteDeadline - Statute deadline date (ISO string or Date)
 * @returns Number of days until deadline (negative if past deadline), or null if invalid
 */
export function calculateDaysUntilStatute(statuteDeadline: string | Date | null | undefined): number | null {
  if (!statuteDeadline) return null;
  
  const today = new Date();
  const deadline = new Date(statuteDeadline);
  
  // Check if date is valid
  if (isNaN(deadline.getTime())) {
    console.warn('Invalid statute deadline date:', statuteDeadline);
    return null;
  }
  
  return Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate medical bill balance due
 * @param bill - Medical bill object
 * @returns Balance due amount
 */
export function calculateMedicalBillBalance(bill: MedicalBill | any): number {
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
 * Generate case name from clients
 * @param clients - Array of client objects
 * @returns Case name (e.g., "Smith Family" or "Smith-Jones Family")
 * 
 * Rules:
 * 1. Driver's last name comes FIRST
 * 2. Then passengers in order entered (by client_order)
 * 3. If all clients share the same last name, show "LastName Family"
 * 4. If different last names, show hyphenated names + "Family"
 * 
 * Examples:
 * - Jane Smith (driver) + Tommy Smith + Sarah Smith → "Smith Family"
 * - John Johnson (driver) + Sarah Smith + Mike Williams → "Johnson-Smith-Williams Family"
 * - Maina (driver) + Maina + Maina → "Maina Family"
 */
export function generateCaseName(clients: Client[]): string {
  if (!clients || clients.length === 0) return 'Unknown';
  
  // Step 1: Sort clients: driver first, then by order entered
  const sortedClients = [...clients].sort((a, b) => {
    // Driver always first
    if (a.isDriver && !b.isDriver) return -1;
    if (!a.isDriver && b.isDriver) return 1;
    // Then by client_order (the order they were entered)
    return (a.clientOrder || 0) - (b.clientOrder || 0);
  });
  
  // Step 2: Extract last names - handle undefined/null gracefully
  const lastNames = sortedClients
    .map(c => {
      const lastName = c.lastName || c.last_name || '';
      return typeof lastName === 'string' ? lastName.trim() : '';
    })
    .filter(name => name !== '');
  
  // Step 3: Handle case naming
  if (lastNames.length === 0) {
    // If no last names, try using first names as fallback
    const firstNames = sortedClients
      .map(c => {
        const firstName = c.firstName || c.first_name || '';
        return typeof firstName === 'string' ? firstName.trim() : '';
      })
      .filter(name => name !== '');
    
    if (firstNames.length === 0) return 'Unknown';
    
    // Check if all first names are the same
    const uniqueFirstNames = [...new Set(firstNames)];
    if (uniqueFirstNames.length === 1) {
      return `${uniqueFirstNames[0]} Family`;
    }
    // Different first names - just join with hyphens
    return firstNames.join('-');
  }
  
  // Step 4: Check if all last names are the same
  const uniqueLastNames = [...new Set(lastNames)];
  if (uniqueLastNames.length === 1) {
    // All clients share the same last name
    // Only add "Family" if there's more than one client
    if (lastNames.length > 1) {
      return `${uniqueLastNames[0]} Family`;
    }
    // Single client - just the last name
    return uniqueLastNames[0];
  }
  
  // Different last names - show hyphenated without "Family"
  return lastNames.join('-');
}

/**
 * Calculate total medical bills for a client
 * @param bills - Array of medical bills
 * @param clientId - Client ID to filter by
 * @returns Object with totals for the client
 */
export function calculateClientMedicalTotals(bills: MedicalBill[], clientId: number) {
  const clientBills = bills.filter(bill => bill.clientId === clientId);
  
  return {
    totalBilled: clientBills.reduce((sum, bill) => sum + bill.amountBilled, 0),
    totalPaid: clientBills.reduce((sum, bill) => sum + (bill.insurancePaid || 0) + (bill.medpayPaid || 0) + (bill.patientPaid || 0), 0),
    totalAdjusted: clientBills.reduce((sum, bill) => sum + (bill.insuranceAdjusted || 0) + (bill.reductionAmount || 0), 0),
    totalBalance: clientBills.reduce((sum, bill) => sum + bill.balanceDue, 0),
    billCount: clientBills.length
  };
}

/**
 * Calculate total medical bills for entire case
 * @param bills - Array of medical bills
 * @returns Object with case totals
 */
export function calculateCaseMedicalTotals(bills: MedicalBill[]) {
  return {
    totalBilled: bills.reduce((sum, bill) => sum + bill.amountBilled, 0),
    totalPaid: bills.reduce((sum, bill) => sum + (bill.insurancePaid || 0) + (bill.medpayPaid || 0) + (bill.patientPaid || 0), 0),
    totalAdjusted: bills.reduce((sum, bill) => sum + (bill.insuranceAdjusted || 0) + (bill.reductionAmount || 0), 0),
    totalBalance: bills.reduce((sum, bill) => sum + bill.balanceDue, 0),
    billCount: bills.length
  };
}

/**
 * Check if a case has a statute alert (≤90 days or expired)
 * @param daysUntilStatute - Days until statute deadline (can be null)
 * @returns True if case has statute alert
 */
export function hasStatuteAlert(daysUntilStatute: number | null): boolean {
  if (daysUntilStatute === null) return false;
  return daysUntilStatute <= 90; // Includes expired cases (≤0) and urgent cases (≤90)
}

/**
 * Get statute alert level based on days remaining
 * @param daysUntilStatute - Days until statute deadline
 * @returns Alert level: 'critical', 'warning', 'caution', or 'normal'
 */
export function getStatuteAlertLevel(daysUntilStatute: number): 'critical' | 'warning' | 'caution' | 'normal' {
  if (daysUntilStatute < 0) return 'critical'; // Past deadline
  if (daysUntilStatute <= 90) return 'critical'; // Under 90 days
  if (daysUntilStatute <= 180) return 'warning'; // 90-180 days
  if (daysUntilStatute <= 365) return 'caution'; // 180-365 days
  return 'normal'; // Over 1 year
}

/**
 * Format statute deadline for display
 * @param statuteDeadline - Statute deadline date (ISO string)
 * @returns Formatted date string
 */
export function formatStatuteDeadline(statuteDeadline: string): string {
  const date = new Date(statuteDeadline);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate liability distribution for multiple defendants
 * @param defendants - Array of defendants with liability percentages
 * @returns Object with liability validation and totals
 */
export function calculateLiabilityDistribution(defendants: Array<{ liabilityPercentage: number }>) {
  const totalLiability = defendants.reduce((sum, defendant) => sum + defendant.liabilityPercentage, 0);
  
  return {
    totalLiability,
    isValid: totalLiability === 100,
    isOver: totalLiability > 100,
    isUnder: totalLiability < 100,
    difference: Math.abs(100 - totalLiability)
  };
}