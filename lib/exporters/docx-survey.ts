import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  Packer,
  PageBreak,
} from "docx";
import { Survey, SurveyBlock, SurveyQuestion } from "@/lib/types/survey";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  screening: "Screening",
  intro: "Introduction",
  demographics: "Données démographiques",
  thematic: "Questions thématiques",
  standard_scale: "Échelle normée",
  closing: "Clôture",
};

const BLOCK_COLORS: Record<string, string> = {
  screening: "991B1B",
  intro: "1D4ED8",
  demographics: "475569",
  thematic: "6D28D9",
  standard_scale: "3730A3",
  closing: "166534",
};

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" } },
    spacing: { before: 120, after: 120 },
  });
}

function blockHeader(block: SurveyBlock): Paragraph {
  const label = BLOCK_TYPE_LABELS[block.type] ?? block.type;
  const color = BLOCK_COLORS[block.type] ?? "1E3A5F";
  const scaleNote = block.standard_scale_name ? `  [${block.standard_scale_name}]` : "";

  return new Paragraph({
    children: [
      new TextRun({ text: `${label} — ${block.title}${scaleNote}`, bold: true, size: 22, color: "FFFFFF" }),
    ],
    shading: { type: ShadingType.SOLID, color, fill: color },
    spacing: { before: 400, after: 0 },
    indent: { left: 120, right: 120 },
  });
}

function blockDescription(desc: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: desc, size: 18, italics: true, color: "555555" })],
    shading: { type: ShadingType.SOLID, color: "F8FAFC", fill: "F8FAFC" },
    spacing: { before: 0, after: 160 },
    indent: { left: 120, right: 120 },
  });
}

function questionHeader(q: SurveyQuestion, num: number): Paragraph {
  const requiredMark = q.required ? " *" : "";
  const screeningTag = q.is_screening ? "  [SCREENING]" : "";

  return new Paragraph({
    children: [
      new TextRun({ text: `${q.id ?? `Q${num}`}.`, bold: true, size: 22, color: "1E3A5F" }),
      new TextRun({ text: `  ${q.text}${requiredMark}`, bold: true, size: 22 }),
      ...(screeningTag
        ? [new TextRun({ text: screeningTag, bold: true, size: 18, color: "991B1B" })]
        : []),
    ],
    spacing: { before: 240, after: 80 },
    indent: { left: 120 },
  });
}

function mcqOption(text: string, multiple: boolean): Paragraph {
  const marker = multiple ? "□" : "○";
  return new Paragraph({
    children: [new TextRun({ text: `${marker}  ${text}`, size: 20, color: "333333" })],
    indent: { left: 360 },
    spacing: { after: 40 },
  });
}

function scaleTable(scaleMin: number, scaleMax: number, labelMin: string, labelMax: string): Table {
  const points = Array.from({ length: scaleMax - scaleMin + 1 }, (_, i) => scaleMin + i);

  const pct = Math.floor(100 / points.length);

  const numRow = new TableRow({
    children: points.map((n) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: String(n), size: 18, bold: true, color: "1E3A5F" })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: pct, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
      })
    ),
  });

  const circleRow = new TableRow({
    children: points.map(() =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: "○", size: 24, color: "888888" })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        width: { size: pct, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
      })
    ),
  });

  const table = new Table({
    rows: [numRow, circleRow],
    width: { size: 70, type: WidthType.PERCENTAGE },
  });

  return table;
}

function scaleLabelsRow(labelMin: string, labelMax: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: labelMin, size: 16, italics: true, color: "666666" }),
      new TextRun({ text: "   ·····   ", size: 16, color: "CCCCCC" }),
      new TextRun({ text: labelMax, size: 16, italics: true, color: "666666" }),
    ],
    spacing: { before: 40, after: 120 },
    indent: { left: 120 },
  });
}

