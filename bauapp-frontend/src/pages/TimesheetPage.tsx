import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '../components/ui';
import { useAuthStore, useProjectStore, useUIStore } from '../store';
import { cn } from '../utils/cn';
import { mockReports } from '../mock/reports';

interface TimeEntry {
  id: string;
  date: string;
  projectId: string;
  projectName: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number | null;
  hours?: number;
  notes: string;
  source: 'report' | 'manual';
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const TimesheetPage: React.FC = () => {
  const { token, user } = useAuthStore();
  const { projects, loadProjects } = useProjectStore();
  const { addToast } = useUIStore();

  const [reportEntries, setReportEntries] = useState<TimeEntry[]>([]);
  const [manualEntries, setManualEntries] = useState<TimeEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<string>('all');

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    notes: '',
  });

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    const loadReports = async () => {
      if (!token) {
        const fallback = mockReports
          .filter((report) =>
            user?.role === 'worker' ? report.userId === user.id : true
          )
          .map((report) => ({
            id: `report-${report.id}`,
            date: report.createdAt.split('T')[0],
            projectId: report.projectId,
            projectName:
              projects.find((p) => p.id === report.projectId)?.name || report.projectId,
            startTime: report.startTime || '',
            endTime: report.endTime || '',
            breakMinutes: report.breakMinutes ?? null,
            notes: report.text,
            source: 'report' as const,
          }));
        setReportEntries(fallback);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => []);
        const list = Array.isArray(data) ? data : mockReports;
        const filtered = user?.role === 'worker'
          ? list.filter((report) => report.userId === user.id)
          : list;
        const mapped = filtered.map((report) => ({
          id: `report-${report.id}`,
          date: report.createdAt.split('T')[0],
          projectId: report.projectId,
          projectName:
            report.projectName ||
            projects.find((p) => p.id === report.projectId)?.name ||
            report.projectId,
          startTime: report.startTime || '',
          endTime: report.endTime || '',
          breakMinutes: report.breakMinutes ?? null,
          notes: report.text,
          source: 'report' as const,
        }));
        setReportEntries(mapped);
      } catch {
        const fallback = mockReports
          .filter((report) =>
            user?.role === 'worker' ? report.userId === user.id : true
          )
          .map((report) => ({
          id: `report-${report.id}`,
          date: report.createdAt.split('T')[0],
          projectId: report.projectId,
          projectName:
            projects.find((p) => p.id === report.projectId)?.name || report.projectId,
          startTime: report.startTime || '',
          endTime: report.endTime || '',
          breakMinutes: report.breakMinutes ?? null,
          notes: report.text,
          source: 'report' as const,
          }));
        setReportEntries(fallback);
      }
    };

    loadReports();
  }, [token, projects, user]);

  const entries = useMemo(
    () =>
      [...reportEntries, ...manualEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [reportEntries, manualEntries]
  );

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

  const weekDayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const calculateHours = (entry: TimeEntry): number => {
    if (entry.startTime && entry.endTime) {
      const [startH, startM] = entry.startTime.split(':').map(Number);
      const [endH, endM] = entry.endTime.split(':').map(Number);
      if (Number.isNaN(startH) || Number.isNaN(startM) || Number.isNaN(endH) || Number.isNaN(endM)) {
        return entry.hours ?? 0;
      }
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const pause = entry.breakMinutes ?? 0;
      const totalMinutes = endMinutes - startMinutes - pause;
      return Math.max(0, totalMinutes / 60);
    }
    return entry.hours ?? 0;
  };

  // Get entries for a specific date
  const getEntriesForDate = (date: Date): TimeEntry[] => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.filter(e => e.date === dateStr);
  };

  // Calculate weekly total
  const weeklyTotal = useMemo(() => {
    return weekDates.reduce((total, date) => {
      const dayEntries = getEntriesForDate(date);
      return total + dayEntries.reduce((sum, e) => sum + calculateHours(e), 0);
    }, 0);
  }, [weekDates, entries]);

  // Navigate weeks
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

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  // Handle add entry
  const handleAddEntry = () => {
    if (!newEntry.projectId) {
      addToast({ message: 'Bitte Projekt auswählen', type: 'warning' });
      return;
    }

    const project = projects.find(p => p.id === newEntry.projectId);
    const entry: TimeEntry = {
      id: `entry-${Date.now()}`,
      ...newEntry,
      projectName: project?.name || 'Unbekanntes Projekt',
      source: 'manual',
    };

    setManualEntries((prev) => [...prev, entry]);
    addToast({ message: 'Eintrag hinzugefügt', type: 'success' });
    setShowAddModal(false);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      projectId: '',
      notes: '',
    });
  };

  // Handle edit entry
  const handleSaveEdit = () => {
    if (!editingEntry) return;

    if (editingEntry.source !== 'manual') {
      addToast({ message: 'Report-Eintraege sind nicht editierbar', type: 'info' });
      setEditingEntry(null);
      return;
    }
    setManualEntries(manualEntries.map(e => e.id === editingEntry.id ? editingEntry : e));
    addToast({ message: 'Eintrag aktualisiert', type: 'success' });
    setEditingEntry(null);
  };

  // Handle delete entry
  const handleDeleteEntry = (id: string) => {
    const entry = manualEntries.find((e) => e.id === id);
    if (!entry) {
      addToast({ message: 'Report-Eintraege koennen nicht geloescht werden', type: 'info' });
      return;
    }
    setManualEntries(manualEntries.filter(e => e.id !== id));
    addToast({ message: 'Eintrag gelöscht', type: 'success' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Stundenzettel</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {weeklyTotal.toFixed(1)} Stunden diese Woche
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Zeit wird im Bericht erfasst (optional).
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Eintrag hinzufügen
        </Button>
      </div>

      {/* Week Navigation */}
      <Card className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={prevWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Vorherige Woche"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="text-center flex-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
              {formatWeekRange()}
            </p>
            <button
              onClick={goToCurrentWeek}
              className="text-xs text-primary-600 hover:underline mt-1"
            >
              Zur aktuellen Woche
            </button>
          </div>

          <button
            onClick={nextWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Nächste Woche"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </Card>

      {/* Week Overview - Mobile Optimized */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4 sm:mb-6">
        {weekDates.map((date, index) => {
          const dayEntries = getEntriesForDate(date);
          const dayHours = dayEntries.reduce((sum, e) => sum + calculateHours(e), 0);
          const today = isToday(date);
          const isPast = date < new Date() && !today;
          const isWeekend = index >= 5;

          return (
            <motion.div
              key={date.toISOString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'p-2 sm:p-3 rounded-xl text-center transition-all',
                today
                  ? 'bg-primary-100 dark:bg-primary-900/50 ring-2 ring-primary-500'
                  : isWeekend
                  ? 'bg-gray-50 dark:bg-gray-800/50'
                  : 'bg-white dark:bg-gray-800',
                'border border-gray-100 dark:border-gray-700'
              )}
            >
              <p className={cn(
                'text-[10px] sm:text-xs font-medium',
                today ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
              )}>
                {weekDayNames[index]}
              </p>
              <p className={cn(
                'text-sm sm:text-lg font-bold',
                today ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
              )}>
                {date.getDate()}
              </p>
              <p className={cn(
                'text-[10px] sm:text-xs mt-1',
                dayHours > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400 dark:text-gray-500'
              )}>
                {dayHours > 0 ? `${dayHours.toFixed(1)}h` : '-'}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Time Entries List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Einträge dieser Woche
        </h2>

        {weekDates.map(date => {
          const dayEntries = getEntriesForDate(date);
          if (dayEntries.length === 0) return null;

          return (
            <div key={date.toISOString()}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1">
                {date.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}
              </p>

              {dayEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="mb-2">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                          {entry.projectName}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                            {entry.startTime && entry.endTime
                              ? `${entry.startTime} - ${entry.endTime}${
                                  entry.breakMinutes != null ? ` · Pause ${entry.breakMinutes}m` : ''
                                }`
                              : calculateHours(entry) > 0
                              ? `${calculateHours(entry).toFixed(1)}h`
                              : 'Zeit im Bericht'}
                          </span>
                          {calculateHours(entry) > 0 && (
                            <Badge variant="success" size="sm">
                              {calculateHours(entry).toFixed(1)}h
                            </Badge>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {entry.notes}
                          </p>
                        )}
                      </div>

                      {entry.source === 'manual' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="Bearbeiten"
                          >
                            <Edit2 className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            aria-label="Löschen"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          );
        })}

        {entries.filter(e => weekDates.some(d => d.toISOString().split('T')[0] === e.date)).length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Keine Einträge diese Woche</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowAddModal(true)}
            >
              Ersten Eintrag erstellen
            </Button>
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      <Card className="mt-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Wochenzusammenfassung</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
              {weeklyTotal.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Stunden</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
              {entries.filter(e => weekDates.some(d => d.toISOString().split('T')[0] === e.date)).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Einträge</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {new Set(entries.filter(e => weekDates.some(d => d.toISOString().split('T')[0] === e.date)).map(e => e.projectId)).size}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Projekte</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
            <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(weeklyTotal / 5).toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ø pro Tag</p>
          </div>
        </div>
      </Card>

      {/* Add Entry Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Eintrag hinzufügen"
      >
        <div className="space-y-4">
          <Input
            label="Datum"
            type="date"
            value={newEntry.date}
            onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Projekt *
            </label>
            <select
              value={newEntry.projectId}
              onChange={(e) => setNewEntry({ ...newEntry, projectId: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
            >
              <option value="">Projekt auswählen...</option>
              {projects.filter(p => p.status === 'active').map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Notizen (optional)"
            value={newEntry.notes}
            onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
            placeholder="Was wurde gemacht?"
          />

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowAddModal(false)}
            >
              Abbrechen
            </Button>
            <Button className="flex-1" onClick={handleAddEntry}>
              Speichern
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        isOpen={!!editingEntry}
        onClose={() => setEditingEntry(null)}
        title="Eintrag bearbeiten"
      >
        {editingEntry && (
          <div className="space-y-4">
            <Input
              label="Datum"
              type="date"
              value={editingEntry.date}
              onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
            />

            <Input
              label="Notizen"
              value={editingEntry.notes}
              onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setEditingEntry(null)}
              >
                Abbrechen
              </Button>
              <Button className="flex-1" onClick={handleSaveEdit}>
                Speichern
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TimesheetPage;
