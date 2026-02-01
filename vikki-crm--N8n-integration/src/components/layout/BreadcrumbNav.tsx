import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  return (
    <nav className={cn("flex text-sm text-gray-500", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        <li>
          <Link
            to="/"
            className="flex items-center hover:text-gray-900 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1 text-gray-400" aria-hidden="true" />
            {item.href ? (
              <Link
                to={item.href}
                className="hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-800">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
