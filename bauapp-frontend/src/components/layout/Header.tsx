import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, LogOut, User, Settings, Home, Shield, Clock } from 'lucide-react';
import { useAuthStore } from '../../store';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

// Mock Notifications
const mockNotifications = [
  {
    id: '1',
    title: 'Neuer Bericht',
    message: 'Max Huber hat einen Bericht für "Einfamilienhaus Sonnenberg" erstellt',
    time: 'vor 5 Min.',
    read: false,
  },
  {
    id: '2',
    title: 'Projekt aktualisiert',
    message: 'Das Projekt "Dachsanierung Altbau" wurde auf "Aktiv" gesetzt',
    time: 'vor 1 Std.',
    read: false,
  },
  {
    id: '3',
    title: 'Material geliefert',
    message: 'Material für Bürogebäude Techpark wurde geliefert',
    time: 'vor 3 Std.',
    read: true,
  },
];

export const Header: React.FC<HeaderProps> = ({ title, showBack, onBack }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between px-2 sm:px-4 h-14 sm:h-16">
        {/* Left */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack || (() => navigate(-1))}
              aria-label="Zurück navigieren"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <svg className="w-6 h-6 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {title ? (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
          ) : (
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white hidden sm:block">BauApp</span>
            </Link>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowMenu(false);
              }}
              aria-label={`Benachrichtigungen${unreadCount > 0 ? `, ${unreadCount} ungelesen` : ''}`}
              aria-expanded={showNotifications}
              aria-haspopup="true"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-medium" aria-hidden="true">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    role="menu"
                    aria-label="Benachrichtigungen"
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Benachrichtigungen</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          Alle gelesen
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                              !notification.read ? 'bg-primary-50/50 dark:bg-primary-900/30' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-primary-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {notification.time}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Keine Benachrichtigungen</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative">
            {/* Mobile: Direct link to profile */}
            <button
              onClick={() => {
                // On mobile (< md), go directly to profile
                if (window.innerWidth < 768) {
                  navigate('/profile');
                } else {
                  // On desktop, show dropdown menu
                  setShowMenu(!showMenu);
                  setShowNotifications(false);
                }
              }}
              aria-label="Benutzermenü"
              aria-expanded={showMenu}
              aria-haspopup="true"
              className="flex items-center gap-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors min-h-[44px]"
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
                alt={user?.name}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                {user?.name}
              </span>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    role="menu"
                    aria-label="Benutzermenü"
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50"
                  >
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {user?.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Home className="w-4 h-4" />
                      Startseite
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <User className="w-4 h-4" />
                      Profil
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate('/timesheet');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Clock className="w-4 h-4" />
                      Stundenzettel
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Settings className="w-4 h-4" />
                      Einstellungen
                    </button>

                    {user?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate('/admin');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                      >
                        <Shield className="w-4 h-4" />
                        Admin-Panel
                      </button>
                    )}

                    <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <LogOut className="w-4 h-4" />
                        Abmelden
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
