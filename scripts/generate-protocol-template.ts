/**
 * One-shot script to generate the docxtemplater protocol template.
 * Run with: npx tsx scripts/generate-protocol-template.ts
 * Output: lib/templates/protocol-template.docx
 */

import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
  ShadingType,
  Packer,
  PageBreak,
  BorderStyle,
} from "docx";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Helper: dark blue shaded paragraph (section header)
// ---------------------------------------------------------------------------
function sectionHeader(tagContent: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: tagContent,
        bold: true,
        size: 24,
        color: "FFFFFF",
      }),
    ],
    shading: { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" },
    spacing: { before: 400, after: 0 },
    indent: { left: 120, right: 120 },
  });
}

function smallGap(): Paragraph {
  return new Paragraph({ text: "", spacing: { after: 80 } });
}

function labelRun(label: string): TextRun {
  return new TextRun({ text: label, bold: true, size: 20, color: "1E3A5F" });
}

function valueRun(tag: string): TextRun {
  return new TextRun({ text: tag, size: 20 });
}

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" } },
    spacing: { before: 80, after: 80 },
  });
}

// ---------------------------------------------------------------------------
// Build document
// ---------------------------------------------------------------------------
async function buildTemplate(): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // ── Cover page ──────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "{title}", bold: true, size: 56, color: "1E3A5F" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 300 },
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "{study_type_label}", size: 28, color: "3B82F6" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "{duration_minutes} min", size: 22, color: "555555" }),
        new TextRun({ text: "   ·   ", size: 22, color: "CCCCCC" }),
        new TextRun({ text: "{date}", size: 22, color: "555555" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    })
  );

  // Page break after cover
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  // ── Sections loop ────────────────────────────────────────────────────────
  // Opening loop tag — must be alone in its paragraph (paragraphLoop)
  children.push(new Paragraph({ children: [new TextRun({ text: "{#sections}" })] }));

  // Section header with type label + title + duration
  children.push(
    sectionHeader("{section_type_label} — {title}  ({duration_minutes} min)")
  );

  // Script
  children.push(smallGap());
  children.push(
    new Paragraph({
      children: [labelRun("Script"), new TextRun({ text: " :", size: 20, bold: true, color: "1E3A5F" })],
      spacing: { before: 160, after: 60 },
      indent: { left: 120 },
    })
  );
  children.push(
    new Paragraph({
      children: [valueRun("{script}")],
      spacing: { after: 160 },
      indent: { left: 120 },
    })
  );

  // Questions (conditional)
  children.push(new Paragraph({ children: [new TextRun({ text: "{#has_questions}" })] }));
  children.push(
    new Paragraph({
      children: [labelRun("Questions")],
      spacing: { before: 120, after: 60 },
      indent: { left: 120 },
    })
  );

  // Questions inner loop
  children.push(new Paragraph({ children: [new TextRun({ text: "{#questions}" })] }));
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "{q_index}. ", bold: true, size: 20 }),
        new TextRun({ text: "{text}", size: 20 }),
      ],
      spacing: { before: 80, after: 40 },
      indent: { left: 200 },
    })
  );

  // Modality (conditional)
  children.push(new Paragraph({ children: [new TextRun({ text: "{#has_modality}" })] }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "↳ {modality}", size: 18, italics: true, color: "888888" })],
      indent: { left: 400 },
      spacing: { after: 20 },
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "{/has_modality}" })] }));

  // Options inner-inner loop
  children.push(new Paragraph({ children: [new TextRun({ text: "{#options}" })] }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "{option_letter}.  {text}", size: 20, color: "444444" })],
      indent: { left: 560 },
      spacing: { after: 20 },
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "{/options}" })] }));

  children.push(new Paragraph({ children: [new TextRun({ text: "{/questions}" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{/has_questions}" })] }));

  // Tips (conditional, amber)
  children.push(new Paragraph({ children: [new TextRun({ text: "{#has_tips}" })] }));
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Conseil modérateur : ", bold: true, size: 20, color: "B45309" }),
        new TextRun({ text: "{tips}", size: 20, color: "B45309", italics: true }),
      ],
      shading: { type: ShadingType.SOLID, color: "FFFBEB", fill: "FFFBEB" },
      spacing: { before: 80, after: 160 },
      indent: { left: 120, right: 120 },
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "{/has_tips}" })] }));

  children.push(divider());

  // Close sections loop
  children.push(new Paragraph({ children: [new TextRun({ text: "{/sections}" })] }));

  // ── Tasks table (conditional) ─────────────────────────────────────────
  children.push(new Paragraph({ children: [new TextRun({ text: "{#has_tasks}" })] }));

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Tâches", bold: true, size: 32, color: "1E3A5F" })],
      spacing: { before: 400, after: 200 },
    })
  );

  // Table: static header row + template loop row
  const tasksTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Header row (static)
      new TableRow({
        tableHeader: true,
        children: ["#", "Tâche", "Scénario", "Critère de succès"].map(
          (text) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF" })],
                }),
              ],
              shading: { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" },
              verticalAlign: VerticalAlign.CENTER,
            })
        ),
      }),
      // Template loop row
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: "{#tasks}" })] }),
              new Paragraph({ children: [new TextRun({ text: "{task_index}", size: 20 })] }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "{task}", size: 20 })] })],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "{scenario}", size: 20 })] })],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: "{success_criteria}", size: 20 })] }),
              new Paragraph({ children: [new TextRun({ text: "{/tasks}" })] }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
    ],
  });

  children.push(tasksTable);
  children.push(new Paragraph({ children: [new TextRun({ text: "{/has_tasks}" })] }));

  // ── Observer guide (conditional) ────────────────────────────────────────
  children.push(new Paragraph({ children: [new TextRun({ text: "{#has_observer_guide}" })] }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Guide observateur", bold: true, size: 32, color: "1E3A5F" })],
      spacing: { before: 400, after: 200 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "{observer_guide}", size: 22 })],
      spacing: { after: 160 },
    })
  );
  children.push(divider());
  children.push(new Paragraph({ children: [new TextRun({ text: "{/has_observer_guide}" })] }));

  // ── Consent note (conditional) ──────────────────────────────────────────
  children.push(new Paragraph({ children: [new TextRun({ text: "{#has_consent_note}" })] }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Note de consentement", bold: true, size: 32, color: "1E3A5F" })],
      spacing: { before: 400, after: 200 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "{consent_note}", size: 22 })],
      spacing: { after: 160 },
    })
  );
  children.push(divider());
  children.push(new Paragraph({ children: [new TextRun({ text: "{/has_consent_note}" })] }));

  // ── Materials (conditional) ─────────────────────────────────────────────
  children.push(new Paragraph({ children: [new TextRun({ text: "{#has_materials}" })] }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Matériels nécessaires", bold: true, size: 32, color: "1E3A5F" })],
      spacing: { before: 400, after: 200 },
    })
  );
  // Materials loop
  children.push(new Paragraph({ children: [new TextRun({ text: "{#materials_needed}" })] }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "• {text}", size: 22 })],
      indent: { left: 360 },
      spacing: { after: 80 },
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "{/materials_needed}" })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "{/has_materials}" })] }));

  // ── Build & write ────────────────────────────────────────────────────────
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: "Normal",
          name: "Normal",
          run: { font: "Calibri", size: 22 },
        },
      ],
    },
    sections: [{ children: children as Paragraph[] }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(process.cwd(), "lib", "templates", "protocol-template.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Template written to ${outPath}`);
}

buildTemplate().catch((err) => {
  console.error("Error generating template:", err);
  process.exit(1);
});
