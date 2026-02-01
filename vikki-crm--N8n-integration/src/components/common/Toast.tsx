import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const Icon = type === 'success' ? CheckCircle : XCircle;
  const iconColor = type === 'success' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColor}`}>
        <Icon className={iconColor} size={20} />
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        <button
          onClick={onClose}
          className={`ml-2 ${textColor} hover:opacity-70`}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
