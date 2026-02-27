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
import { ModeratedProtocol, ModeratedSection, ModeratedTask } from "@/lib/types/moderated";

const SECTION_TYPE_LABELS: Record<string, string> = {
  intro: "Introduction",
  warmup: "Mise en chauffe",
  tasks: "Tâches",
  debrief: "Debrief",
};

const PLATFORM_LABELS: Record<string, string> = {
  web: "Web",
  mobile: "Mobile",
  desktop: "Desktop",
};

const FIDELITY_LABELS: Record<string, string> = {
  live_product: "Produit live",
  prototype_hifi: "Prototype hi-fi",
  prototype_lowfi: "Prototype lo-fi",
};

const THINK_ALOUD_LABELS: Record<string, string> = {
  concurrent: "Think-aloud concurrent",
  retrospective: "Think-aloud rétrospectif",
  none: "Sans think-aloud",
};

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } },
    spacing: { before: 160, after: 160 },
  });
}

function sectionHeader(section: ModeratedSection): Paragraph {
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
      children: [new TextRun({ text: "Ce que dit le modérateur", bold: true, size: 18, color: "1E3A5F" })],
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

function questionsBlock(questions: string[]): Paragraph[] {
  if (questions.length === 0) return [];
  const paras: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: "Questions", bold: true, size: 18, color: "1E3A5F" })],
      spacing: { before: 100, after: 60 },
      indent: { left: 120 },
    }),
  ];
  questions.forEach((q, i) => {
    paras.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 20, color: "555555" }),
          new TextRun({ text: q, size: 20, color: "222222" }),
        ],
        indent: { left: 200 },
        spacing: { after: 80 },
      })
    );
  });
  return paras;
}

function tipsBlock(tips: string): Paragraph[] {
  if (!tips) return [];
  return [
    new Paragraph({
      children: [
        new TextRun({ text: "Conseil : ", bold: true, size: 18, color: "B45309" }),
        new TextRun({ text: tips, size: 18, color: "B45309", italics: true }),
      ],
      shading: { type: ShadingType.SOLID, color: "FFFBEB", fill: "FFFBEB" },
      spacing: { before: 100, after: 160 },
      indent: { left: 120, right: 120 },
    }),
  ];
}

