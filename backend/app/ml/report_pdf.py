"""
Generate a concise PDF report of insights (ReportLab).
"""

from __future__ import annotations

import io
from typing import Any, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


def build_pdf_bytes(
    title: str,
    insights: list[dict[str, Any]],
    metrics: Optional[list[dict[str, Any]]] = None,
    data_notes: Optional[list[str]] = None,
) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=48,
        leftMargin=48,
        topMargin=48,
        bottomMargin=48,
    )
    styles = getSampleStyleSheet()
    story: list[Any] = []

    story.append(Paragraph(title, styles["Title"]))
    story.append(Spacer(1, 0.2 * inch))
    story.append(
        Paragraph(
            "This report summarizes automated analysis of the uploaded "
            "housing dataset, including data quality notes, model metrics, "
            "and business-facing observations.",
            styles["BodyText"],
        )
    )
    story.append(Spacer(1, 0.15 * inch))

    if data_notes:
        story.append(Paragraph("Data preparation notes", styles["Heading2"]))
        for note in data_notes[:30]:
            story.append(Paragraph(f"• {note}", styles["BodyText"]))
        story.append(Spacer(1, 0.15 * inch))

    if metrics:
        story.append(Paragraph("Model evaluation", styles["Heading2"]))
        data = [["Model", "R²", "MAE", "RMSE"]]
        for m in metrics:
            data.append(
                [
                    m.get("name", ""),
                    f"{m.get('r2', 0):.4f}",
                    f"{m.get('mae', 0):.2f}",
                    f"{m.get('rmse', 0):.2f}",
                ]
            )
        t = Table(data, colWidths=[2.2 * inch, 1 * inch, 1.2 * inch, 1.2 * inch])
        t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e3a5f")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.grey),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f7fa")]),
                ]
            )
        )
        story.append(t)
        story.append(Spacer(1, 0.2 * inch))

    story.append(Paragraph("Insights", styles["Heading2"]))
    for ins in insights:
        story.append(
            Paragraph(f"<b>{ins.get('title', '')}</b>", styles["Heading3"])
        )
        story.append(Paragraph(ins.get("summary", ""), styles["BodyText"]))
        cref = ins.get("chart_ref")
        if cref:
            story.append(
                Paragraph(
                    f"<i>Related visualization: {cref}</i>",
                    styles["BodyText"],
                )
            )
        story.append(Spacer(1, 0.1 * inch))

    doc.build(story)
    return buf.getvalue()
