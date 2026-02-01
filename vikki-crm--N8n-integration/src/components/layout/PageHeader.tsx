import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export default function PageHeader({ 
  title, 
  description, 
  children, 
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between mb-6", className)}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      {children && (
        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
