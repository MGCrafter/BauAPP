import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Calendar,
  Download,
  ChevronRight,
} from 'lucide-react';
import { Card, Button, Input, Badge } from '../components/ui';
import { useAuthStore, useProjectStore } from '../store';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

interface ReportSummary {
  id: string;
  projectId: string;
  projectName?: string;
  userName: string;
  text: string;
  images: string[];
  quickActions?: string[];
  createdAt: string;
}

const AllReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { projects, loadProjects } = useProjectStore();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [reports, setReports] = useState<ReportSummary[]>([]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const loadReports = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => []);
        setReports(Array.isArray(data) ? data : []);
      } catch {
        setReports([]);
      }
    };

    loadReports();
  }, [token]);

  const allReports = [...reports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredReports = allReports.filter((report) => {
    const matchesSearch =
      report.text.toLowerCase().includes(search.toLowerCase()) ||
      report.userName.toLowerCase().includes(search.toLowerCase());

    const matchesProject =
      projectFilter === 'all' || report.projectId === projectFilter;

    return matchesSearch && matchesProject;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-AT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getProjectName = (projectId: string, fallback?: string) => {
    return fallback || projects.find((p) => p.id === projectId)?.name || 'Unbekannt';
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alle Berichte</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {filteredReports.length} Berichte insgesamt
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => alert('Export wird gestartet...')}
        >
          Exportieren
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Berichte suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-white min-w-[200px]"
        >
          <option value="all">Alle Projekte</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map((report, index) => {
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card
                className="cursor-pointer"
                onClick={() => navigate(`/reports/${report.id}`)}
              >
                <div className="flex gap-4">
                  {/* Image Preview */}
                  {report.images.length > 0 && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img
                        src={report.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {report.userName}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-1">
                      {getProjectName(report.projectId, report.projectName)}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {report.text}
                    </p>

                    {/* Quick Actions */}
                    {report.quickActions && report.quickActions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
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

                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Keine Berichte gefunden</p>
        </div>
      )}
    </div>
  );
};

export default AllReportsPage;
