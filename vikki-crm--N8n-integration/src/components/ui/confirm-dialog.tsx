import { useEffect, useRef, useCallback } from 'react';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info'
}: ConfirmDialogProps) {
  // Use refs to avoid stale closures in event handlers
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onCancelRef.current) {
      onCancelRef.current();
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
    danger: {
      icon: AlertCircle,
      iconColor: 'text-red-600',
      confirmVariant: 'destructive' as const,
      borderColor: 'border-red-200'
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600',
      confirmVariant: 'default' as const,
      borderColor: 'border-yellow-200'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600',
      confirmVariant: 'default' as const,
      borderColor: 'border-blue-200'
    }
  };

  // Ensure variant is valid, default to 'info' if invalid
  const validVariant = (variant === 'danger' || variant === 'warning' || variant === 'info') ? variant : 'info';
  const styles = variantStyles[validVariant];
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={onCancel}
        />

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up z-[10000]">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${styles.iconColor} bg-opacity-10`}>
                <Icon className={`w-5 h-5 ${styles.iconColor}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              size="sm"
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={styles.confirmVariant}
              onClick={onConfirm}
              size="sm"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
