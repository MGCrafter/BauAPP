import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  FolderKanban,
  PlusCircle,
  BarChart3,
  Users,
  Settings,
  LogOut,
  X,
  FileText,
  Clock,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore, useUIStore } from '../../store';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const isAdmin = user?.role === 'admin';

  const mainNavItems = [
    { icon: Home, label: 'Übersicht', path: '/' },
    { icon: FolderKanban, label: 'Projekte', path: '/projects' },
    { icon: PlusCircle, label: 'Neuer Bericht', path: '/new-report' },
    { icon: Clock, label: 'Stundenzettel', path: '/timesheet' },
  ];

  const adminNavItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Benutzer', path: '/admin/users' },
    { icon: FileText, label: 'Alle Berichte', path: '/admin/reports' },
    { icon: Settings, label: 'Einstellungen', path: '/admin/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ icon: Icon, label, path }: { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; label: string; path: string }) => (
    <NavLink
      to={path}
      onClick={() => toggleSidebar()}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
        )
      }
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : '-100%',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-50',
          'flex flex-col',
          'md:translate-x-0 md:static'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">BauApp</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dokumentation</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            aria-label="Seitenleiste schließen"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Administration
                </p>
              </div>
              {adminNavItems.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </motion.aside>
    </>
  );
};
