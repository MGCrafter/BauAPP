import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  LogOut,
  Camera,
  Save,
} from 'lucide-react';
import { Card, Button, Input } from '../components/ui';
import { useAuthStore, useUIStore } from '../store';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addToast } = useUIStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: 'max.huber@bauapp.at',
    phone: '+43 660 123 4567',
    company: 'BauApp GmbH',
  });

  const handleSave = () => {
    // Simulate save
    addToast({ message: 'Profil gespeichert!', type: 'success' });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto pb-24 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mein Profil</h1>

      {/* Avatar Section */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name}
              className="w-20 h-20 rounded-full bg-gray-200"
            />
            <button
              aria-label="Profilbild ändern"
              className="absolute -bottom-1 -right-1 w-10 h-10 min-w-[44px] min-h-[44px] bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {user?.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Info */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Persönliche Daten</h3>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              Bearbeiten
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Speichern
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Name</label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                leftIcon={<User className="w-5 h-5" />}
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{formData.name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">E-Mail</label>
            {isEditing ? (
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<Mail className="w-5 h-5" />}
                type="email"
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{formData.email}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Telefon</label>
            {isEditing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                leftIcon={<Phone className="w-5 h-5" />}
                type="tel"
              />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 dark:text-white">{formData.phone}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Firma</label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <Building className="w-5 h-5 text-gray-400" />
              <span className="text-gray-900 dark:text-white">{formData.company}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Card className="mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Meine Statistiken</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-600">47</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Berichte erstellt</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {user?.assignedProjects?.length || 3}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Aktive Projekte</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">12</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Diese Woche</p>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        className="w-full"
        onClick={handleLogout}
        leftIcon={<LogOut className="w-5 h-5" />}
      >
        Abmelden
      </Button>
    </div>
  );
};

export default ProfilePage;
