import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Cloud,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
} from 'lucide-react';
import { Card, Button, Badge, Spinner } from '../components/ui';
import { useAuthStore } from '../store';
import type { Report } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

interface ReportDetail extends Report {
  projectName?: string;
  projectAddress?: string;
}

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/reports/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data) {
          setReport(null);
          setIsLoading(false);
          return;
        }
        setReport(data);
      } catch {
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [id, token]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">Bericht nicht gefunden</p>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          Zurück
        </Button>
      </div>
    );
  }

  const project = report.projectName
    ? { name: report.projectName, address: report.projectAddress }
    : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-AT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('de-AT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bericht Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{project?.name}</p>
        </div>
      </div>

      {/* Meta Info */}
      <Card className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${report.userName}`}
            alt={report.userName}
            className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"
          />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{report.userName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(report.createdAt)} um {formatTime(report.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {report.weather && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Cloud className="w-4 h-4 text-gray-400" />
              <span>{report.weather}</span>
            </div>
          )}
          {report.workersPresent && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{report.workersPresent} Arbeiter vor Ort</span>
            </div>
          )}
          {project && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 col-span-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{project.address}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      {report.quickActions && report.quickActions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {report.quickActions.map((action, index) => (
            <Badge key={index} variant="info" size="md">
              {action}
            </Badge>
          ))}
        </div>
      )}

      {/* Text Content */}
      <Card className="mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Beschreibung</h3>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{report.text}</p>
      </Card>

      {/* Images */}
      {report.images.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Fotos ({report.images.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {report.images.map((image, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-100"
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={image}
                  alt={`Bild ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImageIndex !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            aria-label="Bild schließen"
            className="absolute top-4 right-4 p-3 text-white hover:bg-white/10 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => setSelectedImageIndex(null)}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation */}
          {report.images.length > 1 && (
            <>
              <button
                aria-label="Vorheriges Bild"
                className="absolute left-4 p-3 text-white hover:bg-white/10 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(
                    selectedImageIndex === 0
                      ? report.images.length - 1
                      : selectedImageIndex - 1
                  );
                }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                aria-label="Nächstes Bild"
                className="absolute right-4 p-3 text-white hover:bg-white/10 rounded-full min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(
                    selectedImageIndex === report.images.length - 1
                      ? 0
                      : selectedImageIndex + 1
                  );
                }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          <img
            src={report.images[selectedImageIndex]}
            alt={`Bild ${selectedImageIndex + 1}`}
            className="max-w-full max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {selectedImageIndex + 1} / {report.images.length}
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => navigate(`/projects/${report.projectId}`)}
        >
          Zum Projekt
        </Button>
        <Button
          variant="outline"
          onClick={async () => {
            if (!token) return;
            setIsDownloading(true);
            try {
              const response = await fetch(
                `${API_BASE}/api/projects/${report.projectId}/export-pdf`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (!response.ok) {
                setIsDownloading(false);
                return;
              }
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `Projekt_${project?.name || report.projectId}.pdf`;
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            } finally {
              setIsDownloading(false);
            }
          }}
          leftIcon={<Download className="w-4 h-4" />}
          isLoading={isDownloading}
          disabled={user?.role !== 'admin'}
        >
          PDF
        </Button>
      </div>
    </div>
  );
};

export default ReportDetailPage;
