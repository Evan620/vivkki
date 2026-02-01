import { reportError } from './errorReporter';

interface ErrorCategory {
  severity: 'critical' | 'error' | 'warn' | 'info';
  message: string;
  recoverable: boolean;
  retrySuggested: boolean;
}

const errorCategories: Array<{ pattern: RegExp; category: ErrorCategory }> = [
  // Network errors
  {
    pattern: /network|fetch|Failed to fetch|ECONNREFUSED/i,
    category: {
      severity: 'error',
      message: 'Network error. Please check your connection and try again.',
      recoverable: true,
      retrySuggested: true,
    },
  },
  
  // Supabase RLS errors
  {
    pattern: /row-level security|policy violation|permission denied for table/i,
    category: {
      severity: 'error',
      message: 'Permission denied. You may not have access to this resource.',
      recoverable: true,
      retrySuggested: false,
    },
  },
  
  // Missing table errors
  {
    pattern: /relation.*does not exist|could not find.*column|column.*does not exist/i,
    category: {
      severity: 'critical',
      message: 'Database configuration error. Please contact support.',
      recoverable: false,
      retrySuggested: false,
    },
  },
  
  // Duplicate errors
  {
    pattern: /duplicate|unique constraint/i,
    category: {
      severity: 'warn',
      message: 'This record already exists.',
      recoverable: true,
      retrySuggested: false,
    },
  },
  
  // Foreign key errors
  {
    pattern: /foreign key|violates foreign key constraint/i,
    category: {
      severity: 'error',
      message: 'Cannot delete: related records exist.',
      recoverable: false,
      retrySuggested: false,
    },
  },
  
  // Not found errors
  {
    pattern: /not found|404/i,
    category: {
      severity: 'info',
      message: 'Record not found. It may have been deleted.',
      recoverable: true,
      retrySuggested: false,
    },
  },
  
  // Permission errors
  {
    pattern: /permission|unauthorized|403/i,
    category: {
      severity: 'error',
      message: 'You do not have permission to perform this action.',
      recoverable: false,
      retrySuggested: false,
    },
  },
  
  // Timeout errors
  {
    pattern: /timeout|Timed out/i,
    category: {
      severity: 'error',
      message: 'Request timed out. Please try again.',
      recoverable: true,
      retrySuggested: true,
    },
  },
  
  // Settlement errors (suppress toasts)
  {
    pattern: /settlement/i,
    category: {
      severity: 'info',
      message: '', // Empty message suppresses toast
      recoverable: true,
      retrySuggested: false,
    },
  },
];

let lastErrorTime = 0;
let identicalErrorCount = 0;
let lastErrorMessage = '';
const RATE_LIMIT_DELAY = 5000; // 5 seconds

export const handleError = (error: any, context: string): string => {
  console.error(`[${context}]`, error);

  const errorMessage = error?.message || String(error);
  const errorObj = error instanceof Error ? error : new Error(errorMessage);

  // Rate limiting - prevent spam
  const now = Date.now();
  if (errorMessage === lastErrorMessage) {
    identicalErrorCount++;
    if (identicalErrorCount > 3) {
      console.warn('[ErrorHandler] Rate limiting identical errors');
      return ''; // Suppress repeated errors
    }
  } else {
    identicalErrorCount = 0;
    lastErrorMessage = errorMessage;
  }

  if (now - lastErrorTime < RATE_LIMIT_DELAY && identicalErrorCount > 1) {
    return ''; // Suppress toast but still report to webhook
  }

  lastErrorTime = now;

  // Find matching category
  for (const { pattern, category } of errorCategories) {
    if (pattern.test(errorMessage)) {
      // Report to webhook
      reportError(errorObj, {
        component: context,
        errorType: category.severity,
      });
      
      return category.message;
    }
  }

  // Default category for unmatched errors
  const defaultCategory: ErrorCategory = {
    severity: 'error',
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    recoverable: true,
    retrySuggested: true,
  };

  // Report to webhook
  reportError(errorObj, {
    component: context,
    errorType: defaultCategory.severity,
  });

  return defaultCategory.message;
};

export const categorizeError = (error: any): ErrorCategory => {
  const errorMessage = error?.message || String(error);
  
  for (const { pattern, category } of errorCategories) {
    if (pattern.test(errorMessage)) {
      return category;
    }
  }
  
  return {
    severity: 'error',
    message: 'An unexpected error occurred.',
    recoverable: true,
    retrySuggested: true,
  };
};
