import os
import json
import sqlite3
import uuid
import datetime
from werkzeug.security import generate_password_hash

def get_db(db_file: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_file: str, schema_path: str) -> None:
    os.makedirs(os.path.dirname(os.path.abspath(db_file)) if os.path.dirname(db_file) else ".", exist_ok=True)
    conn = get_db(db_file)
    with open(schema_path, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    
    # Lightweight migrations for dev (idempotent)
    def column_exists(table: str, column: str) -> bool:
        cols = conn.execute(f"PRAGMA table_info({table})").fetchall()
        return any(c["name"] == column for c in cols)

    if column_exists("users", "avatar_path") is False:
        conn.execute("ALTER TABLE users ADD COLUMN avatar_path TEXT;")

    
    def table_sql(name: str) -> str:
        row = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", (name,)).fetchone()
        return row["sql"] if row and row["sql"] else ""

    def rebuild_projects_table_if_needed():
        sql = table_sql("projects")
        if "status" in sql and "archived" not in sql:
            # Recreate without the old CHECK constraint (dev migration)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS projects_new (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    customer_name TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT,
                    description TEXT,
                    image_url TEXT
                );
            """)
            conn.execute("""
                INSERT INTO projects_new (id, name, address, customer_name, status, created_at, updated_at, description, image_url)
                SELECT id, name, address, customer_name, status, created_at, updated_at,
                       COALESCE(description, NULL), COALESCE(image_url, NULL)
                FROM projects;
            """)
            conn.execute("DROP TABLE projects;")
            conn.execute("ALTER TABLE projects_new RENAME TO projects;")
    rebuild_projects_table_if_needed()

    # projects new columns
    for col, ddl in [
        ("description", "ALTER TABLE projects ADD COLUMN description TEXT;"),
        ("image_url", "ALTER TABLE projects ADD COLUMN image_url TEXT;"),
    ]:
        if not column_exists("projects", col):
            conn.execute(ddl)

    # archived status: can't change CHECK easily; in dev we accept without enforcing via app logic.

    conn.commit()

    # Seed users (id stable per run if exists already)
    now = datetime.datetime.utcnow().isoformat() + "Z"

    def upsert_user(username: str, name: str, role: str, password: str) -> str:
        row = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if row:
            conn.execute(
                "UPDATE users SET name = ?, role = ?, password_hash = ? WHERE id = ?",
                (name, role, generate_password_hash(password), row["id"])
            )
            return row["id"]
        uid = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO users (id, username, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (uid, username, name, generate_password_hash(password), role, now)
        )
        return uid

    admin_id = upsert_user("admin", "Admin", "admin", "demo123")
    worker_id = upsert_user("max", "Max", "worker", "demo123")

    # Seed projects if missing (optional but helpful)
    projects = [
        ("proj-1", "Neubau Musterstraße 15", "Musterstraße 15, 12345 Berlin", "Firma Mustermann GmbH", "active",
         "Rohbau und Innenausbau", "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"),
        ("proj-2", "Dachsanierung Altstadt", "Altstadtgasse 3, 5020 Salzburg", "Bau & Dach GmbH", "paused",
         "Dachstuhl und Ziegel werden erneuert", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"),
        ("proj-3", "Tiefgarage Citypark", "Industriestraße 77, 4020 Linz", "Citypark Immobilien", "active",
         "Betonarbeiten und Abdichtung", "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"),
    ]
    for pid, name, address, customer, status, desc, img in projects:
        exists = conn.execute("SELECT 1 FROM projects WHERE id = ?", (pid,)).fetchone()
        if exists:
            continue
        conn.execute(
            "INSERT INTO projects (id, name, address, customer_name, status, created_at, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (pid, name, address, customer, status, now, desc, img)
        )
        conn.execute(
            "INSERT OR IGNORE INTO project_assignments (project_id, user_id) VALUES (?, ?)",
            (pid, worker_id)
        )

    # Seed reports if missing
    reports = [
        ("rep-1", "proj-1", "Fundament fertig betoniert. Aushärtung läuft.", ["Arbeiten abgeschlossen"], "Sonnig, 8°C", 4),
        ("rep-2", "proj-1", "Kelleraußenwände Abdichtung angebracht. Drainage verlegt.", ["Material geliefert"], "Bewölkt, 6°C", 3),
        ("rep-3", "proj-2", "Alte Ziegel entfernt. Dachstuhl freigelegt. Einige Balken müssen getauscht werden.", ["Material fehlt", "Inspektion"], "Bewölkt, 4°C", 3),
        ("rep-4", "proj-3", "Bodenplatte gegossen. Problem mit Grundwasser - Pumpen laufen.", ["Sicherheitsproblem"], "Regen, 5°C", 5),
    ]
    for rid, pid, text, qas, weather, workers in reports:
        exists = conn.execute("SELECT 1 FROM reports WHERE id = ?", (rid,)).fetchone()
        if exists:
            continue
        conn.execute(
            "INSERT INTO reports (id, project_id, user_id, text, quick_actions, weather, workers_present, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (rid, pid, worker_id, text, json.dumps(qas, ensure_ascii=False), weather, workers, now)
        )
    conn.commit()
    conn.close()

def ensure_upload_root(upload_root: str) -> None:
    os.makedirs(upload_root, exist_ok=True)

def project_upload_dir(upload_root: str, project_id: str) -> str:
    d = os.path.join(upload_root, project_id)
    os.makedirs(d, exist_ok=True)
    return d
