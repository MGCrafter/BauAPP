import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  FileText,
  Clock,
  AlertTriangle,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Card, Button, ProjectCard, Spinner } from '../components/ui';
import { useAuthStore, useProjectStore } from '../store';
import { cn } from '../utils/cn';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

interface ReportSummary {
  id: string;
  projectId: string;
  projectName?: string;
  projectAddress?: string;
  userName: string;
  text: string;
  quickActions?: string[];
  weather?: string;
  workersPresent?: number;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { projects, loadProjects, isLoading } = useProjectStore();
  const [reports, setReports] = useState<ReportSummary[]>([]);

  useEffect(() => {
    loadProjects(user?.id, user?.role, user?.assignedProjects);
  }, [user, loadProjects]);

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

  const activeProjects = projects.filter((p) => p.status === 'active');
  const totalReports = projects.reduce((sum, p) => sum + (p.reportsCount || 0), 0);
  const latestReport = reports.reduce((latest, report) => {
    if (!latest) return report;
    return new Date(report.createdAt).getTime() > new Date(latest.createdAt).getTime()
      ? report
      : latest;
  }, null as ReportSummary | null);
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const todayReports = reports.filter(
    (report) => new Date(report.createdAt).getTime() >= dayAgo
  );
  const openHints = reports.filter((report) => {
    const quickActions = report.quickActions?.join(' ').toLowerCase() ?? '';
    const text = report.text.toLowerCase();
    return (
      quickActions.includes('material fehlt') ||
      quickActions.includes('inspektion') ||
      text.includes('problem')
    );
  });
  const latestOpenHint = openHints.reduce((latest, report) => {
    if (!latest) return report;
    return new Date(report.createdAt).getTime() > new Date(latest.createdAt).getTime()
      ? report
      : latest;
  }, null as ReportSummary | null);
  const projectNameById = new Map(projects.map((p) => [p.id, p.name]));
  const openHintsSorted = [...openHints].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestReportTime = latestReport
    ? new Date(latestReport.createdAt).toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';
  const latestReportProject = latestReport
    ? latestReport.projectName || projectNameById.get(latestReport.projectId) || 'Unbekanntes Projekt'
    : 'Kein Bericht';
  const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });

  const stats = [
    {
      icon: Clock,
      label: 'Heute',
      value: todayReports.length,
      detail: todayReports.length ? 'Berichte eingereicht' : 'Noch kein Bericht',
      color: 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30',
    },
    {
      icon: FileText,
      label: 'Letzter Bericht',
      value: latestReportTime,
      detail: latestReportProject,
      color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
    },
    {
      icon: AlertTriangle,
      label: 'Offene Hinweise',
      value: openHints.length,
      detail: openHints.length ? 'Bitte prüfen' : 'Alles ruhig',
      color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30',
      onClick: latestOpenHint ? () => navigate(`/reports/${latestOpenHint.id}`) : undefined,
    },
    {
      icon: FolderKanban,
      label: 'Aktive Projekte',
      value: activeProjects.length,
      detail: totalReports ? `${totalReports} Berichte gesamt` : 'Keine Berichte',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 sm:mb-6"
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Hallo, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-1">
          {user?.role === 'admin'
            ? 'Hier ist deine Übersicht aller Projekte.'
            : 'Hier sind deine zugewiesenen Projekte.'}
        </p>
      </motion.div>

      {/* Quick Action */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4 sm:mb-6"
      >
        <Card
          className="bg-gradient-to-r from-primary-600 to-primary-500 border-0 text-white cursor-pointer"
          onClick={() => navigate('/new-report')}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base sm:text-lg">Neuen Bericht erstellen</h3>
              <p className="text-primary-100 text-xs sm:text-sm mt-1 truncate">
                Dokumentiere den Fortschritt
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={item}>
            <Card
              className={cn(
                'text-center p-3 sm:p-4',
                stat.onClick && 'cursor-pointer hover:border-primary-200 dark:hover:border-primary-700'
              )}
              onClick={stat.onClick}
              hover={Boolean(stat.onClick)}
            >
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-1.5 sm:mb-2`}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{stat.label}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                {stat.detail}
              </p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Admin: Open Hints */}
      {user?.role === 'admin' && (
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              Offene Hinweise
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/reports')}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              Alle Berichte
            </Button>
          </div>

          {openHintsSorted.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">Keine offenen Hinweise</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {openHintsSorted.slice(0, 4).map((report) => (
                <Card
                  key={report.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/reports/${report.id}`)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {report.projectName || projectNameById.get(report.projectId) || 'Unbekanntes Projekt'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {report.userName} · {formatShortDate(report.createdAt)}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                      Hinweis
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {report.text}
                  </p>
                  {report.quickActions?.length ? (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {report.quickActions.slice(0, 2).map((action) => (
                        <span
                          key={action}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Aktive Projekte</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            rightIcon={<ChevronRight className="w-4 h-4" />}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            Alle
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          >
            {activeProjects.slice(0, 6).map((project) => (
              <motion.div key={project.id} variants={item}>
                <ProjectCard
                  title={project.name}
                  subtitle={project.customerName}
                  address={project.address}
                  status={project.status}
                  imageUrl={project.imageUrl}
                  reportsCount={project.reportsCount}
                  onClick={() => navigate(`/projects/${project.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {!isLoading && activeProjects.length === 0 && (
          <Card className="text-center py-12">
            <FolderKanban className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Keine aktiven Projekte vorhanden</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
