import type { Report } from '../types';

export const mockReports: Report[] = [
  // Projekt 1 - Einfamilienhaus Sonnenberg
  {
    id: 'rep-1',
    projectId: 'proj-1',
    userId: 'worker-1',
    userName: 'Max Huber',
    text: 'Fundament fertig betoniert. Aushärtung läuft. Morgen Kontrolle der Schalung.',
    images: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
    ],
    quickActions: ['Arbeiten abgeschlossen', 'Wetter: Sonnig'],
    createdAt: '2024-01-19T16:30:00Z',
    weather: 'Sonnig, 8°C',
    workersPresent: 4,
  },
  {
    id: 'rep-2',
    projectId: 'proj-1',
    userId: 'worker-2',
    userName: 'Anna Schmidt',
    text: 'Kelleraußenwände Abdichtung angebracht. Drainage verlegt.',
    images: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400',
    ],
    quickActions: ['Material geliefert'],
    createdAt: '2024-01-18T15:00:00Z',
    weather: 'Bewölkt, 6°C',
    workersPresent: 3,
  },
  {
    id: 'rep-3',
    projectId: 'proj-1',
    userId: 'worker-1',
    userName: 'Max Huber',
    text: 'Schalung für Bodenplatte aufgestellt. Bewehrung eingelegt. Betonlieferung für morgen bestätigt.',
    images: [
      'https://images.unsplash.com/photo-1590644365607-1c5a75fcb9e3?w=400',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    ],
    quickActions: ['Arbeiten abgeschlossen'],
    createdAt: '2024-01-17T17:00:00Z',
    weather: 'Sonnig, 10°C',
    workersPresent: 5,
  },

  // Projekt 2 - Dachsanierung
  {
    id: 'rep-4',
    projectId: 'proj-2',
    userId: 'worker-1',
    userName: 'Max Huber',
    text: 'Alte Ziegel komplett entfernt. Dachstuhl freigelegt. Einige Balken müssen getauscht werden.',
    images: [
      'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=400',
    ],
    quickActions: ['Material fehlt', 'Inspektion'],
    createdAt: '2024-01-18T14:00:00Z',
    weather: 'Bewölkt, 4°C',
    workersPresent: 3,
  },
  {
    id: 'rep-5',
    projectId: 'proj-2',
    userId: 'worker-3',
    userName: 'Stefan Weber',
    text: 'Neue Dachbalken geliefert und eingebaut. Sparren verstärkt. Unterspannbahn wird morgen verlegt.',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    ],
    quickActions: ['Material geliefert', 'Arbeiten abgeschlossen'],
    createdAt: '2024-01-17T16:30:00Z',
    weather: 'Sonnig, 7°C',
    workersPresent: 4,
  },

  // Projekt 3 - Bürogebäude
  {
    id: 'rep-6',
    projectId: 'proj-3',
    userId: 'worker-2',
    userName: 'Anna Schmidt',
    text: '3. Stockwerk Rohbau fertig. Fensteröffnungen ausgespart. Elektriker beginnen nächste Woche.',
    images: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
    ],
    quickActions: ['Arbeiten abgeschlossen'],
    createdAt: '2024-01-19T17:00:00Z',
    weather: 'Sonnig, 9°C',
    workersPresent: 8,
  },
  {
    id: 'rep-7',
    projectId: 'proj-3',
    userId: 'worker-3',
    userName: 'Stefan Weber',
    text: 'Tiefgarage: Bodenplatte gegossen. Abdichtung in Arbeit. Problem mit Grundwasser - Pumpen laufen.',
    images: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400',
    ],
    quickActions: ['Sicherheitsproblem', 'Verzögerung'],
    createdAt: '2024-01-18T15:30:00Z',
    weather: 'Regen, 5°C',
    workersPresent: 6,
  },
];

export function getReportsByProject(projectId: string): Report[] {
  return mockReports.filter(r => r.projectId === projectId);
}
