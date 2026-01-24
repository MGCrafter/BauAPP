import { create } from 'zustand';
import type { Project, Report, ReportFormData } from '../types';
import { mockProjects } from '../mock/projects';
import { getReportsByProject } from '../mock/reports';
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
  addReport: (report: ReportFormData) => Promise<Report>;
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
      set({ projects: mockProjects, isLoading: false });
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
        const fallbackProject = mockProjects.find((p) => p.id === id) || null;
        set({
          selectedProject: fallbackProject,
          reports: fallbackProject ? getReportsByProject(fallbackProject.id) : [],
          isLoading: false,
        });
        return;
      }
      set({ selectedProject: data, reports: data.reports || [], isLoading: false });
    } catch {
      const fallbackProject = mockProjects.find((p) => p.id === id) || null;
      set({
        selectedProject: fallbackProject,
        reports: fallbackProject ? getReportsByProject(fallbackProject.id) : [],
        isLoading: false,
      });
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
        set({ reports: getReportsByProject(projectId), isLoading: false });
        return;
      }
      set({ reports: data.reports || [], isLoading: false });
    } catch {
      set({ reports: getReportsByProject(projectId), isLoading: false });
    }
  },

  addReport: async (reportData) => {
    const hasFiles = reportData.images.some((item) => item instanceof File);
    const headers = { ...authHeaders() } as Record<string, string>;
    let body: FormData | string;

    if (hasFiles) {
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
      if (reportData.startTime) {
        form.append('startTime', reportData.startTime);
      }
      if (reportData.endTime) {
        form.append('endTime', reportData.endTime);
      }
      if (reportData.breakMinutes !== undefined && reportData.breakMinutes !== null) {
        form.append('breakMinutes', String(reportData.breakMinutes));
      }
      reportData.images.forEach((file) => {
        if (file instanceof File) {
          form.append('images', file);
        }
      });
      body = form;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        projectId: reportData.projectId,
        text: reportData.text,
        quickActions: reportData.quickActions,
        weather: reportData.weather,
        workersPresent: reportData.workersPresent,
        startTime: reportData.startTime,
        endTime: reportData.endTime,
        breakMinutes: reportData.breakMinutes,
      });
    }

    const response = await fetch(`${API_BASE}/api/reports`, {
      method: 'POST',
      headers,
      body,
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
