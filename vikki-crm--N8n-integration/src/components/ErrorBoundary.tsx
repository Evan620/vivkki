import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, X } from 'lucide-react';
import { reportError } from '../utils/errorReporter';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorInfo: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to webhook
    reportError(error, {
      component: this.props.componentName || 'unknown',
      errorType: 'critical',
      message: `${this.props.componentName || 'Component'}: ${error.message}`,
    });

    this.setState({
      error,
      errorInfo: errorInfo.componentStack || '',
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: '',
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-red-200">
            {/* Header */}
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-red-900">
                    Something Went Wrong
                  </h2>
                  <p className="text-sm text-red-700 mt-1">
                    We've been notified and are working on a fix
                  </p>
                </div>
                <button
                  onClick={this.handleReset}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Error Details */}
            <div className="p-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-gray-900 mb-2">Error Details:</p>
                <p className="text-sm text-gray-700 font-mono break-all">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>

              {/* Component Info */}
              {this.props.componentName && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Component: <span className="font-medium">{this.props.componentName}</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  Reload Page
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  <Home className="w-5 h-5" />
                  Go Home
                </button>
              </div>

              {/* Tech Support */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  If this problem persists, please contact support with this reference code:
                </p>
                <p className="text-sm font-mono text-gray-900 mt-2 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                  {Date.now().toString(36).toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

