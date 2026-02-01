/**
 * Settlement Distribution Calculator
 * 
 * Calculates settlement distribution based on defendant liability percentages.
 * Handles multi-defendant scenarios where each defendant pays their allocated percentage.
 */

import { Defendant } from '../types';

export interface SettlementAllocation {
  defendantId: number;
  defendantName: string;
  liabilityPercentage: number;
  grossAmount: number;
  attorneyFee: number;
  caseExpenses: number;
  medicalLiens: number;
  netAmount: number;
}

export interface SettlementDistribution {
  totalSettlement: number;
  attorneyFeePercentage: number;
  totalAttorneyFee: number;
  totalCaseExpenses: number;
  totalMedicalLiens: number;
  allocations: SettlementAllocation[];
  clientNetTotal: number;
}

/**
 * Calculate settlement distribution based on defendant liability percentages
 * 
 * @param defendants - Array of defendants with liability percentages
 * @param totalSettlement - Total gross settlement amount
 * @param attorneyFeePercentage - Attorney fee percentage (default 33.33%)
 * @param caseExpenses - Total case expenses to be distributed
 * @param medicalLiens - Total medical liens to be distributed
 * @returns Settlement distribution breakdown
 */
export function calculateSettlementDistribution(
  defendants: Defendant[],
  totalSettlement: number,
  attorneyFeePercentage: number = 33.33,
  caseExpenses: number = 0,
  medicalLiens: number = 0
): SettlementDistribution {
  // Validate liability percentages total 100%
  const totalLiability = defendants.reduce(
    (sum, d) => sum + (d.liabilityPercentage || 100 / defendants.length),
    0
  );

  if (Math.abs(totalLiability - 100) > 0.01) {
    console.warn(
      `Liability percentages total ${totalLiability}%, not 100%. Results may not be accurate.`
    );
  }

  // Calculate allocation for each defendant
  const allocations: SettlementAllocation[] = defendants.map((defendant) => {
    const liabilityPercent = defendant.liabilityPercentage || 100 / defendants.length;
    
    // Allocate gross settlement based on liability percentage
    const grossAmount = (totalSettlement * liabilityPercent) / 100;
    
    // Calculate attorney fee for this defendant's portion
    const attorneyFee = (grossAmount * attorneyFeePercentage) / 100;
    
    // Allocate case expenses proportionally
    const proportionalCaseExpenses = (caseExpenses * liabilityPercent) / 100;
    
    // Allocate medical liens proportionally
    const proportionalMedicalLiens = (medicalLiens * liabilityPercent) / 100;
    
    // Calculate net amount after deductions
    const netAmount = grossAmount - attorneyFee - proportionalCaseExpenses - proportionalMedicalLiens;
    
    return {
      defendantId: defendant.id,
      defendantName: `${defendant.firstName} ${defendant.lastName}`,
      liabilityPercentage: liabilityPercent,
      grossAmount,
      attorneyFee,
      caseExpenses: proportionalCaseExpenses,
      medicalLiens: proportionalMedicalLiens,
      netAmount
    };
  });

  // Calculate totals
  const totalAttorneyFee = allocations.reduce((sum, a) => sum + a.attorneyFee, 0);
  const totalCaseExpensesDistributed = allocations.reduce((sum, a) => sum + a.caseExpenses, 0);
  const totalMedicalLiensDistributed = allocations.reduce((sum, a) => sum + a.medicalLiens, 0);
  const clientNetTotal = allocations.reduce((sum, a) => sum + a.netAmount, 0);

  return {
    totalSettlement,
    attorneyFeePercentage,
    totalAttorneyFee,
    totalCaseExpenses: totalCaseExpensesDistributed,
    totalMedicalLiens: totalMedicalLiensDistributed,
    allocations,
    clientNetTotal
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Generate settlement distribution summary for display
 */
export function generateDistributionSummary(distribution: SettlementDistribution): string {
  const lines: string[] = [];
  
  lines.push(`📊 Settlement Distribution Summary`);
  lines.push(`\n`);
  lines.push(`**Total Gross Settlement:** ${formatCurrency(distribution.totalSettlement)}`);
  lines.push(`**Attorney Fee (${distribution.attorneyFeePercentage}%):** ${formatCurrency(distribution.totalAttorneyFee)}`);
  lines.push(`**Case Expenses:** ${formatCurrency(distribution.totalCaseExpenses)}`);
  lines.push(`**Medical Liens:** ${formatCurrency(distribution.totalMedicalLiens)}`);
  lines.push(`**Client Net Total:** ${formatCurrency(distribution.clientNetTotal)}`);
  lines.push(`\n`);
  lines.push(`**Defendant Allocations:**`);
  
  distribution.allocations.forEach((alloc, index) => {
    lines.push(`\n${index + 1}. ${alloc.defendantName} (${alloc.liabilityPercentage}% liability)`);
    lines.push(`   • Gross Amount: ${formatCurrency(alloc.grossAmount)}`);
    lines.push(`   • Attorney Fee: ${formatCurrency(alloc.attorneyFee)}`);
    lines.push(`   • Case Expenses: ${formatCurrency(alloc.caseExpenses)}`);
    lines.push(`   • Medical Liens: ${formatCurrency(alloc.medicalLiens)}`);
    lines.push(`   • **Net to Client: ${formatCurrency(alloc.netAmount)}**`);
  });
  
  return lines.join('\n');
}

