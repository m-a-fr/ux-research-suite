import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Packer,
  PageBreak,
} from "docx";
import { ExploratoryProtocol, ExploratorySection, ExploratoryTheme } from "@/lib/types/exploratory";

const STYLE_LABELS: Record<string, string> = {
  semi_directive: "Entretien semi-directif",
  non_directive: "Entretien non-directif",
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  intro: "Introduction",
  warmup: "Mise en chauffe",
  exploration: "Exploration",
  deepdive: "Approfondissement",
  debrief: "Clôture",
};

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } },
    spacing: { before: 160, after: 160 },
  });
}

function sectionHeader(section: ExploratorySection): Paragraph {
  const label = SECTION_TYPE_LABELS[section.type] ?? section.type;
  return new Paragraph({
    children: [
      new TextRun({ text: `${label} — ${section.title}`, bold: true, size: 24, color: "FFFFFF" }),
      new TextRun({ text: `  (${section.duration_minutes} min)`, size: 20, color: "C7D8F0" }),
    ],
    shading: { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" },
    spacing: { before: 400, after: 0 },
    indent: { left: 120, right: 120 },
  });
}

function scriptBlock(script: string): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: "Ce que dit le chercheur", bold: true, size: 18, color: "1E3A5F" })],
      spacing: { before: 120, after: 60 },
      indent: { left: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: script, size: 20, italics: true, color: "333333" })],
      shading: { type: ShadingType.SOLID, color: "F0F4FA", fill: "F0F4FA" },
      spacing: { before: 0, after: 160 },
      indent: { left: 120, right: 120 },
    }),
  ];
}

function themeBlock(theme: ExploratoryTheme, idx: number): Paragraph[] {
  const paras: Paragraph[] = [];

  // Theme header line
  paras.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Thème ${idx + 1} — `, bold: true, size: 20, color: "3B82F6" }),
        new TextRun({ text: theme.theme, bold: true, size: 20, color: "1E3A5F" }),
        ...(theme.sensitive
          ? [new TextRun({ text: "  ⚠ Sensible", size: 18, color: "B45309", bold: true })]
          : []),
      ],
      spacing: { before: 200, after: 80 },
      indent: { left: 120 },
    })
  );

  // Opening question
  paras.push(
    new Paragraph({
      children: [new TextRun({ text: "Question d'ouverture", bold: true, size: 18, color: "555555" })],
      spacing: { before: 60, after: 40 },
      indent: { left: 200 },
    })
  );
  paras.push(
    new Paragraph({
      children: [new TextRun({ text: theme.opening_question, size: 22, bold: true, color: "111111" })],
      spacing: { before: 0, after: 120 },
      indent: { left: 200 },
    })
  );

  // Probes
  if (theme.probes.length > 0) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Si le participant n'élabore pas :", bold: true, size: 18, color: "666666", italics: true }),
        ],
        spacing: { before: 40, after: 40 },
        indent: { left: 200 },
      })
    );
    theme.probes.forEach((probe) => {
      paras.push(
        new Paragraph({
          children: [
            new TextRun({ text: "→ ", size: 18, color: "3B82F6" }),
            new TextRun({ text: probe, size: 18, color: "444444" }),
          ],
          indent: { left: 360 },
          spacing: { after: 40 },
        })
      );
    });
  }

  return paras;
}

function transitionNote(note: string): Paragraph[] {
  if (!note) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({ text: "Transition : ", bold: true, size: 18, color: "B45309" }),
        new TextRun({ text: note, size: 18, color: "B45309", italics: true }),
      ],
      shading: { type: ShadingType.SOLID, color: "FFFBEB", fill: "FFFBEB" },
      spacing: { before: 120, after: 200 },
      indent: { left: 120, right: 120 },
    }),
  ];
}

export async function generateExploratoryDocx(protocol: ExploratoryProtocol): Promise<Buffer> {
  const styleLabel = STYLE_LABELS[protocol.interview_style] ?? protocol.interview_style;
  const date = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const children: Paragraph[] = [];

  // ── Couverture ─────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: protocol.title, bold: true, size: 56, color: "1E3A5F" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: styleLabel, size: 28, color: "3B82F6" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${protocol.duration_minutes} min`, size: 22, color: "555555" }),
        new TextRun({ text: "   ·   ", size: 22, color: "CCCCCC" }),
        new TextRun({ text: date, size: 22, color: "555555" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ── Sections ───────────────────────────────────────────────────────────
  for (const section of protocol.sections) {
    children.push(sectionHeader(section));
    children.push(new Paragraph({ text: "", spacing: { after: 60 } }));

    if (section.script) {
      scriptBlock(section.script).forEach((p) => children.push(p));
    }

    if (section.themes?.length > 0) {
      section.themes.forEach((theme, idx) => {
        themeBlock(theme, idx).forEach((p) => children.push(p));
      });
    }

    if (section.transition_note) {
      transitionNote(section.transition_note).forEach((p) => children.push(p));
    }

    children.push(divider());
  }

  // ── Guide observateur ──────────────────────────────────────────────────
  if (protocol.observer_guide) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Guide observateur", bold: true, size: 32, color: "1E3A5F" })],
        spacing: { before: 400, after: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: protocol.observer_guide, size: 22 })],
        spacing: { after: 160 },
      }),
      divider()
    );
  }

  // ── Consentement ────────────────────────────────────────────────────────
  if (protocol.consent_note) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Note de consentement", bold: true, size: 32, color: "1E3A5F" })],
        spacing: { before: 400, after: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: protocol.consent_note, size: 22 })],
        spacing: { after: 160 },
      }),
      divider()
    );
  }

  // ── Matériels ──────────────────────────────────────────────────────────
  if (protocol.materials_needed?.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Matériels nécessaires", bold: true, size: 32, color: "1E3A5F" })],
        spacing: { before: 400, after: 160 },
      })
    );
    protocol.materials_needed.forEach((m) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${m}`, size: 22 })],
          indent: { left: 360 },
          spacing: { after: 80 },
        })
      );
    });
  }

  const doc = new Document({
    styles: {
      paragraphStyles: [
        { id: "Normal", name: "Normal", run: { font: "Calibri", size: 22 } },
      ],
    },
    sections: [{ children }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
