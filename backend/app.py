import os
import json
import uuid
import datetime
from typing import List, Optional

from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename

from config import Config
from db import get_db, init_db, ensure_upload_root, project_upload_dir
from auth import token_required, create_token, require_admin
from image_processing import save_images_for_report
from pdf_export import build_project_pdf, build_report_pdf

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

def iso_now() -> str:
    return datetime.datetime.utcnow().isoformat() + "Z"

def _rel_from_base(path: str) -> str:
    if os.path.isabs(path):
        rel = os.path.relpath(path, BASE_DIR)
    else:
        rel = path
    return rel.replace("\\", "/")

def make_url(rel_path: str) -> str:
    rel_path = rel_path.replace("\\", "/").lstrip("/")
    return request.host_url.rstrip("/") + "/" + rel_path

def make_upload_url(file_path: str) -> str:
    return make_url(_rel_from_base(file_path))

def get_assigned_projects(conn, user_id: str) -> List[str]:
    rows = conn.execute("SELECT project_id FROM project_assignments WHERE user_id = ?", (user_id,)).fetchall()
    return [r["project_id"] for r in rows]

def get_assigned_workers(conn, project_id: str) -> List[str]:
    rows = conn.execute("SELECT user_id FROM project_assignments WHERE project_id = ?", (project_id,)).fetchall()
    return [r["user_id"] for r in rows]

def get_avatar_url(conn, user_id: str) -> Optional[str]:
    row = conn.execute("SELECT avatar_path FROM users WHERE id = ?", (user_id,)).fetchone()
    if row and row["avatar_path"]:
        return make_upload_url(row["avatar_path"])
    return None

app = Flask(__name__)
app.config.from_object(Config)
app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH

# Dev-friendly CORS: allow frontend from LAN/localhost.
CORS(app, resources={r"/api/*": {"origins": "*"}})

ensure_upload_root(app.config["UPLOAD_ROOT"])
init_db(app.config["DB_FILE"], os.path.join(BASE_DIR, "schema.sql"))

@app.get("/uploads/<path:subpath>")
def serve_uploads(subpath: str):
    full = os.path.join(BASE_DIR, app.config["UPLOAD_ROOT"], subpath)
    if not os.path.exists(full):
        abort(404)
    return send_file(full)

# -----------------------
# Auth
# -----------------------
@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username und Passwort erforderlich"}), 400

    conn = get_db(app.config["DB_FILE"])
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        conn.close()
        return jsonify({"error": "Ungültige Anmeldedaten"}), 401

    token = create_token(user["id"])
    assigned = get_assigned_projects(conn, user["id"]) if user["role"] == "worker" else []
    avatar_url = get_avatar_url(conn, user["id"])
    conn.close()

    return jsonify({
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "name": user["name"] or user["username"],
            "role": user["role"],
            "assignedProjects": assigned,
            "avatarUrl": avatar_url
        }
    }), 200

@app.get("/api/auth/me")
@token_required
def me(current_user_id: str):
    conn = get_db(app.config["DB_FILE"])
    user = conn.execute("SELECT id, username, name, role, avatar_path FROM users WHERE id = ?", (current_user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Ungültiger oder abgelaufener Token"}), 401

    assigned = get_assigned_projects(conn, user["id"]) if user["role"] == "worker" else []
    avatar_url = make_upload_url(user["avatar_path"]) if user["avatar_path"] else None
    conn.close()

    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "name": user["name"] or user["username"],
        "role": user["role"],
        "assignedProjects": assigned,
        "avatarUrl": avatar_url
    }), 200

