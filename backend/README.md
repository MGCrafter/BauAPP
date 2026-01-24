# BauAPP Backend (Flask + SQLite)

Dieses Backend entspricht der API-Spezifikation aus `BACKEND-CHECKLIST.md`.

## Features
- JWT Auth: `POST /api/auth/login`, `GET /api/auth/me`
- Projekte: `GET /api/projects`, `GET /api/projects/:id`, `POST /api/projects` (admin)
- Berichte: `POST /api/reports` (multipart: Bilder + OpenCV Scan)
- PDF Export: `GET /api/projects/:id/export-pdf` (admin)
- Uploads werden unter `uploads/<projectId>/...` gespeichert und unter `/uploads/...` ausgeliefert.
- Dev-Shortcut: `SOLO_MODE=1` erlaubt Admin-Zugriff ohne Token (nur localhost, standardmäßig).

## Setup
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

### Default Logins
- admin / admin123
- worker / worker123

## Dev (optional)
```bash
# Admin ohne Token (nur localhost)
export SOLO_MODE=1
python app.py
```

Frontend (React) läuft typischerweise unter http://localhost:3000.
