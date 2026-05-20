#!/usr/bin/env python3
"""Genera PDF con transacciones ordenadas del 20 de enero al 17 de abril."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

# Transacciones ordenadas de la mas antigua (20 enero) a la mas reciente (17 abril)
transactions = [
    ("20 de enero",   "TRADEA SOLUTIONS, SLU",             "1.652,83",  "Ingreso"),
    ("21 de enero",   "BLAST ANGELS EUROPE",               "25.660,80", "Ingreso"),
    ("24 de enero",   "Creator Founder, LLC",              "9.427,81",  "Ingreso"),
    ("2 de febrero",  "BLAST ANGELS EUROPE",               "8.553,60",  "Ingreso"),
    ("2 de febrero",  "Google One (Reembolsado)",          "1,93",      "Reembolso"),
    ("20 de febrero", "TRADEA SOLUTIONS, SLU",             "27.489,79", "Ingreso"),
    ("21 de febrero", "RICARDO RUGEL COBENA",              "100,00",    "Ingreso"),
    ("22 de febrero", "Creator Founder, LLC",              "10.199,65", "Ingreso"),
    ("26 de febrero", "Marco Antonio Pereira Valbuena",    "69,25",     "Ingreso"),
    ("3 de marzo",    "RUGEL COBENA RICARDO",              "2.890,00",  "Ingreso"),
    ("3 de marzo",    "Marco Antonio Pereira Valbuena",    "69,31",     "Ingreso"),
    ("3 de marzo",    "De USD (transferencia propia)",     "1.162,42",  "Transferencia"),
    ("4 de marzo",    "Juan Antonio Moreno Cabrera",       "672,00",    "Ingreso"),
    ("4 de marzo",    "Sayel LLC",                         "1.397,61",  "Ingreso"),
    ("5 de marzo",    "BLAST ANGELS EUROPE",               "10.589,19", "Ingreso"),
    ("9 de marzo",    "THOR GROUP AL FZCO",                "4.860,16",  "Ingreso"),
    ("9 de marzo",    "Sayel LLC",                         "1.997,61",  "Ingreso"),
    ("10 de marzo",   "JUAN ANTONIO MORENO CABRERA",       "2.790,00",  "Ingreso"),
    ("11 de marzo",   "De Capital Hub (transferencia propia)", "597,58", "Transferencia"),
    ("13 de marzo",   "De Growth (transferencia propia)",  "6.000,00",  "Transferencia"),
    ("19 de marzo",   "De Wealth (transferencia propia)",  "4.000,00",  "Transferencia"),
    ("19 de marzo",   "De Entrance Fees (transferencia propia)", "4.600,00", "Transferencia"),
    ("25 de marzo",   "Creator Founder, LLC",              "16.531,99", "Ingreso"),
    ("31 de marzo",   "Samuel Vilanova",                   "2.000,00",  "Ingreso"),
    ("1 de abril",    "IA CONSULTING LLC",                 "3.600,00",  "Ingreso"),
    ("6 de abril",    "ETHOS Media, LLC",                  "900,00",    "Ingreso"),
    ("6 de abril",    "ETHOS Media, LLC",                  "225,00",    "Ingreso"),
    ("7 de abril",    "COSTA BLANCA LUXURY INVESTMEN",     "2.000,00",  "Ingreso"),
    ("16 de abril",   "BLAST ANGELS EUROPE",               "7.531,20",  "Ingreso"),
    ("17 de abril",   "VICENT COSTA FEBRER",               "20,00",     "Ingreso"),
]


def parse_amount(s: str) -> float:
    return float(s.replace(".", "").replace(",", "."))


def main():
    output = "/Users/adrian/Desktop/Adrian-Codes/Capital Hub/Transacciones_20ene_17abr.pdf"

    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="Transacciones 20 enero - 17 abril",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#0B2818"),
    )
    subtitle_style = ParagraphStyle(
        "subtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.HexColor("#666666"),
    )
    total_style = ParagraphStyle(
        "total",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#0B2818"),
    )

    story = []
    story.append(Paragraph("Listado de transacciones", title_style))
    story.append(Paragraph(
        "Periodo: 20 de enero &rarr; 17 de abril &middot; Orden cronol&oacute;gico ascendente",
        subtitle_style
    ))
    story.append(Spacer(1, 0.6 * cm))

    header = ["Fecha", "Concepto", "Tipo", "Importe (EUR)"]
    data = [header]
    total_ingresos = 0.0
    total_transferencias = 0.0
    total_reembolsos = 0.0

    for fecha, concepto, importe, tipo in transactions:
        data.append([fecha, concepto, tipo, f"+ {importe}"])
        val = parse_amount(importe)
        if tipo == "Ingreso":
            total_ingresos += val
        elif tipo == "Transferencia":
            total_transferencias += val
        elif tipo == "Reembolso":
            total_reembolsos += val

    table = Table(
        data,
        colWidths=[3.2 * cm, 7.8 * cm, 2.8 * cm, 3.2 * cm],
        repeatRows=1,
    )
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B2818")),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",   (0, 0), (-1, 0), 10),
        ("ALIGN",      (3, 0), (3, -1), "RIGHT"),
        ("ALIGN",      (0, 0), (2, -1), "LEFT"),
        ("FONTNAME",   (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",   (0, 1), (-1, -1), 9),
        ("TEXTCOLOR",  (3, 1), (3, -1), colors.HexColor("#1B5E20")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#CCCCCC")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    story.append(table)
    story.append(Spacer(1, 0.8 * cm))

    def fmt(n: float) -> str:
        s = f"{n:,.2f}"
        return s.replace(",", "X").replace(".", ",").replace("X", ".")

    total_general = total_ingresos + total_transferencias + total_reembolsos

    resumen_data = [
        ["Resumen", ""],
        ["Total ingresos externos",   f"{fmt(total_ingresos)} EUR"],
        ["Total transferencias propias", f"{fmt(total_transferencias)} EUR"],
        ["Total reembolsos",          f"{fmt(total_reembolsos)} EUR"],
        ["Total general",             f"{fmt(total_general)} EUR"],
        ["Nº de movimientos",         str(len(transactions))],
    ]
    resumen = Table(resumen_data, colWidths=[9 * cm, 5 * cm])
    resumen.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0B2818")),
        ("TEXTCOLOR",  (0, 0), (-1, 0), colors.whitesmoke),
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("SPAN",       (0, 0), (-1, 0)),
        ("ALIGN",      (0, 0), (-1, 0), "LEFT"),
        ("FONTNAME",   (0, 1), (0, -1), "Helvetica"),
        ("FONTNAME",   (1, 1), (1, -1), "Helvetica-Bold"),
        ("FONTNAME",   (0, -1), (-1, -1), "Helvetica-Bold"),
        ("ALIGN",      (1, 1), (1, -1), "RIGHT"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#E8F5E9")),
        ("GRID",       (0, 0), (-1, -1), 0.25, colors.HexColor("#CCCCCC")),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(resumen)

    doc.build(story)
    print(f"PDF generado: {output}")


if __name__ == "__main__":
    main()