function taskBlock(task: ModeratedTask): Paragraph[] {
  const paras: Paragraph[] = [];

  // Task header
  paras.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Tâche ${task.task_number} — `, bold: true, size: 24, color: "3B82F6" }),
        new TextRun({ text: task.task, bold: true, size: 24, color: "1E3A5F" }),
        new TextRun({ text: `  ⏱ ${task.time_limit_minutes} min max`, size: 18, color: "888888" }),
      ],
      spacing: { before: 400, after: 80 },
      indent: { left: 120 },
    })
  );

  // Scenario
  paras.push(
    new Paragraph({
      children: [new TextRun({ text: "Scénario (lu au participant)", bold: true, size: 18, color: "555555" })],
      spacing: { before: 60, after: 40 },
      indent: { left: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: task.scenario, size: 20, italics: true, color: "333333" })],
      shading: { type: ShadingType.SOLID, color: "F0F4FA", fill: "F0F4FA" },
      spacing: { before: 0, after: 120 },
      indent: { left: 120, right: 120 },
    })
  );

  // Success criteria
  paras.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Critère de succès : ", bold: true, size: 18, color: "1E3A5F" }),
        new TextRun({ text: task.success_criteria, size: 18, color: "222222" }),
      ],
      spacing: { before: 60, after: 100 },
      indent: { left: 120 },
    })
  );

  // Observer cues
  if (task.observer_cues.length > 0) {
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: "Signaux comportementaux à observer", bold: true, size: 18, color: "1E3A5F" })],
        spacing: { before: 80, after: 40 },
        indent: { left: 120 },
      })
    );
    task.observer_cues.forEach((cue) => {
      paras.push(
        new Paragraph({
          children: [
            new TextRun({ text: "● ", size: 18, color: "3B82F6" }),
            new TextRun({ text: cue, size: 18, color: "444444" }),
          ],
          indent: { left: 240 },
          spacing: { after: 40 },
        })
      );
    });
  }

  // Post-task questions
  if (task.post_task_questions.length > 0) {
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: "Questions post-tâche", bold: true, size: 18, color: "1E3A5F" })],
        spacing: { before: 120, after: 40 },
        indent: { left: 120 },
      })
    );
    task.post_task_questions.forEach((q, i) => {
      paras.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 18, color: "555555" }),
            new TextRun({ text: q, size: 18, color: "222222" }),
          ],
          indent: { left: 240 },
          spacing: { after: 60 },
        })
      );
    });
  }

  // Probe questions
  if (task.probe_questions.length > 0) {
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: "Questions conditionnelles (probes)", bold: true, size: 18, color: "B45309" })],
        spacing: { before: 120, after: 40 },
        indent: { left: 120 },
      })
    );
    task.probe_questions.forEach((probe) => {
      paras.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Si : ", bold: true, size: 17, color: "B45309", italics: true }),
            new TextRun({ text: probe.condition, size: 17, color: "B45309", italics: true }),
          ],
          shading: { type: ShadingType.SOLID, color: "FFFBEB", fill: "FFFBEB" },
          indent: { left: 240, right: 120 },
          spacing: { before: 60, after: 0 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "→ ", bold: true, size: 18, color: "1E3A5F" }),
            new TextRun({ text: probe.question, size: 18, color: "222222" }),
          ],
          shading: { type: ShadingType.SOLID, color: "FFFBEB", fill: "FFFBEB" },
          indent: { left: 240, right: 120 },
          spacing: { before: 0, after: 80 },
        })
      );
    });
  }

  return paras;
}

export async function generateModeratedDocx(protocol: ModeratedProtocol): Promise<Buffer> {
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
      spacing: { before: 1200, after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Test d'utilisabilité modéré — ${protocol.product_name}`, size: 28, color: "3B82F6" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: PLATFORM_LABELS[protocol.platform] ?? protocol.platform, size: 20, color: "555555" }),
        new TextRun({ text: "   ·   ", size: 20, color: "CCCCCC" }),
        new TextRun({ text: FIDELITY_LABELS[protocol.fidelity] ?? protocol.fidelity, size: 20, color: "555555" }),
        new TextRun({ text: "   ·   ", size: 20, color: "CCCCCC" }),
        new TextRun({ text: THINK_ALOUD_LABELS[protocol.think_aloud] ?? protocol.think_aloud, size: 20, color: "555555" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${protocol.duration_minutes} min`, size: 20, color: "555555" }),
        new TextRun({ text: "   ·   ", size: 20, color: "CCCCCC" }),
        new TextRun({ text: date, size: 20, color: "555555" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ── Sections du protocole ──────────────────────────────────────────────
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Protocole de session", bold: true, size: 32, color: "1E3A5F" })],
      spacing: { before: 200, after: 160 },
    })
  );

  for (const section of protocol.sections) {
    children.push(sectionHeader(section));
    children.push(new Paragraph({ text: "", spacing: { after: 60 } }));

    if (section.script) {
      scriptBlock(section.script).forEach((p) => children.push(p));
    }

    if (section.questions.length > 0) {
      questionsBlock(section.questions).forEach((p) => children.push(p));
    }

    if (section.tips) {
      tipsBlock(section.tips).forEach((p) => children.push(p));
    }

    children.push(divider());
  }

  // ── Tâches ─────────────────────────────────────────────────────────────
  if (protocol.tasks.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Tâches utilisateur", bold: true, size: 32, color: "1E3A5F" })],
        spacing: { before: 400, after: 80 },
      })
    );
    protocol.tasks.forEach((task) => {
      taskBlock(task).forEach((p) => children.push(p));
      children.push(divider());
    });
  }

  // ── Guide observateur ──────────────────────────────────────────────────
  if (protocol.observer_guide) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Guide observateur / note-taker", bold: true, size: 32, color: "1E3A5F" })],
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
