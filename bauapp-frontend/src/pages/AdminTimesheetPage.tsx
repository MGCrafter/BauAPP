import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Users,
  Download,
  Filter,
} from 'lucide-react';
import { Card, Button, Badge, Modal } from '../components/ui';
import { useAuthStore, useProjectStore, useUIStore } from '../store';
import { mockReports } from '../mock/reports';
import { cn } from '../utils/cn';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

interface Worker {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

interface TimeEntry {
  id: string;
  date: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number | null;
  notes: string;
}

const AdminTimesheetPage: React.FC = () => {
  const { addToast } = useUIStore();
  const { token } = useAuthStore();
  const { projects, loadProjects } = useProjectStore();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [selectedWorker, setSelectedWorker] = useState<string>('all');
  const [showWorkerDetail, setShowWorkerDetail] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const loadReports = async () => {
      if (!token) {
        const fallback = mockReports.map((report) => ({
          id: `report-${report.id}`,
          date: report.createdAt.split('T')[0],
          userId: report.userId,
          userName: report.userName,
          projectId: report.projectId,
          projectName:
            projects.find((p) => p.id === report.projectId)?.name || report.projectId,
          startTime: report.startTime || '',
          endTime: report.endTime || '',
          breakMinutes: report.breakMinutes ?? null,
          notes: report.text,
        }));
        setEntries(fallback);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => []);
        const list = Array.isArray(data) ? data : mockReports;
        const mapped = list.map((report) => ({
          id: `report-${report.id}`,
          date: report.createdAt.split('T')[0],
          userId: report.userId,
          userName: report.userName,
          projectId: report.projectId,
          projectName:
            report.projectName ||
            projects.find((p) => p.id === report.projectId)?.name ||
            report.projectId,
          startTime: report.startTime || '',
          endTime: report.endTime || '',
          breakMinutes: report.breakMinutes ?? null,
          notes: report.text,
        }));
        setEntries(mapped);
      } catch {
        const fallback = mockReports.map((report) => ({
          id: `report-${report.id}`,
          date: report.createdAt.split('T')[0],
          userId: report.userId,
          userName: report.userName,
          projectId: report.projectId,
          projectName:
            projects.find((p) => p.id === report.projectId)?.name || report.projectId,
          startTime: report.startTime || '',
          endTime: report.endTime || '',
          breakMinutes: report.breakMinutes ?? null,
          notes: report.text,
        }));
        setEntries(fallback);
      }
    };

