import { useEffect, useRef, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  variant?: 'success' | 'error' | 'info' | 'warning';
}

export function AlertDialog({
  isOpen,
  title,
  message,
  onClose,
  variant = 'info'
}: AlertDialogProps) {
  // Use refs to avoid stale closures in event handlers
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onCloseRef.current) {
      onCloseRef.current();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const variantStyles = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  };

  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={onClose}
        />

        <div className={`relative ${styles.bgColor} rounded-2xl shadow-2xl max-w-md w-full border ${styles.borderColor} animate-slide-up z-[10000]`}>
          <div className="px-6 py-5">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.iconColor} bg-white`}>
                <Icon className={`w-5 h-5 ${styles.iconColor}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 flex justify-end border-t border-gray-200">
            <Button
              type="button"
              variant="default"
              onClick={onClose}
              size="sm"
            >
              OK
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
