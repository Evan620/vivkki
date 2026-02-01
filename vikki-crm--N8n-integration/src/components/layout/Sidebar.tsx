import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FolderOpen, 
  Building2, 
  Car, 
  Heart, 
  FileText,
  Menu,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { to: '/home', icon: <Home size={20} />, label: 'Home' },
    { to: '/dashboard', icon: <FolderOpen size={20} />, label: 'Cases' },
    { to: '/medical-providers', icon: <Building2 size={20} />, label: 'Medical Providers' },
    { to: '/auto-insurance', icon: <Car size={20} />, label: 'Auto Insurance' },
    { to: '/health-insurance', icon: <Heart size={20} />, label: 'Health Insurance' },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full shadow-md"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 shadow-sm transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-4 border-b">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Vikki Legal
              </h1>
              <p className="text-xs text-gray-500">Case Management</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}