    loadReports();
  }, [token, projects]);

  const workers = useMemo<Worker[]>(() => {
    const map = new Map<string, Worker>();
    entries.forEach((entry) => {
      if (!map.has(entry.userId)) {
        const name = entry.userName || 'Unbekannt';
        const username = name.toLowerCase().replace(/\s+/g, '.');
        map.set(entry.userId, {
          id: entry.userId,
          name,
          username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        });
      }
    });
    return Array.from(map.values());
  }, [entries]);

  // Get week dates
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = useMemo(() => getWeekDates(selectedWeek), [selectedWeek]);

  // Calculate hours
  const calculateHours = (entry: TimeEntry): number => {
    if (!entry.startTime || !entry.endTime) return 0;
    const [startH, startM] = entry.startTime.split(':').map(Number);
    const [endH, endM] = entry.endTime.split(':').map(Number);
    if (Number.isNaN(startH) || Number.isNaN(startM) || Number.isNaN(endH) || Number.isNaN(endM)) {
      return 0;
    }
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const pause = entry.breakMinutes ?? 0;
    const totalMinutes = endMinutes - startMinutes - pause;
    return Math.max(0, totalMinutes / 60);
  };

  // Get entries for a specific date and worker
  const getEntriesForDateAndWorker = (date: Date, workerId?: string): TimeEntry[] => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.filter(e =>
      e.date === dateStr &&
      (workerId ? e.userId === workerId : true)
    );
  };

  // Calculate weekly stats per worker
  const workerWeeklyStats = useMemo(() => {
    const stats: Record<string, { hours: number; days: number; entries: TimeEntry[] }> = {};

    workers.forEach(worker => {
      stats[worker.id] = { hours: 0, days: 0, entries: [] };
    });

    weekDates.forEach(date => {
      workers.forEach(worker => {
        const dayEntries = getEntriesForDateAndWorker(date, worker.id);
        if (dayEntries.length > 0) {
          const dayHours = dayEntries.reduce((sum, e) => sum + calculateHours(e), 0);
          stats[worker.id].hours += dayHours;
          stats[worker.id].days += 1;
          stats[worker.id].entries.push(...dayEntries);
        }
      });
    });

    return stats;
  }, [weekDates, entries, workers]);

  // Total weekly hours
  const totalWeeklyHours = useMemo(() => {
    return Object.values(workerWeeklyStats).reduce((sum, s) => sum + s.hours, 0);
  }, [workerWeeklyStats]);

  // Navigation
  const prevWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedWeek(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedWeek(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const handleExport = () => {
    addToast({ message: 'Export wird vorbereitet...', type: 'info' });
    // In real app: Generate CSV/PDF
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Stundenzettel Übersicht
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {workers.length} Mitarbeiter · {totalWeeklyHours.toFixed(1)} Stunden diese Woche
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="secondary"
          leftIcon={<Download className="w-4 h-4" />}
        >
          Exportieren
        </Button>
      </div>

      {/* Week Navigation */}
      <Card className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={prevWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="text-center">
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatWeekRange()}
            </p>
          </div>

          <button
            onClick={nextWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </Card>

      {/* Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedWorker('all')}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[44px]',
            selectedWorker === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          )}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Alle
        </button>
        {workers.map(worker => (
          <button
            key={worker.id}
            onClick={() => setSelectedWorker(worker.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[44px]',
              selectedWorker === worker.id
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            )}
          >
            {worker.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Worker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {workers
          .filter(w => selectedWorker === 'all' || w.id === selectedWorker)
          .map((worker, index) => {
            const stats = workerWeeklyStats[worker.id] || { hours: 0, days: 0, entries: [] };

            return (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer"
                  onClick={() => setShowWorkerDetail(worker.id)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={worker.avatar}
                      alt={worker.name}
                      className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {worker.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{worker.username}
                      </p>
                    </div>
                    <Badge variant={stats.hours >= 35 ? 'success' : 'warning'}>
                      {stats.hours.toFixed(1)}h
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {stats.hours.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Stunden</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {stats.days}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tage</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                      <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {stats.days > 0 ? (stats.hours / stats.days).toFixed(1) : '0'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ø/Tag</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
      </div>

      {/* Weekly Overview Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Mitarbeiter
                </th>
                {weekDates.slice(0, 5).map((date, i) => (
                  <th key={i} className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr'][i]}
                    <br />
                    <span className="font-normal">{date.getDate()}</span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Gesamt
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {workers
                .filter(w => selectedWorker === 'all' || w.id === selectedWorker)
                .map(worker => {
                  const stats = workerWeeklyStats[worker.id] || { hours: 0, days: 0, entries: [] };

                  return (
                    <tr key={worker.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={worker.avatar}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {worker.name.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      {weekDates.slice(0, 5).map((date, i) => {
                        const dayEntries = getEntriesForDateAndWorker(date, worker.id);
                        const dayHours = dayEntries.reduce((sum, e) => sum + calculateHours(e), 0);

                        return (
                          <td key={i} className="px-3 py-3 text-center">
                            {dayHours > 0 ? (
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {dayHours.toFixed(1)}h
                              </span>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {stats.hours.toFixed(1)}h
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
            <tfoot className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                  Gesamt
                </td>
                {weekDates.slice(0, 5).map((date, i) => {
                  const displayedWorkers = workers.filter(w => selectedWorker === 'all' || w.id === selectedWorker);
                  const dayTotal = displayedWorkers.reduce((sum, worker) => {
                    const dayEntries = getEntriesForDateAndWorker(date, worker.id);
                    return sum + dayEntries.reduce((s, e) => s + calculateHours(e), 0);
                  }, 0);

                  return (
                    <td key={i} className="px-3 py-3 text-center font-semibold text-gray-900 dark:text-white">
                      {dayTotal > 0 ? `${dayTotal.toFixed(1)}h` : '-'}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-right font-bold text-primary-600 dark:text-primary-400">
                  {(selectedWorker === 'all'
                    ? totalWeeklyHours
                    : workerWeeklyStats[selectedWorker]?.hours || 0
                  ).toFixed(1)}h
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Worker Detail Modal */}
      <Modal
        isOpen={!!showWorkerDetail}
        onClose={() => setShowWorkerDetail(null)}
        title={`Stundenzettel - ${workers.find(w => w.id === showWorkerDetail)?.name || ''}`}
        size="lg"
      >
        {showWorkerDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
              <img
                src={workers.find(w => w.id === showWorkerDetail)?.avatar}
                alt=""
                className="w-16 h-16 rounded-full"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                  {workers.find(w => w.id === showWorkerDetail)?.name}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {(workerWeeklyStats[showWorkerDetail]?.hours || 0).toFixed(1)} Stunden diese Woche
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {workerWeeklyStats[showWorkerDetail]?.entries.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {entry.projectName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(entry.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                      {' · '}
                      {(entry.startTime && entry.endTime)
                        ? `${entry.startTime} - ${entry.endTime}`
                        : '—'}
                    </p>
                  </div>
                  <Badge variant="success">
                    {calculateHours(entry).toFixed(1)}h
                  </Badge>
                </div>
              ))}

              {workerWeeklyStats[showWorkerDetail]?.entries.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Keine Einträge diese Woche
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTimesheetPage;
