# BauApp

**Baustellen-Dokumentations-App** - Eine moderne Web-Anwendung zur Dokumentation von Baustellen mit Tagesberichten, Bildern und PDF-Export.

---

## Features

- **Projektverwaltung** - Baustellen anlegen und verwalten
- **Tagesberichte** - Dokumentation mit Text, Wetter und Arbeitszeiten
- **Bild-Upload** - Fotos zu Berichten hinzufügen
- **PDF-Export** - Berichte und Projekte als PDF exportieren
- **Benutzerverwaltung** - Admin und Worker Rollen mit JWT-Authentifizierung
- **Zeiterfassung** - Arbeitsstunden pro Mitarbeiter und Projekt

---

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| **Backend** | Python, Flask, SQLite |
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Deployment** | Docker, Docker Compose, CapRover |

---

## Projektstruktur

```
BauAPP/
├── backend/
│   ├── app.py              # Flask API Server
│   ├── auth.py             # JWT Authentifizierung
│   ├── db.py               # Datenbankoperationen
│   ├── pdf_export.py       # PDF-Generierung
│   ├── schema.sql          # Datenbankschema
│   └── Dockerfile
│
├── bauapp-frontend/
│   ├── src/
│   │   ├── components/     # React Komponenten
│   │   ├── pages/          # Seiten
│   │   ├── store/          # Zustand (Zustand)
│   │   └── types/          # TypeScript Typen
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
└── .env.example
```

---

## Installation

### Voraussetzungen

- Python 3.x
- Node.js 18+
- npm oder yarn

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd bauapp-frontend
npm install
npm run dev
```

### Mit Docker Compose

```bash
docker-compose up --build
```

---

## Konfiguration

### Umgebungsvariablen

Kopiere `.env.example` zu `.env`:

```bash
cp .env.example .env
```

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `SECRET_KEY` | JWT Secret Key | - |
| `DATABASE_PATH` | Pfad zur SQLite DB | `backend/baustelle.db` |
| `VITE_API_URL` | Backend URL für Frontend | `http://127.0.0.1:5000` |

### Standard-Logins (Entwicklung)

| Benutzer | Passwort | Rolle |
|----------|----------|-------|
| admin | admin123 | Admin |
| worker | worker123 | Worker |

---

## API Endpunkte

### Authentifizierung

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Aktueller Benutzer |

### Projekte

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/api/projects` | Alle Projekte |
| GET | `/api/projects/:id` | Projekt-Details |
| POST | `/api/projects` | Neues Projekt |
| GET | `/api/projects/:id/export-pdf` | PDF-Export |

### Berichte

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/api/reports` | Alle Berichte |
| POST | `/api/reports` | Neuer Bericht |
| GET | `/api/reports/:id/export-pdf` | Bericht-PDF |

### Zeiterfassung

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| GET | `/api/timesheets` | Zeiteinträge |
| POST | `/api/timesheets` | Neuer Eintrag |

---

## Deployment

### CapRover

1. Neue App erstellen: `bauapp`
2. "Has Persistent Data" aktivieren
3. Deploy via Git oder Tarball

**Backend Konfiguration:**
- Port: 5000
- Persistent Data: `/app/uploads`, `/app/data`

**Frontend Konfiguration:**
- Port: 80
- `BACKEND_URL`: `http://srv-captain--bauapp-backend:5000/`

---

## Lizenz

Proprietär - Alle Rechte vorbehalten
