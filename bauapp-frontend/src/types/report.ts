export interface Report {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  text: string;
  images: string[];
  quickActions?: string[];
  createdAt: string;
  weather?: string;
  workersPresent?: number;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number | null;
}

export interface ReportFormData {
  projectId: string;
  text: string;
  images: File[];
  quickActions?: string[];
  weather?: string;
  workersPresent?: number;
  startTime?: string | null;
  endTime?: string | null;
  breakMinutes?: number | null;
}

export const QUICK_ACTIONS = [
  'Material geliefert',
  'Material fehlt',
  'Arbeiten abgeschlossen',
  'Wetter: Regen',
  'Wetter: Sonnig',
  'Verzögerung',
  'Inspektion',
  'Sicherheitsproblem',
] as const;

export type QuickAction = typeof QUICK_ACTIONS[number];
