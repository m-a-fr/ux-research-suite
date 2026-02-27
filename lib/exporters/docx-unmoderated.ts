import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Packer,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  VerticalAlign,
} from "docx";
import {
  UnmoderatedProtocol,
  MonadicProtocol,
  ABProtocol,
  BenchmarkProtocol,
  UnmoderatedTask,
  UnmoderatedPostTaskQuestion,
  AutomatedMetric,
} from "@/lib/types/unmoderated";

// ─── Labels ────────────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, string> = { web: "Web", mobile: "Mobile", desktop: "Desktop" };
const FIDELITY_LABELS: Record<string, string> = { live_product: "Produit live", prototype_hifi: "Prototype hi-fi", prototype_lowfi: "Prototype lo-fi" };
const METRIC_LABELS: Record<AutomatedMetric, string> = {
  completion_rate: "Taux de complétion", time_on_task: "Temps sur tâche", click_count: "Nombre de clics",
  misclick_rate: "Taux de misclicks", first_click: "1er clic", drop_off_point: "Point d'abandon",
  heatmap: "Heatmap", screen_recording: "Enregistrement écran",
};
const QUESTION_TYPE_LABELS: Record<string, string> = {
  seq: "SEQ (1–7)", likert_5: "Likert (1–5)", likert_7: "Likert (1–7)",
  nps: "NPS (0–10)", open_short: "Réponse libre", mcq_single: "QCM — choix unique",
};
const ROLE_LABELS: Record<string, string> = {
  our_product: "Notre produit", competitor: "Concurrent", previous_version: "Version précédente",
};

// ─── Shared helpers ────────────────────────────────────────────────────────

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } },
    spacing: { before: 160, after: 160 },
  });
}

function sectionHeading(text: string, color = "1E3A5F"): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color })],
    spacing: { before: 400, after: 160 },
  });
}

function participantBlock(title: string, screenText: string): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: title, bold: true, size: 24, color: "1E3A5F" }),
        new TextRun({ text: "  [Vue participant]", size: 18, color: "059669", italics: true }),
      ],
      spacing: { before: 120, after: 60 },
      indent: { left: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: screenText, size: 20, color: "111111" })],
      shading: { type: ShadingType.SOLID, color: "ECFDF5", fill: "ECFDF5" },
      spacing: { before: 0, after: 160 },
      indent: { left: 120, right: 120 },
      border: { left: { style: BorderStyle.SINGLE, size: 6, color: "10B981" } },
    }),
  ];
}

