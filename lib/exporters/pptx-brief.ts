import PptxGenJS from "pptxgenjs";
import { Brief, BriefSlide } from "@/lib/types/brief";

// ─── Sanitizer ─────────────────────────────────────────────────────────────
// pptxgenjs uses btoa() internally — only accepts bytes 0–255.

function san(text: string): string {
  return text
    .replace(/\u2014/g, "--")
    .replace(/\u2013/g, "-")
    .replace(/\u2018/g, "'")
    .replace(/\u2019/g, "'")
    .replace(/\u201C/g, '"')
    .replace(/\u201D/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00AB/g, "<<")
    .replace(/\u00BB/g, ">>")
    .replace(/[^\x00-\xFF]/g, (c) => `[U+${c.codePointAt(0)!.toString(16).toUpperCase()}]`);
}

function deepSan<T>(obj: T): T {
  if (typeof obj === "string") return san(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(deepSan) as unknown as T;
  if (obj !== null && typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      out[k] = deepSan(v);
    }
    return out as T;
  }
  return obj;
}

// ─── HTML → text lines ────────────────────────────────────────────────────
// Extracts readable text lines from an HTML fragment.
// Used to populate PPTX slides from Claude's HTML output.

function htmlToLines(html: string): string[] {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 4)
    .slice(0, 7);
}

// ─── Design tokens ─────────────────────────────────────────────────────────

const W = 10;
const H = 5.625;
const HDR_H = 0.75;
const CS = 0.9;       // content start Y
const CE = H - 0.25; // content end Y

const DARK      = "171717";
const DARK2     = "1E1E1E";
const BLUE      = "4D91E0";
const DARK_BDR  = "2D2D2D";
const LIGHT_BDR = "E2E8F0";
const WHITE     = "FFFFFF";
const OFF_WHITE = "C8D8EA";
const MUTED     = "6B7280";
const TEXT      = "1F2937";

// Accent color per slide type
const ACCENTS: Record<string, string> = {
  cover:        "4D91E0",
  context:      "64748B",
  objectives:   "4D91E0",
  methodology:  "6366F1",
  participants: "0D9488",
  timeline:     "4D91E0",
  deliverables: "3D9A6F",
  insights:     "5B52C7",
  next_steps:   "4D91E0",
};

// Background per slide type
const BG_COLORS: Record<string, string> = {
  context:      "F8FAFC",
  objectives:   "F8FAFC",
  methodology:  "FAFAFE",
  participants: "F0FDFA",
  timeline:     "F8FAFC",
  deliverables: "F8FCFA",
  insights:     "FAFAFE",
  next_steps:   "F8FAFC",
};

// ─── Shared drawing primitives ─────────────────────────────────────────────

type Slide = ReturnType<PptxGenJS["addSlide"]>;

function drawBg(ps: Slide, pptx: PptxGenJS, color: string) {
  ps.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color }, line: { color } });
}

function drawHeader(ps: Slide, pptx: PptxGenJS, slide: BriefSlide, acc: string) {
  ps.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: HDR_H,
    fill: { color: DARK }, line: { color: DARK },
  });
  ps.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.07, h: HDR_H,
    fill: { color: acc }, line: { color: acc },
  });
  ps.addText(String(slide.slide_number).padStart(2, "0"), {
    x: 0.13, y: 0, w: 0.44, h: HDR_H,
    fontSize: 9, color: acc, fontFace: "Courier New", valign: "middle",
  });
  ps.addShape(pptx.ShapeType.rect, {
    x: 0.62, y: HDR_H * 0.22, w: 0.012, h: HDR_H * 0.56,
    fill: { color: DARK_BDR }, line: { color: DARK_BDR },
  });
  ps.addText(san(slide.title), {
    x: 0.72, y: 0, w: W - 0.87, h: HDR_H,
    fontSize: 15, bold: true, color: WHITE, valign: "middle",
  });
}

// ─── COVER ─────────────────────────────────────────────────────────────────