function npsRow(): Table {
  const points = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return new Table({
    rows: [
      new TableRow({
        children: points.map((n) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: String(n), size: 18, bold: true, color: "1E3A5F" })],
                alignment: AlignmentType.CENTER,
              }),
            ],
            width: { size: 9, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: n <= 6 ? "FEF2F2" : n <= 8 ? "FFFBEB" : "F0FDF4", fill: n <= 6 ? "FEF2F2" : n <= 8 ? "FFFBEB" : "F0FDF4" },
            verticalAlign: VerticalAlign.CENTER,
          })
        ),
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function openShortLines(): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: "____________________________________________", size: 20, color: "CCCCCC" })],
      indent: { left: 120 },
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "____________________________________________", size: 20, color: "CCCCCC" })],
      indent: { left: 120 },
      spacing: { after: 120 },
    }),
  ];
}

function matrixTable(q: SurveyQuestion): Table {
  const min = q.scale_min ?? 1;
  const max = q.scale_max ?? 5;
  const cols = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const rows = q.matrix_rows ?? [];

  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ text: "" })],
        width: { size: 35, type: WidthType.PERCENTAGE },
      }),
      ...cols.map((n) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: String(n), bold: true, size: 18, color: "1E3A5F" })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { type: ShadingType.SOLID, color: "F0F4FA", fill: "F0F4FA" },
          width: { size: Math.floor(65 / cols.length), type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
        })
      ),
    ],
  });

  const dataRows = rows.map(
    (label, ri) =>
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, size: 18 })],
              }),
            ],
            shading: ri % 2 === 0 ? { type: ShadingType.SOLID, color: "F8FAFC", fill: "F8FAFC" } : undefined,
          }),
          ...cols.map(() =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "○", size: 20, color: "999999" })],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              shading: ri % 2 === 0 ? { type: ShadingType.SOLID, color: "F8FAFC", fill: "F8FAFC" } : undefined,
              verticalAlign: VerticalAlign.CENTER,
            })
          ),
        ],
      })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function rankingOption(text: string, num: number): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `[${num}]  ${text}`, size: 20, color: "333333" }),
    ],
    indent: { left: 360 },
    spacing: { after: 40 },
  });
}

function csatStars(): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: "★   ★   ★   ★   ★", size: 32, color: "D1D5DB" })],
    indent: { left: 120 },
    spacing: { after: 120 },
  });
}

function sliderLine(min: number, max: number): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: String(min), size: 18, color: "666666" }),
      new TextRun({ text: "  |————————————————|  ", size: 18, color: "AAAAAA" }),
      new TextRun({ text: String(max), size: 18, color: "666666" }),
    ],
    indent: { left: 120 },
    spacing: { after: 120 },
  });
}

function analysisNote(note: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: "Note d'analyse : ", bold: true, size: 16, color: "6B7280", italics: true }),
      new TextRun({ text: note, size: 16, color: "6B7280", italics: true }),
    ],
    shading: { type: ShadingType.SOLID, color: "F9FAFB", fill: "F9FAFB" },
    spacing: { before: 60, after: 100 },
    indent: { left: 200 },
  });
}

function skipLogicNote(logic: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: "↳ ", size: 16, color: "3B82F6" }),
      new TextRun({ text: logic, size: 16, color: "3B82F6", italics: true }),
    ],
    indent: { left: 200 },
    spacing: { after: 80 },
  });
}