function taskBlock(task: UnmoderatedTask, compact = false): Paragraph[] {
  const paras: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: `Tâche ${task.task_number} — `, bold: true, size: 22, color: "3B82F6" }),
        new TextRun({ text: task.task_title, bold: true, size: 22, color: "1E3A5F" }),
        new TextRun({ text: `  ⏱ ${task.time_limit_minutes} min`, size: 18, color: "888888" }),
      ],
      shading: { type: ShadingType.SOLID, color: "EFF6FF", fill: "EFF6FF" },
      spacing: { before: 240, after: 0 },
      indent: { left: 120, right: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Affiché au participant", bold: true, size: 18, color: "059669" })],
      spacing: { before: 100, after: 40 },
      indent: { left: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: task.screen_text, size: 20, color: "111111" })],
      shading: { type: ShadingType.SOLID, color: "ECFDF5", fill: "ECFDF5" },
      spacing: { before: 0, after: 80 },
      indent: { left: 120, right: 120 },
      border: { left: { style: BorderStyle.SINGLE, size: 6, color: "10B981" } },
    }),
  ];

  if (task.starting_url) {
    paras.push(new Paragraph({
      children: [
        new TextRun({ text: "URL de départ : ", bold: true, size: 18, color: "555555" }),
        new TextRun({ text: task.starting_url, size: 18, color: "3B82F6" }),
      ],
      spacing: { before: 40, after: 60 },
      indent: { left: 120 },
    }));
  }

  if (!compact) {
    paras.push(new Paragraph({
      children: [
        new TextRun({ text: "Critère de succès (interne) : ", bold: true, size: 18, color: "B45309" }),
        new TextRun({ text: task.success_criteria, size: 18, color: "444444" }),
      ],
      shading: { type: ShadingType.SOLID, color: "FFFBEB", fill: "FFFBEB" },
      spacing: { before: 40, after: 80 },
      indent: { left: 120, right: 120 },
    }));

    if (task.automated_metrics.length > 0) {
      paras.push(new Paragraph({
        children: [
          new TextRun({ text: "Métriques : ", bold: true, size: 18, color: "1E3A5F" }),
          new TextRun({ text: task.automated_metrics.map((m) => METRIC_LABELS[m] ?? m).join("  ·  "), size: 18, color: "1D4ED8" }),
        ],
        spacing: { before: 40, after: 80 },
        indent: { left: 120 },
      }));
    }
  }

  task.post_task_questions.forEach((q: UnmoderatedPostTaskQuestion, i: number) => {
    const typeLabel = QUESTION_TYPE_LABELS[q.type] ?? q.type;
    paras.push(new Paragraph({
      children: [
        new TextRun({ text: `Q${i + 1}. `, bold: true, size: 18, color: "555555" }),
        new TextRun({ text: q.text, size: 18, color: "222222" }),
        new TextRun({ text: `  [${typeLabel}]`, size: 16, color: "888888", italics: true }),
      ],
      indent: { left: 200 },
      spacing: { after: 40 },
    }));
    if (q.scale_labels) {
      paras.push(new Paragraph({
        children: [new TextRun({ text: `${q.scale_labels.min} → ${q.scale_labels.max}`, size: 16, color: "888888", italics: true })],
        indent: { left: 320 },
        spacing: { after: 40 },
      }));
    }
    if (q.options) {
      q.options.forEach((opt: string) => {
        paras.push(new Paragraph({
          children: [new TextRun({ text: `○ ${opt}`, size: 17, color: "555555" })],
          indent: { left: 320 },
          spacing: { after: 20 },
        }));
      });
    }
  });

  return paras;
}

function coverPage(title: string, subtitle: string, meta: string[], date: string): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 56, color: "1E3A5F" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: subtitle, size: 28, color: "3B82F6" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: meta.flatMap((m, i) => [
        new TextRun({ text: m, size: 20, color: "555555" }),
        ...(i < meta.length - 1 ? [new TextRun({ text: "   ·   ", size: 20, color: "CCCCCC" })] : []),
      ]),
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: date, size: 20, color: "777777" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─── Monadic exporter ──────────────────────────────────────────────────────

