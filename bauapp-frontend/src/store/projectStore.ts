import { create } from 'zustand';
import type { Project, Report } from '../types';
import { useAuthStore } from './authStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

const authHeaders = () => {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  reports: Report[];
  isLoading: boolean;

  loadProjects: (userId?: string, role?: 'admin' | 'worker', assignedProjects?: string[]) => Promise<void>;
  loadProjectById: (id: string) => Promise<void>;
  loadReports: (projectId: string) => Promise<void>;
  addReport: (report: Omit<Report, 'id' | 'createdAt'>) => Promise<Report>;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'reportsCount'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  selectedProject: null,
  reports: [],
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE}/api/projects`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });
      const data = await response.json().catch(() => []);
      set({ projects: Array.isArray(data) ? data : [], isLoading: false });
    } catch {
      set({ projects: [], isLoading: false });
    }
  },

  loadProjectById: async (id: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE}/api/projects/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        set({ selectedProject: null, reports: [], isLoading: false });
        return;
      }
      set({ selectedProject: data, reports: data.reports || [], isLoading: false });
    } catch {
      set({ selectedProject: null, reports: [], isLoading: false });
    }
  },

  loadReports: async (projectId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        set({ reports: [], isLoading: false });
        return;
      }
      set({ reports: data.reports || [], isLoading: false });
    } catch {
      set({ reports: [], isLoading: false });
    }
  },

  addReport: async (reportData) => {
    const form = new FormData();
    form.append('projectId', reportData.projectId);
    form.append('text', reportData.text);
    if (reportData.quickActions) {
      form.append('quickActions', JSON.stringify(reportData.quickActions));
    }
    if (reportData.weather) {
      form.append('weather', reportData.weather);
    }
    if (reportData.workersPresent !== undefined) {
      form.append('workersPresent', String(reportData.workersPresent));
    }
    reportData.images.forEach((file) => form.append('images', file));

    const response = await fetch(`${API_BASE}/api/reports`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
      },
      body: form,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      throw new Error('Bericht konnte nicht erstellt werden');
    }

    const newReport: Report = data;
    set((state) => ({
      reports: [newReport, ...state.reports],
    }));

    return newReport;
  },

  createProject: async (projectData) => {
    const response = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(projectData),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      throw new Error('Projekt konnte nicht erstellt werden');
    }

    const newProject: Project = data;
    set((state) => ({
      projects: [newProject, ...state.projects],
    }));

    return newProject;
  },

  updateProject: async (id, updates) => {
    const response = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(updates),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      throw new Error('Projekt konnte nicht aktualisiert werden');
    }

    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? data : p)),
      selectedProject: state.selectedProject?.id === id ? data : state.selectedProject,
    }));
  },
}));
