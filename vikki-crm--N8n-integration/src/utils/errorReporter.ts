/**
 * Error Reporter
 * Sends error reports to webhook for monitoring and debugging
 */

interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: string;
  userAgent: string;
  url: string;
  screenSize: string;
  viewportSize: string;
  userId?: string;
  casefileId?: string;
  currentPage: string;
  component?: string;
  errorType: 'error' | 'warn' | 'info' | 'critical';
}

class ErrorReporter {
  private webhookUrl = import.meta.env.VITE_ERROR_WEBHOOK_URL;
  private errorQueue: ErrorReport[] = [];
  private maxQueueSize = 100;
  private lastSent = 0;
  private sendInterval = 10000; // 10 seconds
  private sessionErrorCount = 0;
  private maxErrorsPerSession = 100;
  private isSending = false;

  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
    };
  }

  private getCurrentPage(): string {
    const path = window.location.pathname;
    if (path.includes('/case/')) return 'case-detail';
    if (path.includes('/intake')) return 'intake';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path === '/') return 'login';
    return 'unknown';
  }

  private extractCaseId(): string | undefined {
    const match = window.location.pathname.match(/\/case\/(\d+)/);
    return match ? match[1] : undefined;
  }

  private createErrorReport(error: Error, options: Partial<ErrorReport> = {}): ErrorReport {
    const browserInfo = this.getBrowserInfo();
    const { data } = JSON.parse(localStorage.getItem('sb-ccodmcvkedntksmnhzqe-auth-token') || '{}');
    const userId = data?.user?.id;

    return {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userId,
      casefileId: this.extractCaseId(),
      currentPage: this.getCurrentPage(),
      errorType: 'error',
      ...browserInfo,
      ...options,
    };
  }

  async reportError(error: Error, options: Partial<ErrorReport> = {}) {
    // Rate limit - don't spam webhook
    if (this.sessionErrorCount >= this.maxErrorsPerSession) {
      console.warn('Error reporting rate limit reached');
      return;
    }

    const errorReport = this.createErrorReport(error, options);
    
    // Add to queue
    this.errorQueue.push(errorReport);
    this.sessionErrorCount++;

    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }

    // Send immediately if queue is full or enough time has passed
    const now = Date.now();
    if (this.errorQueue.length >= 5 || (now - this.lastSent) > this.sendInterval) {
      this.flushQueue();
    }
  }

  private async flushQueue() {
    if (this.isSending || this.errorQueue.length === 0) return;

    // Skip if webhook URL is not configured
    if (!this.webhookUrl) {
      // Silently skip - don't log warnings
      this.errorQueue = []; // Clear queue
      return;
    }

    this.isSending = true;
    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];
    this.lastSent = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors: errorsToSend,
          batchSize: errorsToSend.length,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      // Only log success in development
      if (import.meta.env.DEV) {
        console.log('✅ Error report sent to webhook:', errorsToSend.length, 'errors');
      }
    } catch (error: any) {
      // Silently handle CORS and network errors - don't spam console
      const isCorsError = error?.message?.includes('CORS') || 
                         error?.message?.includes('Failed to fetch') ||
                         error?.name === 'TypeError';
      
      // Only log non-CORS errors in development
      if (import.meta.env.DEV && !isCorsError && !error.name?.includes('AbortError')) {
        console.warn('⚠️ Failed to send error report to webhook:', error);
      }
      
      // Don't retry CORS errors - they won't succeed
      // Only retry other errors once
      if (!isCorsError && errorsToSend.length > 0 && this.errorQueue.length === 0) {
        this.errorQueue = errorsToSend;
      }
    } finally {
      this.isSending = false;
    }
  }

  // Force send all pending errors (e.g., on page unload)
  forceSend() {
    if (this.errorQueue.length > 0) {
      this.flushQueue();
    }
  }
}

// Singleton instance
export const errorReporter = new ErrorReporter();

// Send pending errors on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    errorReporter.forceSend();
  });

  // Also send periodically (every 30 seconds)
  setInterval(() => {
    errorReporter.forceSend();
  }, 30000);
}

// Helper function to report errors
export function reportError(error: Error, options?: Partial<ErrorReport>) {
  errorReporter.reportError(error, options);
}

