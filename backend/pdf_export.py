import os
import io
from typing import List
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm

def build_project_pdf(project: dict, reports: List[dict], report_images: dict, logo_path: str | None = None) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Title
    story.append(Paragraph(f"<b>Projektdokumentation: {project['name']}</b>", styles["Title"]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph(f"<b>Kunde:</b> {project.get('customer_name','')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Adresse:</b> {project.get('address','')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Status:</b> {project.get('status','')}", styles["Normal"]))
    story.append(Spacer(1, 0.8 * cm))

    for rep in reports:
        story.append(Paragraph(f"<b>{rep['created_at'][:10]} - {rep.get('user_name','')}</b>", styles["Heading2"]))
        story.append(Paragraph(rep.get("text",""), styles["Normal"]))
        qa = rep.get("quick_actions_list") or []
        if qa:
            story.append(Spacer(1, 0.2 * cm))
            story.append(Paragraph(f"<i>Quick Actions:</i> {', '.join(qa)}", styles["Normal"]))
        if rep.get("start_time") or rep.get("end_time") or rep.get("break_minutes") is not None:
            start = rep.get("start_time") or "?"
            end = rep.get("end_time") or "?"
            pause = rep.get("break_minutes")
            pause_text = f"{pause} Min." if pause is not None else "?"
            story.append(Spacer(1, 0.2 * cm))
            story.append(Paragraph(f"<i>Zeiterfassung:</i> {start} - {end} (Pause {pause_text})", styles["Normal"]))

        imgs = report_images.get(rep["id"], [])
        for p in imgs:
            if os.path.exists(p):
                story.append(Spacer(1, 0.35 * cm))
                story.append(RLImage(p, width=15*cm, height=10*cm, kind="proportional"))

        story.append(Spacer(1, 0.6 * cm))
        story.append(PageBreak())

    doc.build(story)
    buffer.seek(0)
    return buffer

def build_report_pdf(project: dict, report: dict, report_images: List[str], logo_path: str | None = None) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>Baustellenbericht</b>", styles["Title"]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph(f"<b>Projekt:</b> {project.get('name','')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Adresse:</b> {project.get('address','')}", styles["Normal"]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph(f"<b>Datum:</b> {report.get('created_at','')[:10]}", styles["Normal"]))
    story.append(Paragraph(f"<b>Mitarbeiter:</b> {report.get('user_name','')}", styles["Normal"]))
    story.append(Spacer(1, 0.4 * cm))

    story.append(Paragraph("<b>Beschreibung</b>", styles["Heading2"]))
    story.append(Paragraph(report.get("text", ""), styles["Normal"]))

    qa = report.get("quick_actions_list") or []
    if qa:
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph(f"<i>Quick Actions:</i> {', '.join(qa)}", styles["Normal"]))
    if report.get("start_time") or report.get("end_time") or report.get("break_minutes") is not None:
        start = report.get("start_time") or "?"
        end = report.get("end_time") or "?"
        pause = report.get("break_minutes")
        pause_text = f"{pause} Min." if pause is not None else "?"
        story.append(Spacer(1, 0.2 * cm))
        story.append(Paragraph(f"<i>Zeiterfassung:</i> {start} - {end} (Pause {pause_text})", styles["Normal"]))

    for p in report_images:
        if os.path.exists(p):
            story.append(Spacer(1, 0.35 * cm))
            story.append(RLImage(p, width=15*cm, height=10*cm, kind="proportional"))

    doc.build(story)
    buffer.seek(0)
    return buffer
