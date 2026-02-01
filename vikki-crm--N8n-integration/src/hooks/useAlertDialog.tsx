import { useState, useCallback, useRef } from 'react';
import { AlertDialog } from '../components/ui/alert-dialog';

interface AlertOptions {
  title?: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
}

interface DialogConfig {
  message: string;
  options: AlertOptions;
}

export function useAlertDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    message: '',
    options: {}
  });
  
  // Use ref to store the resolve function to avoid stale closures
  const resolveRef = useRef<(() => void) | null>(null);

  const alert = useCallback(
    (message: string, options: AlertOptions = {}): Promise<void> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve;
        setDialogConfig({ message, options });
        setIsOpen(true);
      });
    },
    []
  );

  const handleClose = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
    setIsOpen(false);
  }, []);

  // Always render the dialog - let it handle visibility via isOpen prop
  const Dialog = (
    <AlertDialog
      isOpen={isOpen}
      title={dialogConfig.options.title || 'Alert'}
      message={dialogConfig.message}
      variant={dialogConfig.options.variant || 'info'}
      onClose={handleClose}
    />
  );

  return {
    alert,
    Dialog
  };
}
