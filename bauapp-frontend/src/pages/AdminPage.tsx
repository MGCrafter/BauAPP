import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  FolderKanban,
  FileText,
  TrendingUp,
  Download,
  Plus,
  Settings,
  ChevronRight,
  ImagePlus,
  X,
  Clock,
} from 'lucide-react';
import { Card, Button, Badge, Spinner, Modal, Input } from '../components/ui';
import { useProjectStore, useUIStore, useAuthStore } from '../store';
import { mockUsers } from '../mock';
import { cn } from '../utils/cn';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, loadProjects, createProject, isLoading } = useProjectStore();
  const { addToast, addNotification } = useUIStore();

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    address: '',
    customerName: '',
    description: '',
    imageUrl: '',
  });
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);

  const handleProjectImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setProjectImagePreview(result);
        setNewProject({ ...newProject, imageUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProjectImage = () => {
    setProjectImagePreview(null);
    setNewProject({ ...newProject, imageUrl: '' });
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadProjects();
  }, [user]);

  const stats = [
    {
      icon: FolderKanban,
      label: 'Projekte',
      value: projects.length,
      color: 'text-primary-600 bg-primary-50',
      change: '+2 diesen Monat',
    },
    {
      icon: FileText,
      label: 'Berichte',
      value: projects.reduce((sum, p) => sum + (p.reportsCount || 0), 0),
      color: 'text-green-600 bg-green-50',
      change: '+47 diese Woche',
    },
    {
      icon: Users,
      label: 'Mitarbeiter',
      value: mockUsers.filter((u) => u.role === 'worker').length,
      color: 'text-yellow-600 bg-yellow-50',
      change: '3 aktiv',
    },
    {
      icon: TrendingUp,
      label: 'Aktivität',
      value: '94%',
      color: 'text-purple-600 bg-purple-50',
      change: '+12% vs. letzte Woche',
    },
  ];

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProject.name || !newProject.address || !newProject.customerName) {
      addToast({ message: 'Bitte alle Pflichtfelder ausfüllen', type: 'warning' });
      return;
    }

    try {
      await createProject({
        name: newProject.name,
        address: newProject.address,
        customerName: newProject.customerName,
        description: newProject.description,
        imageUrl: newProject.imageUrl || undefined,
        status: 'active',
        assignedWorkers: [],
      });

      addToast({ message: 'Projekt erstellt!', type: 'success' });
      addNotification({
        title: 'Neues Projekt',
        message: `Projekt "${newProject.name}" wurde erstellt`,
        audience: 'all',
      });
      setShowNewProjectModal(false);
      setNewProject({ name: '', address: '', customerName: '', description: '', imageUrl: '' });
      setProjectImagePreview(null);
    } catch (error) {
      addToast({ message: 'Fehler beim Erstellen', type: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto pb-24 md:pb-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">Admin Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">Übersicht und Verwaltung</p>
        </div>
        <Button
          onClick={() => setShowNewProjectModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="flex-shrink-0"
        >
          <span className="hidden sm:inline">Neues Projekt</span>
          <span className="sm:hidden">Neu</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    stat.color
                  )}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stat.change}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Card
          className="cursor-pointer"
          onClick={() => navigate('/admin/users')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Benutzer verwalten</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mitarbeiter zu Projekten zuweisen</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>

        <Card
          className="cursor-pointer"
          onClick={() => navigate('/admin/reports')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Alle Berichte</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Berichte ansehen und exportieren</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>

        <Card
          className="cursor-pointer"
          onClick={() => navigate('/admin/settings')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Einstellungen</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">App-Konfiguration</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>

        <Card
          className="cursor-pointer"
          onClick={() => navigate('/admin/timesheet')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Stundenzettel</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Arbeitszeiten aller Mitarbeiter</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Projects Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alle Projekte</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Alle anzeigen
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Projekt
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">
                  Kunde
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">
                  Berichte
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {projects.slice(0, 5).map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {project.imageUrl && (
                        <img
                          src={project.imageUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 md:hidden">
                          {project.customerName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{project.customerName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        project.status === 'active'
                          ? 'success'
                          : project.status === 'paused'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {project.status === 'active'
                        ? 'Aktiv'
                        : project.status === 'paused'
                        ? 'Pausiert'
                        : 'Fertig'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{project.reportsCount || 0}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToast({ message: 'PDF wird generiert...', type: 'info' });
                      }}
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Team</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockUsers
            .filter((u) => u.role === 'worker')
            .map((worker) => (
              <Card key={worker.id}>
                <div className="flex items-center gap-3">
                  <img
                    src={worker.avatar}
                    alt={worker.name}
                    className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{worker.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {worker.assignedProjects?.length || 0} Projekte
                    </p>
                  </div>
                  <Badge variant="success">Aktiv</Badge>
                </div>
              </Card>
            ))}
        </div>
      </div>

      {/* New Project Modal */}
      <Modal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        title="Neues Projekt erstellen"
        size="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Projektname *"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="z.B. Einfamilienhaus Sonnenberg"
            required
          />

          <Input
            label="Kundenname *"
            value={newProject.customerName}
            onChange={(e) =>
              setNewProject({ ...newProject, customerName: e.target.value })
            }
            placeholder="z.B. Familie Maier"
            required
          />

          <Input
            label="Adresse *"
            value={newProject.address}
            onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
            placeholder="z.B. Hauptstraße 1, 1010 Wien"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Beschreibung
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) =>
                setNewProject({ ...newProject, description: e.target.value })
              }
              placeholder="Kurze Beschreibung des Projekts..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[100px] resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Project Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Projektbild (optional)
            </label>
            {projectImagePreview ? (
              <div className="relative">
                <img
                  src={projectImagePreview}
                  alt="Vorschau"
                  className="w-full h-40 object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={removeProjectImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Bild hochladen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProjectImageSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setShowNewProjectModal(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1">
              Erstellen
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPage;
