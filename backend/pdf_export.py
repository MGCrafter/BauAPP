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
