import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  User,
  FileText,
  Plus,
  ChevronRight,
  Download,
} from 'lucide-react';
import { Card, Button, Badge, Spinner } from '../components/ui';
import { useProjectStore, useAuthStore, useUIStore } from '../store';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const { addToast } = useUIStore();
  const { selectedProject, reports, loadProjectById, loadReports, isLoading } =
    useProjectStore();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProjectById(id);
      loadReports(id);
    }
  }, [id]);

  if (isLoading || !selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const statusColors = {
    active: 'success',
    completed: 'default',
    paused: 'warning',
    archived: 'danger',
  } as const;

  const statusLabels = {
    active: 'Aktiv',
    completed: 'Abgeschlossen',
    paused: 'Pausiert',
    archived: 'Archiviert',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="pb-6">
      {/* Hero Image */}
      {selectedProject.imageUrl && (
        <div className="relative h-48 md:h-64 overflow-hidden">
          <img
            src={selectedProject.imageUrl}
            alt={selectedProject.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <Badge variant={statusColors[selectedProject.status]} size="md">
              {statusLabels[selectedProject.status]}
            </Badge>
            <h1 className="text-2xl font-bold text-white mt-2">
              {selectedProject.name}
            </h1>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* Project Info without Image */}
        {!selectedProject.imageUrl && (
          <div className="mb-6">
            <Badge variant={statusColors[selectedProject.status]} size="md">
              {statusLabels[selectedProject.status]}
            </Badge>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
              {selectedProject.name}
            </h1>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Kunde</p>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {selectedProject.customerName}
              </p>
            </div>
          </Card>

          <Card className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Berichte</p>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {selectedProject.reportsCount || reports.length}
              </p>
            </div>
          </Card>

          <Card className="col-span-2 flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Adresse</p>
              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {selectedProject.address}
              </p>
            </div>
          </Card>
        </div>

        {/* Description */}
        {selectedProject.description && (
          <Card className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300">{selectedProject.description}</p>
          </Card>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate(`/projects/${id}/new-report`)}
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Neuen Bericht erstellen
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            leftIcon={<Download className="w-5 h-5" />}
            isLoading={isDownloading}
            disabled={user?.role !== 'admin'}
            onClick={async () => {
              if (!token || !id) return;
              setIsDownloading(true);
              try {
                const response = await fetch(`${API_BASE}/api/projects/${id}/export-pdf`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) {
                  addToast({ message: 'PDF-Export fehlgeschlagen', type: 'error' });
                  setIsDownloading(false);
                  return;
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Projekt_${selectedProject.name}.pdf`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              } finally {
                setIsDownloading(false);
              }
            }}
          >
            Projekt-PDF
          </Button>
        </div>

        {/* Reports */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Letzte Berichte
          </h2>

          {reports.length === 0 ? (
            <Card className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Noch keine Berichte vorhanden</p>
              <p className="text-sm text-gray-400 mt-1">
                Erstelle den ersten Bericht für dieses Projekt
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="cursor-pointer"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <div className="flex gap-4">
                      {/* Image Preview */}
                      {report.images.length > 0 && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={report.images[0]}
                            alt="Bericht"
                            className="w-full h-full object-cover"
                          />
                          {report.images.length > 1 && (
                            <div className="relative -mt-6 ml-1">
                              <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                                +{report.images.length - 1}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.userName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(report.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                          {report.text}
                        </p>

                        {/* Quick Actions */}
                        {report.quickActions && report.quickActions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {report.quickActions.slice(0, 2).map((action, i) => (
                              <Badge key={i} variant="info" size="sm">
                                {action}
                              </Badge>
                            ))}
                            {report.quickActions.length > 2 && (
                              <Badge variant="default" size="sm">
                                +{report.quickActions.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
