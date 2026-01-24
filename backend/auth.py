import datetime
import jwt
from functools import wraps
from flask import request, jsonify, current_app
from db import get_db

def _is_local_request() -> bool:
    ip = request.remote_addr or ""
    return ip in ("127.0.0.1", "::1")

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        cfg = current_app.config

        # Dev shortcut: SOLO_MODE = admin access without token, but ONLY localhost.
        if cfg.get("SOLO_MODE") and (not cfg.get("SOLO_LOCAL_ONLY") or _is_local_request()):
            # pick admin user id
            conn = get_db(cfg["DB_FILE"])
            admin = conn.execute("SELECT id FROM users WHERE role='admin' ORDER BY created_at ASC LIMIT 1").fetchone()
            conn.close()
            if admin:
                return f(admin["id"], *args, **kwargs)

        token = request.headers.get("Authorization", "")
        if not token or not token.startswith("Bearer "):
            return jsonify({"error": "Token fehlt"}), 401

        try:
            raw = token.split(" ", 1)[1].strip()
            data = jwt.decode(raw, cfg["SECRET_KEY"], algorithms=["HS256"])
            current_user_id = data["user_id"]
        except Exception:
            return jsonify({"error": "Ungültiger oder abgelaufener Token"}), 401

        return f(current_user_id, *args, **kwargs)

    return decorated

def require_admin(current_user_id: str):
    conn = get_db(current_app.config["DB_FILE"])
    row = conn.execute("SELECT role FROM users WHERE id = ?", (current_user_id,)).fetchone()
    conn.close()
    return row and row["role"] == "admin"
