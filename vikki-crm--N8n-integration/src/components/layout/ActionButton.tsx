import { useState } from 'react';
import { Button } from '../ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
}

interface ActionButtonProps {
  actions: ActionItem[];
  className?: string;
}

export default function ActionButton({ actions, className }: ActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("fixed right-6 bottom-6 z-40", className)}>
      {/* Actions menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col-reverse items-end space-y-reverse space-y-2 mb-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="secondary"
              className="shadow-md animate-slide-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Main button */}
      <Button
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
        <span className="sr-only">{isOpen ? 'Close actions' : 'Open actions'}</span>
      </Button>
    </div>
  );
}