async function generateMonadicDocx(protocol: MonadicProtocol): Promise<Buffer> {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const children: Paragraph[] = [];

  children.push(...coverPage(
    protocol.title,
    `Test non-modéré monadique — ${protocol.product_name}`,
    [PLATFORM_LABELS[protocol.platform] ?? protocol.platform, FIDELITY_LABELS[protocol.fidelity] ?? protocol.fidelity, protocol.tool],
    date
  ));

  if (protocol.screener_questions.length > 0) {
    children.push(sectionHeading("Screener"));
    protocol.screener_questions.forEach((q, i) => {
      children.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${q}`, size: 20 })], indent: { left: 120 }, spacing: { after: 80 } }));
    });
    children.push(divider());
  }

  children.push(sectionHeading("Bloc d'accueil"));
  participantBlock(protocol.welcome_block.title, protocol.welcome_block.screen_text).forEach((p) => children.push(p));
  children.push(divider());

  children.push(sectionHeading(`Tâches (${protocol.tasks.length})`));
  protocol.tasks.forEach((task) => { taskBlock(task).forEach((p) => children.push(p)); children.push(divider()); });

  children.push(sectionHeading("Bloc de clôture"));
  participantBlock(protocol.closing_block.title, protocol.closing_block.screen_text).forEach((p) => children.push(p));

  if (protocol.analysis_guide) {
    children.push(divider(), sectionHeading("Guide d'analyse"),
      new Paragraph({ children: [new TextRun({ text: protocol.analysis_guide, size: 22 })], spacing: { after: 200 } })
    );
  }

  const doc = new Document({ styles: { paragraphStyles: [{ id: "Normal", name: "Normal", run: { font: "Calibri", size: 22 } }] }, sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

// ─── A/B exporter ──────────────────────────────────────────────────────────

async function generateABDocx(protocol: ABProtocol): Promise<Buffer> {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const isWithin = protocol.ab_design === "within";
  const children: Paragraph[] = [];

  children.push(...coverPage(
    protocol.title,
    `Test A/B non-modéré — ${isWithin ? "Within-subjects" : "Between-subjects"}`,
    [PLATFORM_LABELS[protocol.platform] ?? protocol.platform, FIDELITY_LABELS[protocol.fidelity] ?? protocol.fidelity, protocol.tool],
    date
  ));

  if (isWithin && protocol.counterbalancing) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Note de contrebalancement", bold: true, size: 24, color: "1E3A5F" })],
        spacing: { before: 200, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "50 % des participants voient les variantes dans l'ordre A → B. Les 50 % restants voient l'ordre B → A. Cela neutralise les biais d'ordre et d'apprentissage.", size: 20, color: "444444" })],
        shading: { type: ShadingType.SOLID, color: "EFF6FF", fill: "EFF6FF" },
        spacing: { after: 200 },
        indent: { left: 120, right: 120 },
      }),
      divider()
    );
  }

  children.push(sectionHeading("Bloc d'accueil"));
  participantBlock(protocol.welcome_block.title, protocol.welcome_block.screen_text).forEach((p) => children.push(p));
  children.push(divider());

  protocol.variants.forEach((variant) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Variante ${variant.label} — `, bold: true, size: 32, color: "3B82F6" }),
          new TextRun({ text: variant.product_name, bold: true, size: 32, color: "1E3A5F" }),
        ],
        spacing: { before: 300, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: variant.description, size: 20, color: "555555", italics: true })],
        spacing: { after: 160 },
        indent: { left: 120 },
      })
    );
    variant.tasks.forEach((task) => { taskBlock(task, true).forEach((p) => children.push(p)); });
    children.push(divider());
  });

  if (isWithin && protocol.comparison_questions.length > 0) {
    children.push(sectionHeading("Questions de comparaison"));
    protocol.comparison_questions.forEach((q, i) => {
      const typeLabel = QUESTION_TYPE_LABELS[q.type] ?? q.type;
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${i + 1}. `, bold: true, size: 20, color: "555555" }),
          new TextRun({ text: q.text, size: 20, color: "222222" }),
          new TextRun({ text: `  [${typeLabel}]`, size: 16, color: "888888", italics: true }),
        ],
        indent: { left: 120 },
        spacing: { after: 60 },
      }));
      if (q.options) {
        q.options.forEach((opt: string) => {
          children.push(new Paragraph({ children: [new TextRun({ text: `○ ${opt}`, size: 18, color: "444444" })], indent: { left: 240 }, spacing: { after: 30 } }));
        });
      }
    });
    children.push(divider());
  }

  children.push(sectionHeading("Bloc de clôture"));
  participantBlock(protocol.closing_block.title, protocol.closing_block.screen_text).forEach((p) => children.push(p));

  if (protocol.analysis_guide) {
    children.push(divider(), sectionHeading("Guide d'analyse"),
      new Paragraph({ children: [new TextRun({ text: protocol.analysis_guide, size: 22 })], spacing: { after: 200 } })
    );
  }

  const doc = new Document({ styles: { paragraphStyles: [{ id: "Normal", name: "Normal", run: { font: "Calibri", size: 22 } }] }, sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

// ─── Benchmark exporter ────────────────────────────────────────────────────

function benchmarkSummaryTable(protocol: BenchmarkProtocol): Table {
  const taskTitles = protocol.products[0]?.tasks.map((t) => t.task_title) ?? [];

  const headerRow = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: "Produit", bold: true, size: 18, color: "FFFFFF" })] })],
        shading: { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" },
        width: { size: 25, type: WidthType.PERCENTAGE },
        verticalAlign: VerticalAlign.CENTER,
      }),
      ...taskTitles.map((t) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 16, color: "FFFFFF" })] })],
        shading: { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" },
        verticalAlign: VerticalAlign.CENTER,
      })),
      ...protocol.standard_scales.map((s) => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: s, bold: true, size: 16, color: "FFFFFF" })] })],
        shading: { type: ShadingType.SOLID, color: "3B82F6", fill: "3B82F6" },
        verticalAlign: VerticalAlign.CENTER,
      })),
    ],
  });

  const dataRows = protocol.products.map((product) => new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [
          new TextRun({ text: `${product.name}`, bold: true, size: 18 }),
          new TextRun({ text: `\n(${ROLE_LABELS[product.role] ?? product.role})`, size: 15, color: "666666" }),
        ] })],
      }),
      ...product.tasks.map(() => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: "✓ Complétion\n— Tps\n— SEQ", size: 16, color: "444444" })] })],
      })),
      ...protocol.standard_scales.map(() => new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: "— / 100", size: 16, color: "666666" })] })],
      })),
    ],
  }));

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

async function generateBenchmarkDocx(protocol: BenchmarkProtocol): Promise<Buffer> {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const children: Paragraph[] = [];

  children.push(...coverPage(
    protocol.title,
    `Benchmark ${protocol.benchmark_type === "internal" ? "interne" : "compétitif"} — ${protocol.products.length} produits`,
    [PLATFORM_LABELS[protocol.platform] ?? protocol.platform, protocol.tool, protocol.standard_scales.join(", ")],
    date
  ));

  // Context
  children.push(
    sectionHeading("Contexte du benchmark"),
    new Paragraph({ children: [new TextRun({ text: protocol.benchmark_context, size: 22 })], spacing: { after: 160 } }),
    divider()
  );

  // Welcome
  children.push(sectionHeading("Bloc d'accueil"));
  participantBlock(protocol.welcome_block.title, protocol.welcome_block.screen_text).forEach((p) => children.push(p));
  children.push(divider());

  // Products
  protocol.products.forEach((product) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${product.name}`, bold: true, size: 32, color: "1E3A5F" }),
          new TextRun({ text: `  — ${ROLE_LABELS[product.role] ?? product.role}`, size: 20, color: "888888" }),
        ],
        spacing: { before: 360, after: 100 },
      })
    );
    product.tasks.forEach((task) => { taskBlock(task, true).forEach((p) => children.push(p)); });

    if (product.post_product_questions.length > 0) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: "Échelles normées (après toutes les tâches)", bold: true, size: 20, color: "6D28D9" })], spacing: { before: 160, after: 60 }, indent: { left: 120 } })
      );
      product.post_product_questions.forEach((q, i) => {
        const typeLabel = QUESTION_TYPE_LABELS[q.type] ?? q.type;
        children.push(new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 18, color: "555555" }),
            new TextRun({ text: q.text, size: 18, color: "222222" }),
            new TextRun({ text: `  [${typeLabel}]`, size: 16, color: "888888", italics: true }),
          ],
          indent: { left: 200 },
          spacing: { after: 40 },
        }));
        if (q.scale_labels) {
          children.push(new Paragraph({ children: [new TextRun({ text: `${q.scale_labels.min} → ${q.scale_labels.max}`, size: 16, color: "888888", italics: true })], indent: { left: 320 }, spacing: { after: 40 } }));
        }
      });
    }
    children.push(divider());
  });

  // Summary table
  children.push(sectionHeading("Tableau comparatif de synthèse"));
  children.push(new Paragraph({ text: "", spacing: { after: 80 } }));
  (children as unknown[]).push(benchmarkSummaryTable(protocol));
  children.push(new Paragraph({ text: "", spacing: { before: 200 } }));
  children.push(divider());

  // Analysis guide
  if (protocol.analysis_guide) {
    children.push(sectionHeading("Guide d'analyse & scoring"),
      new Paragraph({ children: [new TextRun({ text: protocol.analysis_guide, size: 22 })], spacing: { after: 200 } })
    );
  }

  const doc = new Document({ styles: { paragraphStyles: [{ id: "Normal", name: "Normal", run: { font: "Calibri", size: 22 } }] }, sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(doc));
}

// ─── Main dispatcher ───────────────────────────────────────────────────────

export async function generateUnmoderatedDocx(protocol: UnmoderatedProtocol): Promise<Buffer> {
  if (protocol.test_design === "ab") return generateABDocx(protocol);
  if (protocol.test_design === "benchmark") return generateBenchmarkDocx(protocol);
  return generateMonadicDocx(protocol as MonadicProtocol);
}
