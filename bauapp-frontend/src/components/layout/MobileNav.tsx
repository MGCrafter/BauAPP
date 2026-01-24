import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, FolderKanban, PlusCircle, BarChart3, Settings, Clock } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../store';

export const MobileNav: React.FC = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // 5 Items: Start | Projekte | [+Neu] | Stunden/Admin | Settings/Mehr
  // Plus ist immer in der Mitte (Position 3 von 5)
  // Für Worker: Profil ist über Header-Avatar erreichbar
  const navItems = [
    { icon: Home, label: 'Start', path: '/' },
    { icon: FolderKanban, label: 'Projekte', path: '/projects' },
    { icon: PlusCircle, label: 'Neu', path: '/new-report', highlight: true },
    ...(isAdmin
      ? [
          { icon: BarChart3, label: 'Admin', path: '/admin' },
          { icon: Settings, label: 'Mehr', path: '/settings' },
        ]
      : [
          { icon: Clock, label: 'Stunden', path: '/timesheet' },
          { icon: Settings, label: 'Mehr', path: '/settings' },
        ]),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 md:hidden z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-14 sm:h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-w-0',
                'transition-colors duration-200',
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'
              )}
            >
              {item.highlight ? (
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-primary-600 to-primary-500 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 -mt-3 sm:-mt-4"
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.div>
              ) : (
                <>
                  <Icon className="w-5 h-5" />
                  <span className="text-[9px] sm:text-[10px] mt-0.5 font-medium truncate max-w-full px-1">
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 w-6 sm:w-8 h-0.5 bg-primary-600 dark:bg-primary-400 rounded-full"
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