function renderQuestion(
  q: SurveyQuestion,
  num: number
): Array<Paragraph | Table> {
  const elems: Array<Paragraph | Table> = [];

  elems.push(questionHeader(q, num));

  switch (q.type) {
    case "likert": {
      const min = q.scale_min ?? 1;
      const max = q.scale_max ?? 5;
      const lMin = q.scale_labels?.min ?? "";
      const lMax = q.scale_labels?.max ?? "";
      elems.push(scaleTable(min, max, lMin, lMax) as unknown as Paragraph);
      if (lMin || lMax) elems.push(scaleLabelsRow(lMin, lMax));
      break;
    }
    case "nps":
      elems.push(npsRow() as unknown as Paragraph);
      elems.push(
        scaleLabelsRow(
          q.scale_labels?.min ?? "Pas du tout probable",
          q.scale_labels?.max ?? "Extrêmement probable"
        )
      );
      break;
    case "csat":
      elems.push(csatStars());
      break;
    case "mcq_single":
      (q.options ?? []).forEach((opt) => elems.push(mcqOption(opt, false)));
      elems.push(new Paragraph({ text: "", spacing: { after: 80 } }));
      break;
    case "mcq_multiple":
      (q.options ?? []).forEach((opt) => elems.push(mcqOption(opt, true)));
      elems.push(new Paragraph({ text: "", spacing: { after: 80 } }));
      break;
    case "ranking":
      (q.options ?? []).forEach((opt, i) => elems.push(rankingOption(opt, i + 1)));
      elems.push(new Paragraph({ text: "", spacing: { after: 80 } }));
      break;
    case "open_short":
      openShortLines().forEach((p) => elems.push(p));
      break;
    case "matrix":
      elems.push(matrixTable(q) as unknown as Paragraph);
      elems.push(new Paragraph({ text: "", spacing: { after: 80 } }));
      break;
    case "slider":
      elems.push(sliderLine(q.scale_min ?? 0, q.scale_max ?? 100));
      break;
    case "demographic":
      if (q.options?.length) {
        (q.options ?? []).forEach((opt) => elems.push(mcqOption(opt, false)));
        elems.push(new Paragraph({ text: "", spacing: { after: 80 } }));
      } else {
        openShortLines().forEach((p) => elems.push(p));
      }
      break;
  }

  if (q.skip_logic) elems.push(skipLogicNote(q.skip_logic));
  if (q.analysis_note) elems.push(analysisNote(q.analysis_note));

  return elems;
}

// ─── Main export ──────────────────────────────────────────────────────────

export async function generateSurveyDocx(survey: Survey): Promise<Buffer> {
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const CHANNEL_LABELS: Record<string, string> = {
    email: "Email",
    in_app: "In-app",
    qr_intercept: "QR code / Intercept",
    external_panel: "Panel externe",
  };

  const children: Array<Paragraph | Table> = [];

  // ── Couverture ─────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: survey.title, bold: true, size: 56, color: "1E3A5F" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 300 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Sondage · ${survey.estimated_completion_minutes} min · `, size: 24, color: "555555" }),
        new TextRun({ text: CHANNEL_LABELS[survey.distribution_channel] ?? survey.distribution_channel, size: 24, color: "3B82F6" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    }),
    new Paragraph({
      children: [new TextRun({ text: date, size: 20, color: "888888" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ── Consentement (avant les questions) ─────────────────────────────────
  if (survey.consent_note) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Consentement", bold: true, size: 28, color: "1E3A5F" })],
        spacing: { before: 200, after: 120 },
        indent: { left: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: survey.consent_note, size: 20, italics: true })],
        shading: { type: ShadingType.SOLID, color: "F0F4FA", fill: "F0F4FA" },
        spacing: { after: 200 },
        indent: { left: 120, right: 120 },
      }),
      divider()
    );
  }

  // ── Critères de screening ────────────────────────────────────────────
  if (survey.screening_criteria) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Critères de qualification : ", bold: true, size: 18, color: "991B1B" }),
          new TextRun({ text: survey.screening_criteria, size: 18, color: "991B1B" }),
        ],
        shading: { type: ShadingType.SOLID, color: "FEF2F2", fill: "FEF2F2" },
        spacing: { before: 80, after: 200 },
        indent: { left: 120, right: 120 },
      })
    );
  }

  // ── Blocs ──────────────────────────────────────────────────────────────
  let questionCounter = 0;

  for (const block of survey.blocks) {
    children.push(blockHeader(block));

    if (block.description) {
      children.push(blockDescription(block.description));
    } else {
      children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
    }

    for (const q of block.questions ?? []) {
      questionCounter++;
      const elems = renderQuestion(q, questionCounter);
      elems.forEach((el) => children.push(el));
    }

    children.push(divider());
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        { id: "Normal", name: "Normal", run: { font: "Calibri", size: 22 } },
      ],
    },
    sections: [{ children: children as Paragraph[] }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
