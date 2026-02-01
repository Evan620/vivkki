/**
 * Base-to-Stage Mapping System
 * 
 * Maps case stages and statuses to the three bases used in State of the Union (SOU) reports:
 * - 1st Base: Intake stage
 * - 2nd Base: Processing stage
 * - 3rd Base: Demand stage
 */

export type BaseName = '1st Base' | '2nd Base' | '3rd Base';

export interface BaseMapping {
  stage: string;
  statuses: readonly string[];
  isComplete: (status: string) => boolean;
}

export const BASE_MAPPING: Record<BaseName, BaseMapping> = {
  '1st Base': {
    stage: 'Intake',
    statuses: ['New', 'Incomplete'] as const,
    isComplete: (status: string) => status === 'New'
  },
  '2nd Base': {
    stage: 'Processing',
    statuses: ['Treating', 'Awaiting B&R', 'Awaiting Subro'] as const,
    isComplete: (status: string) => status === 'Awaiting Subro' // Last status in base
  },
  '3rd Base': {
    stage: 'Demand',
    statuses: [
      'Ready for Demand',
      'Demand Sent',
      'Counter Received',
      'Counter Sent',
      'Reduction Sent',
      'Proposed Settlement Statement Sent',
      'Release Sent',
      'Payment Instructions Sent'
    ] as const,
    isComplete: (status: string) => status === 'Payment Instructions Sent'
  }
};

/**
 * Get the base name for a given stage
 */
export function getBaseForStage(stage: string): BaseName | null {
  for (const [baseName, mapping] of Object.entries(BASE_MAPPING)) {
    if (mapping.stage === stage) {
      return baseName as BaseName;
    }
  }
  return null;
}

/**
 * Get base completion status for a case
 * Returns "Complete" if base is complete, otherwise returns current status
 */
export function getBaseStatus(stage: string, status: string, baseName: BaseName): 'Complete' | string {
  const base = BASE_MAPPING[baseName];
  
  // Check if case is in this base's stage
  if (base.stage !== stage) {
    // If case is in a later stage, this base is complete
    const baseOrder = ['1st Base', '2nd Base', '3rd Base'];
    const currentBaseIndex = baseOrder.findIndex(b => BASE_MAPPING[b as BaseName].stage === stage);
    const targetBaseIndex = baseOrder.indexOf(baseName);
    
    if (currentBaseIndex > targetBaseIndex) {
      return 'Complete';
    }
    // If case is in an earlier stage, this base hasn't started
    return 'Not Started';
  }
  
  // Case is in this base's stage - check if complete
  if (base.isComplete(status)) {
    return 'Complete';
  }
  
  // Return current status
  return status;
}

/**
 * Get all three base statuses for a case
 */
export function getAllBaseStatuses(stage: string, status: string): {
  firstBase: 'Complete' | string;
  secondBase: 'Complete' | string;
  thirdBase: 'Complete' | string;
} {
  return {
    firstBase: getBaseStatus(stage, status, '1st Base'),
    secondBase: getBaseStatus(stage, status, '2nd Base'),
    thirdBase: getBaseStatus(stage, status, '3rd Base')
  };
}

/**
 * Check if a status belongs to a specific base
 */
export function isStatusInBase(status: string, baseName: BaseName): boolean {
  const base = BASE_MAPPING[baseName];
  return base.statuses.includes(status as any);
}


