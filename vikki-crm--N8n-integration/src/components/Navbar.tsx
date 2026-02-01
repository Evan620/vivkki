import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Home, FolderPlus, LogOut, Building2, Car, Heart, FileText, FolderOpen } from 'lucide-react';
import { logout } from '../utils/auth';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const getUserEmail = () => {
    return user?.email || 'User';
  };

  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          <div className="flex items-center gap-3 group shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300">
              <span className="text-white font-bold text-xl">V</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Vikki Legal
              </h1>
              <p className="text-xs text-gray-400">Case Management</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
            <NavLink
              to="/home"
              className={({ isActive }) => `
                flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }
              `}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `
                flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }
              `}
            >
              <FolderOpen className="w-4 h-4" />
              <span>Cases</span>
            </NavLink>

            <NavLink
              to="/medical-providers"
              className={({ isActive }) => `
                flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }
              `}
            >
              <Building2 className="w-4 h-4" />
              <span>Providers</span>
            </NavLink>

            <NavLink
              to="/auto-insurance"
              className={({ isActive }) => `
                flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }
              `}
            >
              <Car className="w-4 h-4" />
              <span>Auto</span>
            </NavLink>

            <NavLink
              to="/health-insurance"
              className={({ isActive }) => `
                flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }
              `}
            >
              <Heart className="w-4 h-4" />
              <span>Health</span>
            </NavLink>

            <NavLink
              to="/api-keys"
              className={({ isActive }) => `
                flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              <span>API Keys</span>
            </NavLink>

            {/* Analytics removed per requirements */}

            <NavLink
              to="/intake"
              className={({ isActive }) => `
                flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0
                ${isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }
              `}
            >
              <FolderPlus className="w-4 h-4" />
              <span>New Case</span>
            </NavLink>
          </div>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg text-sm font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{getUserEmail()}</p>
              <p className="text-xs text-gray-400">User</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:shadow-purple-500/50 transition-all duration-300">
              {getUserInitials()}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

          {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-700 bg-gray-900 shadow-xl">
          <div className="px-4 py-3 space-y-2">
            <NavLink
              to="/home"
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-all
                ${isActive ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-all
                ${isActive ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
                  <FolderOpen className="w-5 h-5" />
                  <span>Cases</span>
            </NavLink>
            <NavLink
              to="/medical-providers"
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-all
                ${isActive ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Building2 className="w-5 h-5" />
              <span>Providers</span>
            </NavLink>
            <NavLink
              to="/auto-insurance"
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-all
                ${isActive ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Car className="w-5 h-5" />
              <span>Auto Insurance</span>
            </NavLink>
            <NavLink
              to="/health-insurance"
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-all
                ${isActive ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="w-5 h-5" />
              <span>Health Insurance</span>
            </NavLink>
            <NavLink
              to="/api-keys"
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-all
                ${isActive ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText className="w-5 h-5" />
              <span>API Keys</span>
            </NavLink>
            {/* Analytics removed per requirements */}
            <NavLink
              to="/intake"
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-white font-medium transition-all
                ${isActive ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}
              `}
              onClick={() => setMobileMenuOpen(false)}
            >
              <FolderPlus className="w-5 h-5" />
              <span>New Case</span>
            </NavLink>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-white font-medium bg-red-600 hover:bg-red-700 transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
