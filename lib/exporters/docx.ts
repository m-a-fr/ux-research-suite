import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer,
} from "docx";
import { Protocol, ProtocolSection } from "@/lib/types/protocol";

const STUDY_TYPE_LABELS: Record<string, string> = {
  moderated_usability: "Test d'utilisabilité modéré",
  exploratory_interview: "Entretien exploratoire",
  unmoderated_usability: "Test d'utilisabilité non-modéré",
  survey: "Sondage / Survey",
  diary_study: "Diary Study",
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  intro: "Introduction",
  warmup: "Mise en chauffe",
  tasks: "Tâches",
  debrief: "Debriefing",
};

function heading1(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 200 },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 400, after: 150 },
  });
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
  });
}

function body(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}

function bulletItem(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function divider(): Paragraph {
  return new Paragraph({
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
    spacing: { before: 200, after: 200 },
  });
}

function sectionBlock(section: ProtocolSection): Paragraph[] {
  const paras: Paragraph[] = [];
  const sectionLabel = SECTION_TYPE_LABELS[section.type] || section.type;

  paras.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${sectionLabel} — ${section.title}`,
          bold: true,
          size: 26,
        }),
        new TextRun({
          text: `  (${section.duration_minutes} min)`,
          size: 22,
          color: "666666",
        }),
      ],
      spacing: { before: 300, after: 120 },
    })
  );

  if (section.script) {
    paras.push(heading3("Script"));
    paras.push(body(section.script));
  }

  if (section.questions?.length) {
    paras.push(heading3("Questions"));
    section.questions.forEach((q, idx) => {
      paras.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${idx + 1}. `, bold: true, size: 22 }),
            new TextRun({ text: q.text, size: 22 }),
          ],
          spacing: { before: 80, after: 40 },
        })
      );
      if (q.modality) {
        paras.push(
          new Paragraph({
            children: [
              new TextRun({ text: `↳ ${q.modality}`, size: 18, italics: true, color: "888888" }),
            ],
            indent: { left: 360 },
            spacing: { after: q.options?.length ? 20 : 80 },
          })
        );
      }
      if (q.options?.length) {
        q.options.forEach((opt, oi) => {
          paras.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${String.fromCharCode(65 + oi)}.  ${opt}`, size: 20, color: "444444" }),
              ],
              indent: { left: 560 },
              spacing: { after: 20 },
            })
          );
        });
        paras.push(new Paragraph({ text: "", spacing: { after: 60 } }));
      }
    });
  }

  if (section.tips) {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Conseil modérateur : ", bold: true, size: 20, color: "B45309" }),
          new TextRun({ text: section.tips, size: 20, color: "B45309", italics: true }),
        ],
        spacing: { before: 80, after: 160 },
      })
    );
  }

  return paras;
}

export async function generateProtocolDocx(protocol: Protocol): Promise<Buffer> {
  const studyLabel = STUDY_TYPE_LABELS[protocol.study_type] || protocol.study_type;

  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: protocol.title, bold: true, size: 48 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Type : ${studyLabel}`, size: 22, color: "444444" }),
        new TextRun({ text: "   |   ", size: 22, color: "CCCCCC" }),
        new TextRun({ text: `Durée totale : ${protocol.duration_minutes} min`, size: 22, color: "444444" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    divider(),
    heading1("Sections du protocole"),
  ];

  protocol.sections.forEach((section) => {
    sectionBlock(section).forEach((p) => children.push(p));
    children.push(divider());
  });

  if (protocol.tasks?.length) {
    children.push(heading1("Tâches"));

    const tableRows = [
      new TableRow({
        children: ["#", "Tâche", "Scénario", "Critère de succès"].map(
          (text) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text, bold: true, size: 20 })],
                }),
              ],
              shading: { fill: "F3F4F6" },
            })
        ),
      }),
      ...protocol.tasks.map(
        (t, i) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(String(i + 1))] }),
              new TableCell({ children: [new Paragraph(t.task)] }),
              new TableCell({ children: [new Paragraph(t.scenario)] }),
              new TableCell({ children: [new Paragraph(t.success_criteria)] }),
            ],
          })
      ),
    ];

    children.push(
      new Table({
        rows: tableRows,
        width: { size: 5000, type: WidthType.PERCENTAGE },
      }) as unknown as Paragraph
    );
    children.push(divider());
  }

  if (protocol.observer_guide) {
    children.push(heading1("Guide observateur"));
    children.push(body(protocol.observer_guide));
    children.push(divider());
  }

  if (protocol.consent_note) {
    children.push(heading1("Note de consentement"));
    children.push(body(protocol.consent_note));
    children.push(divider());
  }

  if (protocol.materials_needed?.length) {
    children.push(heading1("Matériels nécessaires"));
    protocol.materials_needed.forEach((m) => children.push(bulletItem(m)));
  }

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
    sections: [
      {
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
