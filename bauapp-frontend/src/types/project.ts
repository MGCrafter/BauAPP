export type ProjectStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface Project {
  id: string;
  name: string;
  address: string;
  customerName: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt?: string;
  assignedWorkers: string[];
  description?: string;
  imageUrl?: string;
  reportsCount?: number;
}

export interface ProjectWithReports extends Project {
  reports: import('./report').Report[];
}
