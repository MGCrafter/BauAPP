# BauApp - Baustellen-Dokumentations-App

Eine Web-Anwendung zur Dokumentation von Baustellen mit Tagesberichten, Bildern und PDF-Export.

## Features

- Projekte und Berichte verwalten
- Bild-Upload und PDF-Export
- JWT-Authentifizierung (inkl. Admin/Worker Rollen)
- SQLite-Storage, Uploads unter `backend/uploads`

## Technologie-Stack

- **Backend**: Python/Flask mit SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Deployment**: Docker + CapRover

## Projektstruktur

```
Test-BauAPP/
├── backend/                 # Flask API Server
│   ├── app.py              # Hauptanwendung
│   ├── auth.py             # Authentifizierung
│   ├── db.py               # Datenbankoperationen
│   ├── image_processing.py # Bildverarbeitung
│   ├── pdf_export.py       # PDF-Export
│   ├── Dockerfile          # Container-Definition
│   └── captain-definition  # CapRover-Konfiguration
├── bauapp-frontend/         # React Frontend
│   ├── src/                # Quellcode
│   ├── Dockerfile          # Multi-stage Build
│   ├── nginx.conf          # Nginx-Konfiguration
│   └── captain-definition  # CapRover-Konfiguration
├── docker-compose.yml       # Lokale Entwicklung & CapRover
├── captain-definition       # CapRover Hauptkonfiguration
└── .env.example            # Umgebungsvariablen-Vorlage
```

## Voraussetzungen

- Python 3.x + `venv`
- Node.js + npm
- (Optional) Docker / Docker Compose fuer Container-Setup

## Lokale Entwicklung

### Schnellstart (bestehende venv/node_modules)

```bash
# Backend (ohne Debug-Server, kompatibel mit eingeschraenkten Umgebungen)
cd backend
./venv/bin/python -c "from app import app; app.run(host='0.0.0.0', port=5000, debug=False)"

# Frontend
cd ../bauapp-frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Aufrufe:
- Backend: http://127.0.0.1:5000
- Frontend: http://127.0.0.1:5173

Logs (wenn im Hintergrund gestartet):
- `backend/backend.log`
- `bauapp-frontend/frontend.log`

### Konfiguration (Umgebungsvariablen)

Backend:
- `SECRET_KEY` (Pflicht in Produktion)
- `DATABASE_PATH` (Standard: `backend/baustelle.db` lokal / `/app/data/baustelle.db` im Container)
- `SOLO_MODE=1` (Dev-Shortcut fuer Admin ohne Token, nur localhost)
- `SOLO_LOCAL_ONLY=1` (erzwingt localhost-only fuer `SOLO_MODE`)

Frontend:
- `VITE_API_URL` (z. B. `http://127.0.0.1:5000`)

Vorlage fuer Deployment: `.env.example` im Root.

### Default Logins (Dev)

- `admin` / `admin123`
- `worker` / `worker123`

### Backend starten

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend starten

```bash
cd bauapp-frontend
npm install
npm run dev
```

### Mit Docker Compose

```bash
docker-compose up --build
```

## CapRover Deployment

### Option 1: Docker-Compose (empfohlen)

1. Erstelle eine neue App in CapRover mit Namen `bauapp`
2. Aktiviere "Has Persistent Data"
3. Deploy via Git oder Tarball mit der `captain-definition` im Root

### Option 2: Separate Apps

#### Backend deployen

```bash
cd backend
caprover deploy -a bauapp-backend
```

Konfiguration in CapRover:
- Port: 5000
- Persistent Data: `/app/uploads`, `/app/data`
- Environment Variables:
  - `SECRET_KEY`: Sicherer Schlüssel
  - `DATABASE_PATH`: `/app/data/baustelle.db`

#### Frontend deployen

```bash
cd bauapp-frontend
caprover deploy -a bauapp-frontend
```

Konfiguration in CapRover:
- Port: 80
- Environment Variables:
  - `BACKEND_URL`: `http://srv-captain--bauapp-backend:5000/`

## API Endpunkte

| Methode | Endpunkt | Beschreibung |
|---------|----------|--------------|
| POST | /api/auth/login | Benutzer-Login |
| GET | /api/auth/me | Aktueller Benutzer |
| GET | /api/projects | Alle Projekte |
| GET | /api/projects/:id | Projekt-Details |
| POST | /api/projects | Neues Projekt (admin) |
| GET | /api/reports | Alle Berichte |
| POST | /api/reports | Neuer Bericht |
| GET | /api/projects/:id/export-pdf | PDF-Export (admin) |
| GET | /api/reports/:id/export-pdf | Bericht-PDF (admin) |

## Umgebungsvariablen

Kopiere `.env.example` zu `.env` und passe die Werte an:

```bash
cp .env.example .env
```

## Troubleshooting

- Debug-Server in eingeschraenkten Umgebungen: Starte Flask ohne Debug-Modus.
- Port belegt: Passe `--port` bei Vite oder `app.run(..., port=...)` an.

## Lizenz

Proprietär - Alle Rechte vorbehalten
