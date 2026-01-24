# BauApp - Baustellen-Dokumentations-App

Eine Web-Anwendung zur Dokumentation von Baustellen mit Tagesberichten, Bildern und PDF-Export.

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

## Lokale Entwicklung

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
| POST | /auth/login | Benutzer-Login |
| GET | /projects | Alle Projekte |
| POST | /projects | Neues Projekt |
| GET | /reports | Alle Berichte |
| POST | /reports | Neuer Bericht |
| GET | /reports/:id/pdf | PDF-Export |

## Umgebungsvariablen

Kopiere `.env.example` zu `.env` und passe die Werte an:

```bash
cp .env.example .env
```

## Lizenz

Proprietär - Alle Rechte vorbehalten
