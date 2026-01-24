import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_me")

    DB_FILE = os.getenv("DB_FILE", "baustelle.db")
    UPLOAD_ROOT = os.getenv("UPLOAD_ROOT", "uploads")
    MAX_CONTENT_LENGTH = int(os.getenv("MAX_CONTENT_LENGTH", str(30 * 1024 * 1024)))  # 30MB

    # Dev helper: SOLO_MODE allows admin access WITHOUT token, but ONLY from localhost.
    SOLO_MODE = os.getenv("SOLO_MODE", "0") == "1"
    SOLO_LOCAL_ONLY = os.getenv("SOLO_LOCAL_ONLY", "1") == "1"

    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
