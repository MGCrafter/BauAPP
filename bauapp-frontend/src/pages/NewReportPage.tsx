import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Camera,
  X,
  Send,
  Cloud,
  Sun,
  CloudRain,
  Users,
  ChevronDown,
  Thermometer,
} from 'lucide-react';
import { Button } from '../components/ui';
import { useProjectStore, useUIStore, useAuthStore } from '../store';
import { QUICK_ACTIONS } from '../types';
import { cn } from '../utils/cn';
import imageCompression from 'browser-image-compression';

const NewReportPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, loadProjectById, addReport, loadProjects } =
    useProjectStore();
  const { addToast, addNotification } = useUIStore();

  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedQuickActions, setSelectedQuickActions] = useState<string[]>([]);
  const [weather, setWeather] = useState('');
  const [temperature, setTemperature] = useState<number | ''>('');
  const [workersPresent, setWorkersPresent] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadProjects(user?.id, user?.role, user?.assignedProjects);
    if (projectId) {
      loadProjectById(projectId);
      setSelectedProjectId(projectId);
    }
  }, [projectId, user]);

  // Voice Recognition Setup
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addToast({
        message: 'Spracherkennung wird nicht unterstützt',
        type: 'warning',
      });
      return;
    }

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'de-DE';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setText((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      addToast({ message: 'Fehler bei Spracherkennung', type: 'error' });
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Image Handling
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      addToast({ message: 'Maximal 10 Bilder erlaubt', type: 'warning' });
      return;
    }

    // Compress images
    const compressedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          return await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
        } catch {
          return file;
        }
      })
    );

    setImages((prev) => [...prev, ...compressedFiles]);

    // Create previews
    compressedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleQuickAction = (action: string) => {
    setSelectedQuickActions((prev) =>
      prev.includes(action)
        ? prev.filter((a) => a !== action)
        : [...prev, action]
    );
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const calcHoursPreview = () => {
    if (!startTime || !endTime) return '';
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    if (Number.isNaN(startH) || Number.isNaN(startM) || Number.isNaN(endH) || Number.isNaN(endM)) {
      return '';
    }
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const pause = typeof breakMinutes === 'number' ? breakMinutes : 0;
    const totalMinutes = Math.max(0, endMinutes - startMinutes - pause);
    const hours = totalMinutes / 60;
    return `${hours.toFixed(1)}h`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectId) {
      addToast({ message: 'Bitte Projekt auswählen', type: 'warning' });
      return;
    }

    if (!text.trim() && selectedQuickActions.length === 0) {
      addToast({ message: 'Bitte Text oder Quick Actions hinzufügen', type: 'warning' });
      return;
    }

    setIsSubmitting(true);

    try {
      await addReport({
        projectId: selectedProjectId,
        userId: user!.id,
        userName: user!.name,
        text: text.trim(),
        images, // Files werden via FormData gesendet
        quickActions: selectedQuickActions,
        weather,
        workersPresent: workersPresent ? Number(workersPresent) : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        breakMinutes: breakMinutes === '' ? undefined : Number(breakMinutes),
      });

      addToast({ message: 'Bericht erstellt!', type: 'success' });
      addNotification({
        title: 'Neuer Bericht',
        message: `${user?.name || 'Ein Mitarbeiter'} hat einen Bericht für "${currentProject?.name || 'ein Projekt'}" erstellt`,
        audience: 'admin',
      });
      navigate(projectId ? `/projects/${projectId}` : '/projects');
    } catch (error) {
      addToast({ message: 'Fehler beim Erstellen', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Neuer Bericht</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Picker */}
        {!projectId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Projekt auswählen
            </label>
            <button
              type="button"
              onClick={() => setShowProjectPicker(!showProjectPicker)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border text-left flex items-center justify-between min-h-[44px]',
                'bg-white dark:bg-gray-800 transition-all',
                showProjectPicker
                  ? 'border-primary-500 ring-2 ring-primary-500'
                  : 'border-gray-200 dark:border-gray-600'
              )}
            >
              <span className={currentProject ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                {currentProject?.name || 'Projekt auswählen...'}
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-gray-400 transition-transform',
                  showProjectPicker && 'rotate-180'
                )}
              />
            </button>

            <AnimatePresence>
              {showProjectPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-lg overflow-hidden max-h-60 overflow-y-auto"
                >
                  {projects.filter(p => p.status === 'active').map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setShowProjectPicker(false);
                      }}
                      className={cn(
                        'w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 min-h-[44px]',
                        selectedProjectId === project.id && 'bg-primary-50 dark:bg-primary-900/30'
                      )}
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{project.customerName}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Text Input with Voice */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Beschreibung
          </label>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Was wurde heute gemacht? Tippen oder Sprache nutzen..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 min-h-[150px] resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={isListening ? stopListening : startListening}
              className={cn(
                'absolute bottom-3 right-3 w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>
          </div>
          {isListening && (
            <p className="text-sm text-primary-600 dark:text-primary-400 mt-2 animate-pulse">
              Spracherkennung aktiv... Sprich jetzt!
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quick Actions
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => (
              <motion.button
                key={action}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleQuickAction(action)}
                className={cn(
                  'px-3 py-2 rounded-full text-sm font-medium transition-all min-h-[44px]',
                  selectedQuickActions.includes(action)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {action}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fotos ({images.length}/10)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          <div className="grid grid-cols-4 gap-2">
            {imagePreviews.map((preview, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
              >
                <img
                  src={preview}
                  alt={`Bild ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}

            {images.length < 10 && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors min-h-[80px]"
              >
                <Camera className="w-6 h-6 mb-1" />
                <span className="text-xs">Hinzufügen</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-4">
          {/* Weather */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Wetter (optional)
            </label>
            <div className="flex gap-2">
              {[
                { icon: Sun, value: 'Sonnig' },
                { icon: Cloud, value: 'Bewölkt' },
                { icon: CloudRain, value: 'Regen' },
              ].map(({ icon: Icon, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWeather(weather === value ? '' : value)}
                  className={cn(
                    'flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all min-h-[44px]',
                    weather === value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:border-gray-300'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature and Workers Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temperatur (optional)
              </label>
              <div className="relative">
                <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="-40"
                  max="50"
                  value={temperature}
                  onChange={(e) =>
                    setTemperature(e.target.value ? parseInt(e.target.value) : '')
                  }
                  placeholder="°C"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arbeiter vor Ort
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  value={workersPresent}
                  onChange={(e) =>
                    setWorkersPresent(e.target.value ? parseInt(e.target.value) : '')
                  }
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Zeiterfassung (optional)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Von
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Bis
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-2">
                Pause (Minuten)
              </label>
              <input
                type="number"
                min="0"
                value={breakMinutes}
                onChange={(e) =>
                  setBreakMinutes(e.target.value ? parseInt(e.target.value) : '')
                }
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-h-[44px]"
              />
            </div>
            {calcHoursPreview() && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Gesamtzeit: {calcHoursPreview()}
              </p>
            )}
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
          disabled={!selectedProjectId || (!text.trim() && selectedQuickActions.length === 0)}
          leftIcon={<Send className="w-5 h-5" />}
        >
          Bericht erstellen
        </Button>
      </form>
    </div>
  );
};

export default NewReportPage;
