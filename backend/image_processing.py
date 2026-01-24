import os
import uuid
import datetime
from typing import List, Tuple
from werkzeug.utils import secure_filename
from PIL import Image

def _try_import_cv2():
    try:
        import cv2
        import numpy as np
        return cv2, np
    except Exception:
        return None, None

def _compress_jpeg(path: str, quality: int = 80) -> None:
    with Image.open(path) as im:
        im = im.convert("RGB")
        im.save(path, format="JPEG", quality=quality, optimize=True)

def _scan_document_opencv(path: str) -> Tuple[bool, str | None]:
    cv2, np = _try_import_cv2()
    if cv2 is None:
        return False, "OpenCV nicht verfügbar – Scan übersprungen."

    img = cv2.imread(path)
    if img is None:
        return False, "Bild konnte nicht geladen werden – Scan übersprungen."

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return False, "Keine Kontur gefunden – Scan übersprungen."

    largest = max(contours, key=cv2.contourArea)
    area = cv2.contourArea(largest)
    h, w = img.shape[:2]
    if area < (h * w * 0.30):  # per checklist: 30% threshold
        return False, "Kontur zu klein – Scan übersprungen."

    eps = 0.02 * cv2.arcLength(largest, True)
    approx = cv2.approxPolyDP(largest, eps, True)
    if len(approx) != 4:
        return False, "Keine 4 Ecken erkannt – Scan übersprungen."

    pts = approx.reshape(4, 2).astype("float32")

    # order points
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    (tl, tr, br, bl) = rect

    widthA = ((br[0]-bl[0])**2 + (br[1]-bl[1])**2) ** 0.5
    widthB = ((tr[0]-tl[0])**2 + (tr[1]-tl[1])**2) ** 0.5
    maxW = int(max(widthA, widthB))

    heightA = ((tr[0]-br[0])**2 + (tr[1]-br[1])**2) ** 0.5
    heightB = ((tl[0]-bl[0])**2 + (tl[1]-bl[1])**2) ** 0.5
    maxH = int(max(heightA, heightB))

    dst = np.array([[0,0],[maxW-1,0],[maxW-1,maxH-1],[0,maxH-1]], dtype="float32")
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(img, M, (maxW, maxH))
    cv2.imwrite(path, warped)
    return True, None

def save_images_for_report(upload_dir: str, files, apply_scan: bool = True, max_images: int = 10) -> List[str]:
    os.makedirs(upload_dir, exist_ok=True)
    saved_paths: List[str] = []

    ts = datetime.datetime.utcnow().strftime("%Y-%m-%d_%H%M%S")
    for i, f in enumerate(files[:max_images]):
        if not f or not getattr(f, "filename", ""):
            continue
        safe = secure_filename(f.filename)
        ext = os.path.splitext(safe)[1].lower() or ".jpg"
        fname = f"{ts}_img{i}_{uuid.uuid4().hex[:6]}{ext}"
        raw_path = os.path.join(upload_dir, fname)
        f.save(raw_path)

        # Ensure jpeg + compression
        try:
            with Image.open(raw_path) as im:
                im = im.convert("RGB")
                jpeg_name = os.path.splitext(fname)[0] + "_processed.jpg"
                out_path = os.path.join(upload_dir, jpeg_name)
                im.save(out_path, format="JPEG", quality=90, optimize=True)
            # remove raw if different
            if out_path != raw_path:
                try:
                    os.remove(raw_path)
                except Exception:
                    pass
        except Exception:
            # keep raw as fallback
            out_path = raw_path

        if apply_scan:
            _scan_document_opencv(out_path)

        try:
            _compress_jpeg(out_path, quality=80)
        except Exception:
            pass

        saved_paths.append(out_path)

    return saved_paths
