# BauApp - Digitale Baustellendokumentation

Eine Progressive Web App (PWA) zur digitalen Erfassung und Verwaltung von Baustellenberichten.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss)

## Funktionen

- **Projektmanagement** - Bauprojekte anlegen und verwalten
- **Tagesberichte** - Arbeitsfortschritt dokumentieren mit Text und Fotos
- **Spracherkennung** - Berichte per Spracheingabe erstellen
- **Bildkomprimierung** - Automatische Optimierung von Fotos für schnellen Upload
- **Offline-fähig** - Als PWA auch ohne Internetverbindung nutzbar
- **Responsive Design** - Optimiert für Mobile (Bauarbeiter) und Desktop (Büro)
- **Admin-Dashboard** - Benutzerverwaltung und Projektübersicht

## Tech Stack

| Technologie | Verwendung |
|-------------|------------|
| React 19 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool & Dev Server |
| Tailwind CSS | Styling |
| Zustand | State Management |
| React Router | Routing |
| Axios | HTTP Client |
| Lucide React | Icons |
| browser-image-compression | Bildoptimierung |

## Installation

```bash
# Repository klonen
git clone https://github.com/MGCrafter/BauAPP.git
cd BauAPP

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Die App ist dann unter `http://localhost:3000` erreichbar.

## Scripts

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Startet den Entwicklungsserver |
| `npm run build` | Erstellt Production Build |
| `npm run preview` | Vorschau des Production Builds |
| `npm run lint` | Führt ESLint aus |

## Projektstruktur

```
src/
├── components/
│   ├── auth/          # Authentifizierung (ProtectedRoute)
│   ├── layout/        # Layout-Komponenten (Header, Sidebar, MobileNav)
│   └── ui/            # Wiederverwendbare UI-Komponenten
├── pages/             # Seiten-Komponenten
├── store/             # Zustand State Management
├── types/             # TypeScript Definitionen
├── mock/              # Mock-Daten für Entwicklung
├── utils/             # Hilfsfunktionen
└── router.tsx         # React Router Konfiguration
```

## Umgebungsvariablen

Erstelle eine `.env` Datei im Root-Verzeichnis:

```env
VITE_API_URL=http://localhost:5000/api
VITE_MAX_IMAGE_SIZE=5242880
VITE_IMAGE_COMPRESSION_QUALITY=0.8
```

## Screenshots

*Screenshots folgen*

## Roadmap

- [x] Grundlegende Projektstruktur
- [x] Authentifizierung & Login
- [x] Projektübersicht
- [x] Berichterstellung mit Fotos
- [x] Spracherkennung
- [ ] Backend-Integration
- [ ] Offline-Synchronisation
- [ ] PDF-Export
- [ ] Material-Tracking

## Lizenz

Dieses Projekt ist privat und nicht zur öffentlichen Nutzung freigegeben.

---

Entwickelt mit React + TypeScript + Vite
