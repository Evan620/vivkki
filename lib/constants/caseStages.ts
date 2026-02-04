/**
 * Case stage and status constants
 * 
 * Defines valid stages and their associated statuses for case management.
 * These constants ensure consistency across the application.
 */

export const CASE_STAGES = ['Intake', 'Processing', 'Demand', 'Closed'] as const;

export type CaseStage = typeof CASE_STAGES[number];

export const CASE_STATUSES: Record<CaseStage, readonly string[]> = {
    Intake: ['New', 'Incomplete'] as const,
    Processing: ['Treating', 'Awaiting B&R', 'Awaiting Subro'] as const,
    Demand: [
        'Ready for Demand',
        'Demand Sent',
        'Counter Received',
        'Counter Sent',
        'Reduction Sent',
        'Proposed Settlement Statement Sent',
        'Release Sent',
        'Payment Instructions Sent'
    ] as const,
    Closed: ['Closed'] as const,
} as const;

/**
 * Get valid statuses for a given stage
 */
export function getStatusesForStage(stage: CaseStage | string): readonly string[] {
    return CASE_STATUSES[stage as CaseStage] || [];
}

/**
 * Check if a status is valid for a given stage
 */
export function isValidStatusForStage(stage: CaseStage | string, status: string): boolean {
    const validStatuses = getStatusesForStage(stage);
    return validStatuses.includes(status);
}

/**
 * Get all valid statuses across all stages
 */
export function getAllStatuses(): readonly string[] {
    const allStatuses = new Set<string>();
    Object.values(CASE_STATUSES).forEach(statuses => {
        statuses.forEach(status => allStatuses.add(status));
    });
    return Array.from(allStatuses);
}
