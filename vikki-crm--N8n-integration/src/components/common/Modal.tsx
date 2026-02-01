import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'md' }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          onClick={onClose}
        />

        <div className={`relative bg-white rounded-2xl shadow-2xl ${maxWidthClasses[maxWidth]} w-full max-h-[90vh] overflow-hidden animate-slide-up`}>
          {title && (
            <div className="sticky top-0 px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all duration-200 text-gray-400 hover:text-gray-600 hover:rotate-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          <div className={`overflow-y-auto ${title ? 'max-h-[calc(90vh-100px)]' : 'max-h-[90vh]'}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
