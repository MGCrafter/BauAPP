import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface Settings {
  darkMode: boolean;
  notifications: boolean;
  language: 'de' | 'en';
  autoSync: boolean;
  imageQuality: 'low' | 'medium' | 'high';
}

interface UIState {
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  toasts: Toast[];
  settings: Settings;

  toggleSidebar: () => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  updateSettings: (updates: Partial<Settings>) => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isSidebarOpen: false,
      isModalOpen: false,
      modalContent: null,
      toasts: [],
      settings: {
        darkMode: false,
        notifications: true,
        language: 'de',
        autoSync: true,
        imageQuality: 'high',
      },

      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      openModal: (content) => set({ isModalOpen: true, modalContent: content }),

      closeModal: () => set({ isModalOpen: false, modalContent: null }),

      addToast: (toast) => {
        const id = `toast-${Date.now()}`;
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id }],
        }));

        // Auto-remove nach 4 Sekunden
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }));
        }, 4000);
      },

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      toggleDarkMode: () => {
        const newDarkMode = !get().settings.darkMode;
        set((state) => ({
          settings: { ...state.settings, darkMode: newDarkMode },
        }));
        // Apply to DOM
        if (newDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }),
    {
      name: 'bauapp-ui-storage',
      partialize: (state) => ({ settings: state.settings }),
      onRehydrateStorage: () => (state) => {
        // Apply dark mode on load
        if (state?.settings.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
