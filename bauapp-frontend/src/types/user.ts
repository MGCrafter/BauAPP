export type UserRole = 'admin' | 'worker';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assignedProjects?: string[];
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
