import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Moon,
  Globe,
  Shield,
  Database,
  Trash2,
  ChevronRight,
  Check,
  Image,
} from 'lucide-react';
import { Card, Modal, Button } from '../components/ui';
import { useUIStore } from '../store';
import { cn } from '../utils/cn';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, toggleDarkMode, addToast } = useUIStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);

  const handleToggle = (key: 'notifications' | 'autoSync') => {
    updateSettings({ [key]: !settings[key] });
    addToast({ message: 'Einstellung gespeichert', type: 'success' });
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
    addToast({
      message: settings.darkMode ? 'Heller Modus aktiviert' : 'Dunkler Modus aktiviert',
      type: 'success',
    });
  };

  const handleLanguageChange = (language: 'de' | 'en') => {
    updateSettings({ language });
    addToast({ message: 'Sprache gespeichert', type: 'success' });
    setShowLanguageModal(false);
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    updateSettings({ imageQuality: quality });
    addToast({ message: 'Bildqualität gespeichert', type: 'success' });
    setShowQualityModal(false);
  };

  const qualityOptions = [
    { value: 'low' as const, label: 'Niedrig', description: 'Kleinste Dateigröße, schnellster Upload' },
    { value: 'medium' as const, label: 'Mittel', description: 'Ausgewogene Qualität und Dateigröße' },
    { value: 'high' as const, label: 'Hoch', description: 'Beste Qualität, größere Dateien' },
  ];

  const languageOptions = [
    { value: 'de' as const, label: 'Deutsch', available: true },
    { value: 'en' as const, label: 'English', available: false },
  ];

  const settingsSections = [
    {
      title: 'Allgemein',
      items: [
        {
          icon: Bell,
          label: 'Benachrichtigungen',
          description: 'Push-Benachrichtigungen aktivieren',
          type: 'toggle' as const,
          key: 'notifications' as const,
          value: settings.notifications,
        },
        {
          icon: Moon,
          label: 'Dunkler Modus',
          description: settings.darkMode ? 'Aktiv' : 'Inaktiv',
          type: 'toggle' as const,
          key: 'darkMode' as const,
          value: settings.darkMode,
          onToggle: handleDarkModeToggle,
        },
        {
          icon: Globe,
          label: 'Sprache',
          description: settings.language === 'de' ? 'Deutsch' : 'English',
          type: 'link' as const,
          onClick: () => setShowLanguageModal(true),
        },
      ],
    },
    {
      title: 'Synchronisation',
      items: [
        {
          icon: Database,
          label: 'Auto-Sync',
          description: 'Automatisch synchronisieren wenn online',
          type: 'toggle' as const,
          key: 'autoSync' as const,
          value: settings.autoSync,
        },
        {
          icon: Image,
          label: 'Bildqualität',
          description:
            settings.imageQuality === 'high'
              ? 'Hoch'
              : settings.imageQuality === 'medium'
              ? 'Mittel'
              : 'Niedrig',
          type: 'link' as const,
          onClick: () => setShowQualityModal(true),
        },
      ],
    },
    {
      title: 'Daten',
      items: [
        {
          icon: Trash2,
          label: 'Cache leeren',
          description: 'Lokale Daten löschen',
          type: 'danger' as const,
          onClick: () => {
            const authData = localStorage.getItem('bauapp-auth-storage');
            localStorage.clear();
            if (authData) {
              localStorage.setItem('bauapp-auth-storage', authData);
            }
            addToast({ message: 'Cache geleert', type: 'success' });
          },
        },
      ],
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Einstellungen</h1>

      {settingsSections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
          className="mb-6"
        >
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            {section.title}
          </h2>

          <Card className="divide-y divide-gray-100 dark:divide-gray-700 p-0 overflow-hidden">
            {section.items.map((item) => (
              <div
                key={item.label}
                className={cn(
                  'flex items-center gap-4 p-4',
                  (item.type === 'link' || item.type === 'danger') &&
                    'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
                onClick={item.type === 'link' || item.type === 'danger' ? item.onClick : undefined}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    item.type === 'danger'
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium',
                      item.type === 'danger' ? 'text-red-600' : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {item.label}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>

                {item.type === 'toggle' && (
                  <button
                    onClick={() => {
                      if ('onToggle' in item && item.onToggle) {
                        item.onToggle();
                      } else if (item.key === 'notifications' || item.key === 'autoSync') {
                        handleToggle(item.key);
                      }
                    }}
                    className={cn(
                      'w-12 h-7 rounded-full transition-colors relative',
                      item.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                    )}
                  >
                    <motion.div
                      className="w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm"
                      animate={{
                        left: item.value ? '26px' : '4px',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                )}

                {item.type === 'link' && (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            ))}
          </Card>
        </motion.div>
      ))}

      {/* App Info */}
      <Card className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold text-xl">B</span>
        </div>
        <p className="font-semibold text-gray-900 dark:text-white">BauApp</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Version 0.0.2</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          © 2026 NekoZDevTeam. Alle Rechte vorbehalten.
        </p>
      </Card>

      {/* Language Modal */}
      <Modal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title="Sprache auswählen"
        size="sm"
      >
        <div className="space-y-2">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => option.available && handleLanguageChange(option.value)}
              disabled={!option.available}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl transition-colors',
                option.available
                  ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed',
                settings.language === option.value
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500'
                  : 'bg-gray-50 dark:bg-gray-700'
              )}
            >
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                {!option.available && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bald verfügbar</p>
                )}
              </div>
              {settings.language === option.value && (
                <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Image Quality Modal */}
      <Modal
        isOpen={showQualityModal}
        onClose={() => setShowQualityModal(false)}
        title="Bildqualität auswählen"
        size="sm"
      >
        <div className="space-y-2">
          {qualityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleQualityChange(option.value)}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700',
                settings.imageQuality === option.value
                  ? 'bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500'
                  : 'bg-gray-50 dark:bg-gray-700'
              )}
            >
              <div className="text-left">
                <p className="font-medium text-gray-900 dark:text-white">{option.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{option.description}</p>
              </div>
              {settings.imageQuality === option.value && (
                <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              )}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
