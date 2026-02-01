import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { cn } from '../../lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className={cn(
        "lg:pl-64 pt-16 lg:pt-0 min-h-screen",
        className
      )}>
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
