import { useState, useCallback, useRef } from 'react';
import { ConfirmDialog } from '../components/ui/confirm-dialog';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface DialogConfig {
  message: string;
  options: ConfirmOptions;
}

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    message: '',
    options: {}
  });
  
  // Use ref to store the resolve function to avoid stale closures
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (message: string, options: ConfirmOptions = {}): Promise<boolean> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setDialogConfig({ message, options });
        setIsOpen(true);
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setIsOpen(false);
  }, []);

  // Always render the dialog - let it handle visibility via isOpen prop
  const Dialog = (
    <ConfirmDialog
      isOpen={isOpen}
      title={dialogConfig.options.title || 'Confirm'}
      message={dialogConfig.message}
      confirmLabel={dialogConfig.options.confirmLabel}
      cancelLabel={dialogConfig.options.cancelLabel}
      variant={dialogConfig.options.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return {
    confirm,
    Dialog
  };
}
