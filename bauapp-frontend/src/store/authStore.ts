import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            set({
              isLoading: false,
              error: data?.error || 'Anmeldung fehlgeschlagen',
            });
            return false;
          }

          const user: User = {
            id: data.user.id,
            username: data.user.username,
            name: data.user.name,
            role: data.user.role,
            assignedProjects: data.user.assignedProjects || [],
            avatar: data.user.avatarUrl || undefined,
          };

          set({
            user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (err) {
          set({
            isLoading: false,
            error: 'Server nicht erreichbar',
          });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