# -----------------------
# Users
# -----------------------
@app.put("/api/users/me/avatar")
@token_required
def update_avatar(current_user_id: str):
    if "avatar" not in request.files:
        return jsonify({"error": "avatar fehlt"}), 400

    f = request.files["avatar"]
    if not f or not f.filename:
        return jsonify({"error": "Ungültige Datei"}), 400

    filename = secure_filename(f.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        return jsonify({"error": "Nur jpg/png/webp erlaubt"}), 400

    avatars_dir = os.path.join(app.config["UPLOAD_ROOT"], "avatars")
    os.makedirs(avatars_dir, exist_ok=True)

    out_name = f"{current_user_id}{ext}"
    full_path = os.path.join(avatars_dir, out_name)
    f.save(full_path)

    rel = _rel_from_base(full_path)

    conn = get_db(app.config["DB_FILE"])
    conn.execute("UPDATE users SET avatar_path = ? WHERE id = ?", (rel, current_user_id))
    conn.commit()
    conn.close()

    return jsonify({"avatarUrl": make_upload_url(rel)}), 200


@app.get("/api/users")
@token_required
def list_users(current_user_id: str):
    if not require_admin(current_user_id):
        return jsonify({"error": "Keine Berechtigung"}), 403
    conn = get_db(app.config["DB_FILE"])
    rows = conn.execute("SELECT id, username, name, role, avatar_path FROM users ORDER BY created_at DESC").fetchall()
    out = []
    for u in rows:
        out.append({
            "id": u["id"],
            "username": u["username"],
            "name": u["name"] or u["username"],
            "role": u["role"],
            "avatarUrl": make_upload_url(u["avatar_path"]) if u["avatar_path"] else None
        })
    conn.close()
    return jsonify(out), 200


# -----------------------
# Projects
# -----------------------
@app.get("/api/projects")
@token_required
def get_projects(current_user_id: str):
    conn = get_db(app.config["DB_FILE"])
    user = conn.execute("SELECT role FROM users WHERE id = ?", (current_user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Ungültiger oder abgelaufener Token"}), 401

    base_select = """
        SELECT p.*,
               (SELECT COUNT(*) FROM reports r WHERE r.project_id = p.id) AS reports_count
        FROM projects p
    """

    if user["role"] == "admin":
        projects = conn.execute(base_select + " ORDER BY p.created_at DESC").fetchall()
    else:
        projects = conn.execute(base_select + """
            JOIN project_assignments pa ON p.id = pa.project_id
            WHERE pa.user_id = ?
            ORDER BY p.created_at DESC
        """, (current_user_id,)).fetchall()

    result = []
    for p in projects:
        workers = get_assigned_workers(conn, p["id"])
        result.append({
            "id": p["id"],
            "name": p["name"],
            "address": p["address"],
            "customerName": p["customer_name"],
            "status": p["status"],
            "createdAt": p["created_at"],
            "updatedAt": p["updated_at"],
            "description": p["description"],
            "imageUrl": p["image_url"],
            "reportsCount": int(p["reports_count"] or 0),
            "assignedWorkers": workers
        })

    conn.close()
    return jsonify(result), 200

@app.get("/api/projects/<project_id>")
@token_required
def get_project(current_user_id: str, project_id: str):
    conn = get_db(app.config["DB_FILE"])
    project = conn.execute("""
        SELECT p.*,
               (SELECT COUNT(*) FROM reports r WHERE r.project_id = p.id) AS reports_count
        FROM projects p
        WHERE p.id = ?
    """, (project_id,)).fetchone()
    if not project:
        conn.close()
        return jsonify({"error": "Projekt nicht gefunden"}), 404

    user = conn.execute("SELECT role FROM users WHERE id = ?", (current_user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Ungültiger oder abgelaufener Token"}), 401

    if user["role"] == "worker":
        assigned = conn.execute(
            "SELECT 1 FROM project_assignments WHERE project_id = ? AND user_id = ?",
            (project_id, current_user_id)
        ).fetchone()
        if not assigned:
            conn.close()
            return jsonify({"error": "Kein Zugriff auf dieses Projekt"}), 403

    workers = get_assigned_workers(conn, project_id)

    reports_raw = conn.execute("""
        SELECT r.*, u.username, u.name
        FROM reports r
        JOIN users u ON r.user_id = u.id
        WHERE r.project_id = ?
        ORDER BY r.created_at DESC
    """, (project_id,)).fetchall()

    reports = []
    for r in reports_raw:
        imgs = conn.execute("SELECT file_path FROM report_images WHERE report_id = ?", (r["id"],)).fetchall()
        img_urls = [make_upload_url(img["file_path"]) for img in imgs]
        qas = []
        if r["quick_actions"]:
            try:
                qas = json.loads(r["quick_actions"])
            except Exception:
                qas = []
        reports.append({
            "id": r["id"],
            "projectId": r["project_id"],
            "userId": r["user_id"],
            "userName": (r["name"] or r["username"]),
            "text": r["text"],
            "images": img_urls,
            "quickActions": qas,
            "weather": r["weather"],
            "workersPresent": r["workers_present"],
            "startTime": r["start_time"],
            "endTime": r["end_time"],
            "breakMinutes": r["break_minutes"],
            "createdAt": r["created_at"]
        })

    payload = {
        "id": project["id"],
        "name": project["name"],
        "address": project["address"],
        "customerName": project["customer_name"],
        "status": project["status"],
        "createdAt": project["created_at"],
        "updatedAt": project["updated_at"],
        "description": project["description"],
        "imageUrl": project["image_url"],
        "reportsCount": int(project["reports_count"] or 0),
        "assignedWorkers": workers,
        "reports": reports
    }
    conn.close()
    return jsonify(payload), 200

@app.post("/api/projects")
@token_required
def create_project(current_user_id: str):
    if not require_admin(current_user_id):
        return jsonify({"error": "Keine Berechtigung"}), 403

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    address = (data.get("address") or "").strip()
    customer = (data.get("customerName") or "").strip()
    description = (data.get("description") or "").strip() or None
    image_url = (data.get("imageUrl") or "").strip() or None
    status = (data.get("status") or "active").strip()
    assigned = data.get("assignedWorkers") or []

    if status not in ("active", "paused", "completed", "archived"):
        status = "active"

    if not name or not address or not customer:
        return jsonify({"error": "name, address und customerName sind erforderlich"}), 400

    project_id = str(uuid.uuid4())
    now = iso_now()
    conn = get_db(app.config["DB_FILE"])
    conn.execute(
        "INSERT INTO projects (id, name, address, customer_name, status, created_at, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (project_id, name, address, customer, status, now, description, image_url)
    )
    for worker_id in assigned:
        conn.execute(
            "INSERT OR IGNORE INTO project_assignments (project_id, user_id) VALUES (?, ?)",
            (project_id, worker_id)
        )
    conn.commit()
    conn.close()

    return jsonify({
        "id": project_id,
        "name": name,
        "address": address,
        "customerName": customer,
        "status": status,
        "createdAt": now,
        "description": description,
        "imageUrl": image_url,
        "reportsCount": 0,
        "assignedWorkers": list(assigned)
    }), 201

@app.patch("/api/projects/<project_id>")
@token_required
def patch_project(current_user_id: str, project_id: str):
    if not require_admin(current_user_id):
        return jsonify({"error": "Keine Berechtigung"}), 403

    data = request.get_json(silent=True) or {}
    allowed = {"name", "address", "customerName", "status", "description", "imageUrl", "assignedWorkers"}
    updates = {k: data.get(k) for k in data.keys() if k in allowed}

    if not updates:
        return jsonify({"error": "Keine Änderungen"}), 400

    conn = get_db(app.config["DB_FILE"])
    proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        conn.close()
        return jsonify({"error": "Projekt nicht gefunden"}), 404

    fields = []
    params = []

    if "name" in updates and updates["name"] is not None:
        fields.append("name = ?")
        params.append(str(updates["name"]).strip())
    if "address" in updates and updates["address"] is not None:
        fields.append("address = ?")
        params.append(str(updates["address"]).strip())
    if "customerName" in updates and updates["customerName"] is not None:
        fields.append("customer_name = ?")
        params.append(str(updates["customerName"]).strip())
    if "status" in updates and updates["status"] is not None:
        st = str(updates["status"]).strip()
        if st not in ("active", "paused", "completed", "archived"):
            st = proj["status"]
        fields.append("status = ?")
        params.append(st)
    if "description" in updates:
        desc = updates["description"]
        fields.append("description = ?")
        params.append((str(desc).strip() if desc is not None and str(desc).strip() else None))
    if "imageUrl" in updates:
        iu = updates["imageUrl"]
        fields.append("image_url = ?")
        params.append((str(iu).strip() if iu is not None and str(iu).strip() else None))

    if "assignedWorkers" in updates and updates["assignedWorkers"] is not None:
        conn.execute("DELETE FROM project_assignments WHERE project_id = ?", (project_id,))
        for uid in updates["assignedWorkers"]:
            conn.execute(
                "INSERT OR IGNORE INTO project_assignments (project_id, user_id) VALUES (?, ?)",
                (project_id, uid)
            )

    fields.append("updated_at = ?")
    params.append(iso_now())

    params.append(project_id)
    conn.execute(f"UPDATE projects SET {', '.join(fields)} WHERE id = ?", params)
    conn.commit()

    row = conn.execute("""
        SELECT p.*, (SELECT COUNT(*) FROM reports r WHERE r.project_id = p.id) AS reports_count
        FROM projects p WHERE p.id = ?
    """, (project_id,)).fetchone()
    workers = get_assigned_workers(conn, project_id)
    conn.close()

    return jsonify({
        "id": row["id"],
        "name": row["name"],
        "address": row["address"],
        "customerName": row["customer_name"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "description": row["description"],
        "imageUrl": row["image_url"],
        "reportsCount": int(row["reports_count"] or 0),
        "assignedWorkers": workers
    }), 200

@app.post("/api/projects/<project_id>/archive")
@token_required
def archive_project(current_user_id: str, project_id: str):
    if not require_admin(current_user_id):
        return jsonify({"error": "Keine Berechtigung"}), 403
    conn = get_db(app.config["DB_FILE"])
    row = conn.execute("SELECT id FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Projekt nicht gefunden"}), 404
    conn.execute("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?", ("archived", iso_now(), project_id))
    conn.commit()
    conn.close()
    return jsonify({"ok": True}), 200

@app.delete("/api/projects/<project_id>")
@token_required
def delete_project(current_user_id: str, project_id: str):
    if not require_admin(current_user_id):
        return jsonify({"error": "Keine Berechtigung"}), 403
    conn = get_db(app.config["DB_FILE"])
    row = conn.execute("SELECT id FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Projekt nicht gefunden"}), 404
    conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return jsonify({"ok": True}), 200

# -----------------------
# Reports
# -----------------------

@app.get("/api/reports")
@token_required
def list_reports(current_user_id: str):
    conn = get_db(app.config["DB_FILE"])
    user = conn.execute("SELECT role FROM users WHERE id = ?", (current_user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Ungültiger oder abgelaufener Token"}), 401

    base_sql = """
        SELECT r.*, u.username, u.name, p.name AS project_name, p.address AS project_address
        FROM reports r
        JOIN users u ON u.id = r.user_id
        JOIN projects p ON p.id = r.project_id
    """

    if user["role"] == "admin":
        rows = conn.execute(base_sql + " ORDER BY r.created_at DESC").fetchall()
    else:
        rows = conn.execute(base_sql + """
            JOIN project_assignments pa ON pa.project_id = p.id
            WHERE pa.user_id = ?
            ORDER BY r.created_at DESC
        """, (current_user_id,)).fetchall()

    reports = []
    for r in rows:
        imgs = conn.execute("SELECT file_path FROM report_images WHERE report_id = ?", (r["id"],)).fetchall()
        img_urls = [make_upload_url(img["file_path"]) for img in imgs]
        qas = []
        if r["quick_actions"]:
            try:
                qas = json.loads(r["quick_actions"])
            except Exception:
                qas = []
        reports.append({
            "id": r["id"],
            "projectId": r["project_id"],
            "projectName": r["project_name"],
            "projectAddress": r["project_address"],
            "userId": r["user_id"],
            "userName": (r["name"] or r["username"]),
            "text": r["text"],
            "images": img_urls,
            "quickActions": qas,
            "weather": r["weather"],
            "workersPresent": r["workers_present"],
            "startTime": r["start_time"],
            "endTime": r["end_time"],
            "breakMinutes": r["break_minutes"],
            "createdAt": r["created_at"]
        })

    conn.close()
    return jsonify(reports), 200

@app.get("/api/reports/<report_id>")
@token_required
def get_report(current_user_id: str, report_id: str):
    conn = get_db(app.config["DB_FILE"])
    r = conn.execute("""
        SELECT r.*, u.username, u.name, p.name AS project_name, p.address AS project_address
        FROM reports r
        JOIN users u ON u.id = r.user_id
        JOIN projects p ON p.id = r.project_id
        WHERE r.id = ?
    """, (report_id,)).fetchone()
    if not r:
        conn.close()
        return jsonify({"error": "Bericht nicht gefunden"}), 404

    user = conn.execute("SELECT role FROM users WHERE id = ?", (current_user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Ungültiger oder abgelaufener Token"}), 401

    if user["role"] == "worker":
        assigned = conn.execute(
            "SELECT 1 FROM project_assignments WHERE project_id = ? AND user_id = ?",
            (r["project_id"], current_user_id)
        ).fetchone()
        if not assigned:
            conn.close()
            return jsonify({"error": "Kein Zugriff"}), 403

    imgs = conn.execute("SELECT file_path FROM report_images WHERE report_id = ?", (report_id,)).fetchall()
    img_urls = [make_upload_url(img["file_path"]) for img in imgs]

    qas = []
    if r["quick_actions"]:
        try:
            qas = json.loads(r["quick_actions"])
        except Exception:
            qas = []

    payload = {
        "id": r["id"],
        "projectId": r["project_id"],
        "projectName": r["project_name"],
        "projectAddress": r["project_address"],
        "userId": r["user_id"],
        "userName": (r["name"] or r["username"]),
        "text": r["text"],
        "images": img_urls,
        "quickActions": qas,
        "weather": r["weather"],
        "workersPresent": r["workers_present"],
        "startTime": r["start_time"],
        "endTime": r["end_time"],
        "breakMinutes": r["break_minutes"],
        "createdAt": r["created_at"]
    }
    conn.close()
    return jsonify(payload), 200

@app.post("/api/reports")
@token_required
def create_report(current_user_id: str):
    data = request.get_json(silent=True) if request.is_json else request.form
    if data is None:
        data = {}
    project_id = (data.get("projectId") or "").strip()
    text = (data.get("text") or "").strip()
    quick_actions_raw = data.get("quickActions") or ""
    weather = data.get("weather")
    workers_present = data.get("workersPresent")
    start_time = (data.get("startTime") or "").strip() or None
    end_time = (data.get("endTime") or "").strip() or None
    break_minutes = data.get("breakMinutes")
    images = request.files.getlist("images") if not request.is_json else []

    qas_list = []
    if quick_actions_raw:
        if isinstance(quick_actions_raw, list):
            qas_list = quick_actions_raw
        else:
            try:
                qas_list = json.loads(quick_actions_raw)
                if not isinstance(qas_list, list):
                    qas_list = []
            except Exception:
                qas_list = []

    if not project_id or (not text and not qas_list):
        return jsonify({"error": "projectId und (text oder quickActions) sind erforderlich"}), 400

    conn = get_db(app.config["DB_FILE"])
    user = conn.execute("SELECT id, role, username, name FROM users WHERE id = ?", (current_user_id,)).fetchone()
    if not user:
        conn.close()
        return jsonify({"error": "Ungültiger oder abgelaufener Token"}), 401

    if user["role"] == "worker":
        assigned = conn.execute(
            "SELECT 1 FROM project_assignments WHERE project_id = ? AND user_id = ?",
            (project_id, current_user_id)
        ).fetchone()
        if not assigned:
            conn.close()
            return jsonify({"error": "Kein Zugriff auf dieses Projekt"}), 403

    proj = conn.execute("SELECT id FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        conn.close()
        return jsonify({"error": "Projekt nicht gefunden"}), 404

    report_id = str(uuid.uuid4())
    now = iso_now()

    wp_int = None
    if workers_present is not None and str(workers_present).strip() != "":
        try:
            wp_int = int(workers_present)
        except Exception:
            wp_int = None

    break_int = None
    if break_minutes is not None and str(break_minutes).strip() != "":
        try:
            break_int = int(break_minutes)
        except Exception:
            break_int = None

    conn.execute(
        "INSERT INTO reports (id, project_id, user_id, text, quick_actions, weather, workers_present, start_time, end_time, break_minutes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (
            report_id,
            project_id,
            current_user_id,
            text,
            json.dumps(qas_list, ensure_ascii=False),
            weather,
            wp_int,
            start_time,
            end_time,
            break_int,
            now,
        )
    )

    upload_dir = project_upload_dir(app.config["UPLOAD_ROOT"], project_id)
    saved_paths = save_images_for_report(upload_dir, images, apply_scan=True, max_images=10)

    image_urls = []
    for p in saved_paths:
        rel = _rel_from_base(p)
        conn.execute("INSERT INTO report_images (report_id, file_path) VALUES (?, ?)", (report_id, rel))
        image_urls.append(make_upload_url(rel))

    conn.commit()
    conn.close()

    return jsonify({
        "id": report_id,
        "projectId": project_id,
        "userId": current_user_id,
        "userName": (user["name"] or user["username"]),
        "text": text,
        "images": image_urls,
        "quickActions": qas_list,
        "weather": weather,
        "workersPresent": wp_int,
        "startTime": start_time,
        "endTime": end_time,
        "breakMinutes": break_int,
        "createdAt": now
    }), 201

# -----------------------
# PDF Export
# -----------------------
@app.get("/api/projects/<project_id>/export-pdf")
@token_required
def export_pdf(current_user_id: str, project_id: str):
    if not require_admin(current_user_id):
        return jsonify({"error": "Keine Berechtigung"}), 403

    conn = get_db(app.config["DB_FILE"])
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not project:
        conn.close()
        return jsonify({"error": "Projekt nicht gefunden"}), 404

    reports = conn.execute("""
        SELECT r.*, u.username AS user_name, u.name AS full_name
        FROM reports r
        JOIN users u ON u.id = r.user_id
        WHERE r.project_id = ?
        ORDER BY r.created_at ASC
    """, (project_id,)).fetchall()

    report_images = {}
    for r in reports:
        imgs = conn.execute("SELECT file_path FROM report_images WHERE report_id = ?", (r["id"],)).fetchall()
        paths = []
        for img in imgs:
            p = img["file_path"]
            full = os.path.join(BASE_DIR, p) if not os.path.isabs(p) else p
            paths.append(full)
        report_images[r["id"]] = paths

    rep_dicts = []
    for r in reports:
        qa = []
        if r["quick_actions"]:
            try:
                qa = json.loads(r["quick_actions"])
            except Exception:
                qa = []
        rep_dicts.append({
            "id": r["id"],
            "text": r["text"],
            "created_at": r["created_at"],
            "user_name": r["full_name"] or r["user_name"],
            "quick_actions_list": qa,
            "start_time": r["start_time"],
            "end_time": r["end_time"],
            "break_minutes": r["break_minutes"],
        })

    proj_dict = dict(project)
    buffer = build_project_pdf(proj_dict, rep_dicts, report_images, logo_path=None)
    conn.close()

    safe_name = project["name"].replace(" ", "_")
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"Projekt_{safe_name}.pdf"
    )

@app.get("/api/reports/<report_id>/export-pdf")
@token_required
def export_report_pdf(current_user_id: str, report_id: str):
    if not require_admin(current_user_id):
        return jsonify({"error": "Keine Berechtigung"}), 403

    conn = get_db(app.config["DB_FILE"])
    report = conn.execute("""
        SELECT r.*, u.username AS user_name, u.name AS full_name, p.name AS project_name, p.address AS project_address
        FROM reports r
        JOIN users u ON u.id = r.user_id
        JOIN projects p ON p.id = r.project_id
        WHERE r.id = ?
    """, (report_id,)).fetchone()
    if not report:
        conn.close()
        return jsonify({"error": "Bericht nicht gefunden"}), 404

    imgs = conn.execute("SELECT file_path FROM report_images WHERE report_id = ?", (report_id,)).fetchall()
    image_paths = []
    for img in imgs:
        p = img["file_path"]
        full = os.path.join(BASE_DIR, p) if not os.path.isabs(p) else p
        image_paths.append(full)

    qa = []
    if report["quick_actions"]:
        try:
            qa = json.loads(report["quick_actions"])
        except Exception:
            qa = []

    report_dict = {
        "id": report["id"],
        "text": report["text"],
        "created_at": report["created_at"],
        "user_name": report["full_name"] or report["user_name"],
        "quick_actions_list": qa,
        "start_time": report["start_time"],
        "end_time": report["end_time"],
        "break_minutes": report["break_minutes"],
    }
    project_dict = {"name": report["project_name"], "address": report["project_address"]}

    buffer = build_report_pdf(project_dict, report_dict, image_paths, logo_path=None)
    conn.close()

    safe_name = report["project_name"].replace(" ", "_")
    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"Bericht_{safe_name}_{report_id}.pdf"
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
