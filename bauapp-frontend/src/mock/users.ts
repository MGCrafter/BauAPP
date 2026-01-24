import type { User } from '../types';

export const mockUsers: User[] = [
  {
    id: 'admin-1',
    username: 'admin',
    name: 'Thomas Müller',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas',
  },
  {
    id: 'worker-1',
    username: 'max',
    name: 'Max Huber',
    role: 'worker',
    assignedProjects: ['proj-1', 'proj-2', 'proj-4', 'proj-5', 'proj-7'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max',
  },
  {
    id: 'worker-2',
    username: 'anna',
    name: 'Anna Schmidt',
    role: 'worker',
    assignedProjects: ['proj-1', 'proj-3', 'proj-5', 'proj-6', 'proj-8'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
  },
  {
    id: 'worker-3',
    username: 'stefan',
    name: 'Stefan Weber',
    role: 'worker',
    assignedProjects: ['proj-2', 'proj-3', 'proj-4', 'proj-7', 'proj-8'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan',
  },
  {
    id: 'worker-4',
    username: 'lisa',
    name: 'Lisa Bauer',
    role: 'worker',
    assignedProjects: ['proj-1', 'proj-4', 'proj-6'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
  },
  {
    id: 'worker-5',
    username: 'markus',
    name: 'Markus Gruber',
    role: 'worker',
    assignedProjects: ['proj-2', 'proj-5', 'proj-7'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Markus',
  },
  {
    id: 'worker-6',
    username: 'julia',
    name: 'Julia Fischer',
    role: 'worker',
    assignedProjects: ['proj-3', 'proj-6', 'proj-8'],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia',
  },
];

// Demo-Passwort für alle: "demo123"
export const mockCredentials: Record<string, string> = {
  'admin': 'demo123',
  'max': 'demo123',
  'anna': 'demo123',
  'stefan': 'demo123',
  'lisa': 'demo123',
  'markus': 'demo123',
  'julia': 'demo123',
};