function renderCover(pptx: PptxGenJS, slide: BriefSlide, brief: Brief): void {
  const ps = pptx.addSlide();

  // Near-black background
  ps.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: H,
    fill: { color: DARK }, line: { color: DARK },
  });

  // Simulated radial blue glow
  ps.addShape(pptx.ShapeType.ellipse, {
    x: 0.5, y: -2.8, w: W - 1, h: 5.5,
    fill: { color: BLUE, transparency: 83 },
    line: { color: BLUE, transparency: 83 },
  });

  // Left accent strip
  ps.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.12, h: H,
    fill: { color: BLUE }, line: { color: BLUE },
  });

  // Horizontal separator
  ps.addShape(pptx.ShapeType.rect, {
    x: 0.32, y: 2.78, w: 6.9, h: 0.018,
    fill: { color: DARK_BDR }, line: { color: DARK_BDR },
  });

  // Title
  ps.addText(san(slide.title), {
    x: 0.38, y: 0.65, w: 6.85, h: 1.95,
    fontSize: 30, bold: true, color: WHITE, valign: "bottom",
  });

  // Subtitle from extracted HTML lines
  const lines = htmlToLines(slide.html);
  if (lines.length > 0) {
    ps.addText(san(lines[0]), {
      x: 0.38, y: 2.84, w: 6.85, h: 0.68,
      fontSize: 12, color: BLUE, valign: "top",
    });
  }

  // Right summary card
  const CARD_X = 7.52;
  const CARD_W = W - CARD_X - 0.18;
  ps.addShape(pptx.ShapeType.rect, {
    x: CARD_X, y: 0.2, w: CARD_W, h: H - 0.4,
    fill: { color: DARK2 }, line: { color: DARK_BDR, pt: 0.75 },
  });
  ps.addShape(pptx.ShapeType.rect, {
    x: CARD_X, y: 0.2, w: CARD_W, h: 0.055,
    fill: { color: BLUE }, line: { color: BLUE },
  });
  ps.addText("Plan d'etude", {
    x: CARD_X + 0.1, y: 0.28, w: CARD_W - 0.32, h: 0.3,
    fontSize: 6.5, color: MUTED, fontFace: "Courier New",
  });
  ps.addShape(pptx.ShapeType.ellipse, {
    x: CARD_X + CARD_W - 0.3, y: 0.35, w: 0.1, h: 0.1,
    fill: { color: "4ADE80" }, line: { color: "4ADE80" },
  });
  ps.addShape(pptx.ShapeType.rect, {
    x: CARD_X + 0.1, y: 0.64, w: CARD_W - 0.2, h: 0.008,
    fill: { color: DARK_BDR }, line: { color: DARK_BDR },
  });

  // Card bullet items (extracted from HTML, skip first line used as subtitle)
  const cardLines = lines.slice(1);
  const n = Math.max(cardLines.length, 1);
  const itemH = (H - 0.4 - 0.7) / n;
  cardLines.forEach((line, i) => {
    const iy = 0.7 + i * itemH;
    if (i > 0) {
      ps.addShape(pptx.ShapeType.rect, {
        x: CARD_X + 0.1, y: iy - 0.03, w: CARD_W - 0.2, h: 0.008,
        fill: { color: DARK_BDR }, line: { color: DARK_BDR },
      });
    }
    ps.addShape(pptx.ShapeType.ellipse, {
      x: CARD_X + 0.12, y: iy + itemH / 2 - 0.065,
      w: 0.1, h: 0.1,
      fill: { color: BLUE, transparency: 45 },
      line: { color: BLUE, transparency: 45 },
    });
    ps.addText(san(line), {
      x: CARD_X + 0.28, y: iy + 0.02, w: CARD_W - 0.36, h: itemH - 0.05,
      fontSize: 7.5, color: OFF_WHITE, valign: "middle",
    });
  });

  // Date
  ps.addText(san(brief.generated_date), {
    x: 0.38, y: H - 0.38, w: 3, h: 0.26,
    fontSize: 8.5, color: MUTED,
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── CONTENT SLIDES ────────────────────────────────────────────────────────
// Simplified layout: dark header + extracted text lines as a bullet list.

function renderContent(pptx: PptxGenJS, slide: BriefSlide, acc: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);

  const lines = htmlToLines(slide.html);
  const n = lines.length;

  if (n === 0) {
    ps.addNotes(san(slide.speaker_notes));
    return;
  }

  const itemH = Math.min((CE - CS) / n, 0.9);

  lines.forEach((line, i) => {
    const by = CS + i * itemH;

    // Accent bar
    ps.addShape(pptx.ShapeType.rect, {
      x: 0.4, y: by + 0.1, w: 0.055, h: itemH - 0.22,
      fill: { color: acc }, line: { color: acc },
    });

    // Text
    ps.addText(san(line), {
      x: 0.6, y: by, w: W - 1.05, h: itemH,
      fontSize: 11, color: TEXT, valign: "middle",
    });
  });

  // Light separator between items
  if (n > 1) {
    lines.forEach((_, i) => {
      if (i === 0) return;
      ps.addShape(pptx.ShapeType.rect, {
        x: 0.62, y: CS + i * itemH, w: W - 1.05, h: 0.008,
        fill: { color: LIGHT_BDR }, line: { color: LIGHT_BDR },
      });
    });
  }

  ps.addNotes(san(slide.speaker_notes));
}

// ─── Main export ───────────────────────────────────────────────────────────

export async function generateBriefPptx(rawBrief: Brief): Promise<Buffer> {
  const brief = deepSan(rawBrief);

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = brief.project_title;
  pptx.subject = "Brief stakeholders -- User Research Suite";
  pptx.author = "User Research Suite";

  for (const slide of brief.slides) {
    if (slide.type === "cover") {
      renderCover(pptx, slide, brief);
      continue;
    }

    const acc = ACCENTS[slide.type] ?? ACCENTS.context;
    const bg = BG_COLORS[slide.type] ?? "F8FAFC";
    renderContent(pptx, slide, acc, bg);
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}
