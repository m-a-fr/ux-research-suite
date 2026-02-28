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

// ─── Bullet parser ──────────────────────────────────────────────────────────
// Splits "Primary -- Secondary" (sanitized form of Claude's " — " separator)
// into a two-level hierarchy for richer visual display.

function parseBullet(text: string): { primary: string; secondary: string | null } {
  const idx = text.indexOf(" -- ");
  if (idx > 0 && idx < text.length - 4) {
    return { primary: text.slice(0, idx), secondary: text.slice(idx + 4) };
  }
  return { primary: text, secondary: null };
}

// ─── Duration parser ─────────────────────────────────────────────────────────
// Extracts a numeric weight from French/English duration strings.
// Used by timeline-bars to compute proportional Gantt bar widths.
// Runs on the secondary part of a bullet first ("Phase -- 2 semaines").

function parseDuration(text: string): number {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(semaine|week|mois|month|jour|day)/i);
  if (!m) return 1;
  const val = parseFloat(m[1].replace(",", "."));
  const unit = m[2].toLowerCase();
  if (unit.startsWith("mois") || unit.startsWith("month")) return val * 20;
  if (unit.startsWith("semaine") || unit.startsWith("week")) return val * 5;
  return val;
}

// ─── Metric parser ───────────────────────────────────────────────────────────
// Extracts a leading number+unit and a label from "42% -- Taux d'abandon" bullets.

function parseMetric(text: string): { value: string; label: string } | null {
  const { primary, secondary } = parseBullet(text);
  if (secondary !== null) {
    const m = primary.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z%]{0,4})\s*$/);
    if (m) {
      const value = (m[1] + m[2]).trim();
      return { value, label: secondary };
    }
  }
  // Fallback: "42% Taux d'abandon" without separator
  const m2 = text.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z%]{0,4})\s+(.{4,})$/);
  if (m2) {
    const value = (m2[1] + m2[2]).trim();
    return { value, label: m2[3].trim() };
  }
  return null;
}

// ─── Design tokens ─────────────────────────────────────────────────────────

const W = 10;
const H = 5.625;
const HDR_H = 0.75;
const CS = 0.9;           // content start Y
const CE = H - 0.25;      // content end Y = 5.375
const BH = 0.62;          // body highlight box height
const WHITE = "FFFFFF";
const NAVY = "1E3A5F";
const TEXT = "1F2937";

// Accent color [main, light] per slide type — determines color palette only.
// Layout structure is chosen by Claude at generation time via slide.layout.
const ACCENTS: Record<string, [string, string]> = {
  cover:        ["3B82F6", "1E3A5F"],
  context:      ["475569", "F1F5F9"],
  objectives:   ["2563EB", "DBEAFE"],
  methodology:  ["7C3AED", "EDE9FE"],
  participants: ["0D9488", "CCFBF1"],
  timeline:     ["B45309", "FEF3C7"],
  deliverables: ["059669", "D1FAE5"],
  insights:     ["4F46E5", "EEF2FF"],
  next_steps:   ["0EA5E9", "E0F2FE"],
};

// Background color per slide type
const BG_COLORS: Record<string, string> = {
  context:      "F1F5F9",
  objectives:   "F8FAFC",
  methodology:  "FAFAFA",
  participants: "F0FDFA",
  timeline:     "FFFBEB",
  deliverables: "F0FDF4",
  insights:     "F5F3FF",
  next_steps:   "F0F9FF",
};

// ─── Shared drawing primitives ─────────────────────────────────────────────

type Slide = ReturnType<PptxGenJS["addSlide"]>;

function drawBg(ps: Slide, pptx: PptxGenJS, color: string) {
  ps.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color }, line: { color } });
}

function drawHeader(ps: Slide, pptx: PptxGenJS, slide: BriefSlide, acc: string) {
  ps.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: HDR_H, fill: { color: NAVY }, line: { color: NAVY } });
  ps.addShape(pptx.ShapeType.ellipse, { x: 0.18, y: 0.22, w: 0.32, h: 0.32, fill: { color: acc }, line: { color: acc } });
  ps.addText(String(slide.slide_number), {
    x: 0.18, y: 0.22, w: 0.32, h: 0.32,
    fontSize: 9, bold: true, color: WHITE, align: "center", valign: "middle",
  });
  ps.addText(san(slide.title), {
    x: 0.62, y: 0, w: W - 0.77, h: HDR_H,
    fontSize: 16, bold: true, color: WHITE, valign: "middle",
  });
}

// Draws the body highlight box if slide.body exists. Returns next cY.
function drawBody(ps: Slide, pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string): number {
  if (!slide.body) return CS;
  ps.addShape(pptx.ShapeType.rect, { x: 0.4, y: CS, w: W - 0.8, h: BH, fill: { color: light }, line: { color: acc, pt: 1 } });
  ps.addShape(pptx.ShapeType.rect, { x: 0.4, y: CS, w: 0.06, h: BH, fill: { color: acc }, line: { color: acc } });
  ps.addText(san(slide.body), {
    x: 0.58, y: CS, w: W - 1.1, h: BH,
    fontSize: 11, color: NAVY, italic: true, valign: "middle",
  });
  return CS + BH + 0.12;
}

// ─── COVER (own dedicated renderer) ────────────────────────────────────────

function renderCover(pptx: PptxGenJS, slide: BriefSlide, brief: Brief): void {
  const ps = pptx.addSlide();
  const PANEL_X = 7.4;
  const panelW = W - PANEL_X;

  ps.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: NAVY }, line: { color: NAVY } });
  ps.addShape(pptx.ShapeType.rect, { x: PANEL_X, y: 0, w: panelW, h: H, fill: { color: "162D4A" }, line: { color: "162D4A" } });
  ps.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.1, h: H, fill: { color: "3B82F6" }, line: { color: "3B82F6" } });
  ps.addShape(pptx.ShapeType.rect, { x: 0.1, y: 2.58, w: PANEL_X - 0.3, h: 0.04, fill: { color: "3B82F6" }, line: { color: "3B82F6" } });
  ps.addShape(pptx.ShapeType.rect, { x: PANEL_X, y: 0, w: panelW, h: 0.07, fill: { color: "3B82F6" }, line: { color: "3B82F6" } });

  ps.addText(san(slide.title), {
    x: 0.35, y: 0.75, w: PANEL_X - 0.55, h: 1.7,
    fontSize: 28, bold: true, color: WHITE, valign: "bottom",
  });

  if (slide.body) {
    ps.addText(san(slide.body), {
      x: 0.35, y: 2.7, w: PANEL_X - 0.55, h: 0.65,
      fontSize: 12, color: "93C5FD", valign: "top",
    });
  }

  const n = slide.bullets.length;
  const itemH = (H - 0.6) / Math.max(n, 1);
  slide.bullets.forEach((b, i) => {
    const iy = 0.3 + i * itemH;
    if (i > 0) {
      ps.addShape(pptx.ShapeType.rect, { x: PANEL_X + 0.1, y: iy - 0.03, w: panelW - 0.2, h: 0.01, fill: { color: "2D4D6E" }, line: { color: "2D4D6E" } });
    }
    ps.addShape(pptx.ShapeType.rect, { x: PANEL_X + 0.12, y: iy + 0.04, w: 0.04, h: 0.28, fill: { color: "3B82F6" }, line: { color: "3B82F6" } });
    ps.addText(san(b), {
      x: PANEL_X + 0.22, y: iy, w: panelW - 0.3, h: itemH,
      fontSize: 8.5, color: "B0C4DE", valign: "middle",
    });
  });

  ps.addText(san(brief.generated_date), {
    x: 0.35, y: H - 0.42, w: 3, h: 0.28,
    fontSize: 9, color: "64748B",
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: LIST ──────────────────────────────────────────────────────────
// Vertical list with accent bars. Universal fallback.

function renderList(pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const n = slide.bullets.length;
  const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.9);

  slide.bullets.forEach((b, i) => {
    const by = cY + i * itemH;
    const { primary, secondary } = parseBullet(b);

    ps.addShape(pptx.ShapeType.rect, { x: 0.4, y: by + 0.1, w: 0.055, h: itemH - 0.22, fill: { color: acc }, line: { color: acc } });

    if (secondary) {
      ps.addText(san(primary), {
        x: 0.6, y: by + 0.04, w: W - 1.05, h: itemH * 0.5,
        fontSize: 11, bold: true, color: NAVY, valign: "bottom",
      });
      ps.addText(san(secondary), {
        x: 0.6, y: by + itemH * 0.5, w: W - 1.05, h: itemH * 0.44,
        fontSize: 9.5, color: TEXT, valign: "top",
      });
    } else {
      ps.addText(san(b), { x: 0.6, y: by, w: W - 1.05, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
    }
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: CARD GRID ─────────────────────────────────────────────────────
// 2×N grid of white cards, each with a colored top bar.
// Compact body line above grid if slide.body is present.

function renderCardGrid(pptx: PptxGenJS, slide: BriefSlide, acc: string, _light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);

  // Compact body subtitle (no full box — preserve space for cards)
  let gridStartY = CS + 0.05;
  if (slide.body) {
    ps.addText(san(slide.body), {
      x: 0.45, y: CS, w: W - 0.9, h: 0.38,
      fontSize: 10.5, color: NAVY, italic: true, valign: "middle",
    });
    ps.addShape(pptx.ShapeType.rect, { x: 0.45, y: CS + 0.38, w: W - 0.9, h: 0.02, fill: { color: acc }, line: { color: acc } });
    gridStartY = CS + 0.46;
  }

  const bullets = slide.bullets;
  const n = bullets.length;
  const COLS = n <= 2 ? 1 : 2;
  const ROWS = Math.ceil(n / COLS);
  const MX = 0.45;
  const GAP = 0.18;
  const cardW = (W - MX * 2 - GAP * (COLS - 1)) / COLS;
  const availH = CE - gridStartY;
  const cardH = Math.min((availH - GAP * (ROWS - 1)) / ROWS, 1.85);
  const totalH = ROWS * cardH + (ROWS - 1) * GAP;
  const startY = gridStartY + Math.max(0, (availH - totalH) / 2);

  bullets.forEach((b, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    // Last item alone in its row spans full width
    const isLastAlone = i === n - 1 && n % COLS === 1 && COLS > 1;
    const cx = MX + col * (cardW + GAP);
    const cy = startY + row * (cardH + GAP);
    const thisW = isLastAlone ? W - MX * 2 : cardW;
    const { primary, secondary } = parseBullet(b);

    // White card with subtle border
    ps.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: thisW, h: cardH, fill: { color: WHITE }, line: { color: "CBD5E1", pt: 0.75 } });
    // Accent top bar
    ps.addShape(pptx.ShapeType.rect, { x: cx, y: cy, w: thisW, h: 0.08, fill: { color: acc }, line: { color: acc } });

    const padX = 0.16;
    const textX = cx + padX;
    const textW = thisW - padX * 2;

    if (secondary) {
      ps.addText(san(primary), {
        x: textX, y: cy + 0.12, w: textW, h: cardH * 0.44,
        fontSize: 11, bold: true, color: NAVY, valign: "bottom",
      });
      ps.addText(san(secondary), {
        x: textX, y: cy + cardH * 0.5, w: textW, h: cardH * 0.44,
        fontSize: 9.5, color: TEXT, valign: "top",
      });
    } else {
      ps.addText(san(b), {
        x: textX, y: cy + 0.08, w: textW, h: cardH - 0.1,
        fontSize: 11, color: TEXT, valign: "middle",
      });
    }
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: TWO PANEL ─────────────────────────────────────────────────────
// Dark left panel (body as hero text) + light right panel (bullets with diamonds).

function renderTwoPanel(pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);

  const PANEL_H = CE - CS;
  const LEFT_W = 3.1;
  const LEFT_X = 0.4;
  const RIGHT_X = LEFT_X + LEFT_W + 0.14;
  const RIGHT_W = W - RIGHT_X - 0.3;

  // Left dark panel
  ps.addShape(pptx.ShapeType.rect, { x: LEFT_X, y: CS, w: LEFT_W, h: PANEL_H, fill: { color: acc }, line: { color: acc } });
  // Light top accent strip on left panel
  ps.addShape(pptx.ShapeType.rect, { x: LEFT_X, y: CS, w: LEFT_W, h: 0.06, fill: { color: light }, line: { color: light } });

  const heroText = slide.body ?? slide.title;
  ps.addText(san(heroText), {
    x: LEFT_X + 0.22, y: CS + 0.22, w: LEFT_W - 0.4, h: PANEL_H - 0.65,
    fontSize: 14, bold: true, color: WHITE, valign: "middle",
  });
  // Subtle label at bottom of left panel
  ps.addText("Approche choisie", {
    x: LEFT_X + 0.22, y: CS + PANEL_H - 0.42, w: LEFT_W - 0.4, h: 0.32,
    fontSize: 7.5, color: "C4B5FD", italic: true,
  });

  // Right panel: bullet details with diamond markers
  const n = slide.bullets.length;
  const itemH = Math.min(PANEL_H / Math.max(n, 1), 0.9);
  const dsize = 0.18;

  slide.bullets.forEach((b, i) => {
    const by = CS + i * itemH;
    const dy = by + (itemH - dsize) / 2;
    const { primary, secondary } = parseBullet(b);

    ps.addShape(pptx.ShapeType.diamond, { x: RIGHT_X, y: dy, w: dsize, h: dsize, fill: { color: acc }, line: { color: acc } });
    const textX = RIGHT_X + dsize + 0.12;
    const textW = RIGHT_W - dsize - 0.12;

    if (secondary) {
      ps.addText(san(primary), {
        x: textX, y: by + 0.04, w: textW, h: itemH * 0.5,
        fontSize: 10.5, bold: true, color: NAVY, valign: "bottom",
      });
      ps.addText(san(secondary), {
        x: textX, y: by + itemH * 0.5, w: textW, h: itemH * 0.44,
        fontSize: 9, color: TEXT, valign: "top",
      });
    } else {
      ps.addText(san(b), { x: textX, y: by, w: textW, h: itemH, fontSize: 10.5, color: TEXT, valign: "middle" });
    }
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: ROW CARDS ─────────────────────────────────────────────────────
// Full-width numbered rows — each bullet gets its own card with accent band on left.

function renderRowCards(pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const bullets = slide.bullets;
  const n = bullets.length;
  const GAP = 0.12;
  const availH = CE - cY - 0.05;
  const cardH = Math.min((availH - GAP * (n - 1)) / Math.max(n, 1), 1.0);
  const MX = 0.4;
  const NUM_W = 0.65;

  bullets.forEach((b, i) => {
    const by = cY + i * (cardH + GAP);
    const { primary, secondary } = parseBullet(b);

    // Card background
    ps.addShape(pptx.ShapeType.rect, { x: MX, y: by, w: W - MX * 2, h: cardH, fill: { color: WHITE }, line: { color: "E2E8F0", pt: 0.75 } });
    // Numbered accent band (left)
    ps.addShape(pptx.ShapeType.rect, { x: MX, y: by, w: NUM_W, h: cardH, fill: { color: acc }, line: { color: acc } });
    ps.addText(String(i + 1).padStart(2, "0"), {
      x: MX, y: by, w: NUM_W, h: cardH,
      fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle",
    });

    const textX = MX + NUM_W + 0.18;
    const textW = W - MX * 2 - NUM_W - 0.18 - 0.12;

    if (secondary) {
      ps.addText(san(primary), {
        x: textX, y: by + 0.05, w: textW, h: cardH * 0.5,
        fontSize: 11, bold: true, color: NAVY, valign: "bottom",
      });
      ps.addText(san(secondary), {
        x: textX, y: by + cardH * 0.5, w: textW, h: cardH * 0.44,
        fontSize: 9.5, color: TEXT, valign: "top",
      });
    } else {
      ps.addText(san(b), { x: textX, y: by, w: textW, h: cardH, fontSize: 11, color: TEXT, valign: "middle" });
    }
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: PHASE BLOCKS ──────────────────────────────────────────────────
// Horizontal colored progression blocks for sequential phases (≤5).
// Falls back to numbered list for 6+ items.

function renderPhaseBlocks(pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const bullets = slide.bullets;
  const n = bullets.length;

  if (n <= 5) {
    const blockW = (W - 0.9) / n;
    const blockH = CE - cY;
    const blockColors = ["1E3A5F", "1D4ED8", "2563EB", "3B82F6", "60A5FA"];
    const textFs = n <= 3 ? 9.5 : n === 4 ? 8.5 : 8;

    bullets.forEach((b, i) => {
      const bx = 0.45 + i * blockW;
      const col = blockColors[i % blockColors.length];
      ps.addShape(pptx.ShapeType.rect, { x: bx, y: cY, w: blockW - 0.06, h: blockH, fill: { color: col }, line: { color: WHITE, pt: 1.5 } });
      ps.addText(String(i + 1), { x: bx, y: cY + 0.06, w: blockW - 0.06, h: 0.5, fontSize: 22, bold: true, color: WHITE, align: "center" });
      ps.addText(san(b), { x: bx + 0.06, y: cY + 0.6, w: blockW - 0.18, h: blockH - 0.65, fontSize: textFs, color: WHITE, align: "center", valign: "top" });
    });
  } else {
    // Vertical fallback with amber connector
    const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.78);
    const badge = 0.3;
    const cx = 0.4 + badge / 2;

    bullets.forEach((b, i) => {
      const by = cY + i * itemH;
      if (i < n - 1) {
        ps.addShape(pptx.ShapeType.rect, { x: cx - 0.012, y: by + badge + 0.04, w: 0.024, h: itemH - badge - 0.06, fill: { color: "FCD34D" }, line: { color: "FCD34D" } });
      }
      ps.addShape(pptx.ShapeType.ellipse, { x: 0.4, y: by + 0.04, w: badge, h: badge, fill: { color: acc }, line: { color: acc } });
      ps.addText(String(i + 1), { x: 0.4, y: by + 0.04, w: badge, h: badge, fontSize: 9, bold: true, color: WHITE, align: "center", valign: "middle" });
      ps.addText(san(b), { x: 0.82, y: by, w: W - 1.25, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
    });
  }

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: INSIGHT BOXES ─────────────────────────────────────────────────
// Full-width white boxes with a thick left accent bar — each bullet is prominent.

function renderInsightBoxes(pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const bullets = slide.bullets;
  const n = bullets.length;
  const MX = 0.4;
  const GAP = 0.14;
  const ACCENT_W = 0.1;
  const PAD = 0.2;
  const availH = CE - cY - 0.05;
  const itemH = Math.min((availH - GAP * (n - 1)) / Math.max(n, 1), 1.1);

  bullets.forEach((b, i) => {
    const by = cY + i * (itemH + GAP);
    const { primary, secondary } = parseBullet(b);

    // White box with subtle border
    ps.addShape(pptx.ShapeType.rect, { x: MX, y: by, w: W - MX * 2, h: itemH, fill: { color: WHITE }, line: { color: "D1D5DB", pt: 0.75 } });
    // Thick left accent
    ps.addShape(pptx.ShapeType.rect, { x: MX, y: by, w: ACCENT_W, h: itemH, fill: { color: acc }, line: { color: acc } });

    const textX = MX + ACCENT_W + PAD;
    const textW = W - MX * 2 - ACCENT_W - PAD - 0.12;

    if (secondary) {
      ps.addText(san(primary), {
        x: textX, y: by + 0.04, w: textW, h: itemH * 0.52,
        fontSize: 11, bold: true, color: NAVY, valign: "bottom",
      });
      ps.addText(san(secondary), {
        x: textX, y: by + itemH * 0.52, w: textW, h: itemH * 0.42,
        fontSize: 9.5, color: TEXT, valign: "top",
      });
    } else {
      ps.addText(san(b), { x: textX, y: by, w: textW, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
    }
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: CHEVRON FLOW ──────────────────────────────────────────────────
// Connected chevron arrows for ordered sequential phases (2–6 items).
// Falls back to an inline list for <2 or >6 items.

function renderChevronFlow(pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const bullets = slide.bullets;
  const n = bullets.length;

  if (n < 2 || n > 6) {
    // Inline list fallback
    const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.9);
    bullets.forEach((b, i) => {
      const by = cY + i * itemH;
      ps.addShape(pptx.ShapeType.rect, { x: 0.4, y: by + 0.1, w: 0.055, h: itemH - 0.22, fill: { color: acc }, line: { color: acc } });
      ps.addText(san(b), { x: 0.6, y: by, w: W - 1.05, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
    });
    ps.addNotes(san(slide.speaker_notes));
    return;
  }

  const MX = 0.4;
  const availW = W - MX * 2;
  const contentH = CE - cY;
  const chevronH = Math.min(contentH * 0.7, 1.5);
  const topY = cY + (contentH - chevronH) / 2;
  const overlap = chevronH * 0.22;
  const chevronW = (availW + (n - 1) * overlap) / n;
  const step = chevronW - overlap;

  const FLOW_COLORS = ["1E3A5F", "1D4ED8", "2563EB", "3B82F6", "60A5FA", "93C5FD"];

  bullets.forEach((b, i) => {
    const cx = MX + i * step;
    const { primary, secondary } = parseBullet(b);
    // Safe text zone: skip left notch (for i > 0) and right arrow tip (for last)
    const safeX = cx + (i > 0 ? overlap * 0.45 : 0.1);
    const safeW = step - (i === n - 1 ? overlap * 0.4 : 0) - 0.12;

    ps.addShape(pptx.ShapeType.chevron, {
      x: cx, y: topY, w: chevronW, h: chevronH,
      fill: { color: FLOW_COLORS[i] }, line: { color: WHITE, pt: 1.2 },
    });

    ps.addText(String(i + 1), {
      x: safeX, y: topY + 0.07, w: safeW, h: 0.46,
      fontSize: n <= 4 ? 18 : 14, bold: true, color: WHITE, align: "center",
    });

    ps.addText(san(primary), {
      x: safeX, y: topY + 0.57, w: safeW, h: chevronH - 0.65,
      fontSize: n <= 3 ? 9.5 : n === 4 ? 8.5 : 7.5,
      color: WHITE, align: "center", valign: "top",
    });

    if (secondary) {
      ps.addText(san(secondary), {
        x: safeX, y: topY + chevronH + 0.06, w: safeW,
        h: Math.max(contentH - chevronH - 0.12, 0.28),
        fontSize: 7.5, color: NAVY, align: "center", valign: "top",
      });
    }
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: TIMELINE BARS ─────────────────────────────────────────────────
// Gantt-style horizontal bars — label column left, proportional bars right.
// Expects "Phase -- Durée" bullet format for proportional sizing; falls back
// to equal-width bars when no duration is detected.

function renderTimelineBars(pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const bullets = slide.bullets;
  const n = bullets.length;
  const MX = 0.4;
  const LABEL_W = 2.9;
  const BAR_X = MX + LABEL_W + 0.14;
  const BAR_AREA_W = W - BAR_X - MX;
  const GAP = 0.1;
  const availH = CE - cY - 0.04;
  const rowH = Math.min((availH - GAP * (n - 1)) / Math.max(n, 1), 0.84);
  const barH = rowH * 0.5;

  // Parse durations from secondary (preferred) or primary
  const durations = bullets.map((b) => {
    const { primary, secondary } = parseBullet(b);
    return parseDuration(secondary ?? primary);
  });
  const totalDur = durations.reduce((a, d) => a + d, 0) || n;

  let cumOffset = 0;
  bullets.forEach((b, i) => {
    const rowY = cY + i * (rowH + GAP);
    const { primary, secondary } = parseBullet(b);
    const dur = durations[i];
    const barW = Math.max((dur / totalDur) * BAR_AREA_W, 0.3);
    const barStartX = BAR_X + (cumOffset / totalDur) * BAR_AREA_W;
    const barY = rowY + (rowH - barH) / 2;

    // Alternating row tint
    if (i % 2 === 1) {
      ps.addShape(pptx.ShapeType.rect, {
        x: MX, y: rowY, w: W - MX * 2, h: rowH,
        fill: { color: light }, line: { color: light },
      });
    }

    ps.addText(san(primary), {
      x: MX + 0.05, y: rowY, w: LABEL_W - 0.08, h: rowH,
      fontSize: 10, bold: true, color: NAVY, valign: "middle",
    });

    // Track background
    ps.addShape(pptx.ShapeType.rect, {
      x: BAR_X, y: barY, w: BAR_AREA_W, h: barH,
      fill: { color: "E2E8F0" }, line: { color: "CBD5E1", pt: 0.5 },
    });

    // Phase bar
    ps.addShape(pptx.ShapeType.rect, {
      x: barStartX, y: barY, w: barW, h: barH,
      fill: { color: acc }, line: { color: acc },
    });

    if (secondary) {
      ps.addText(san(secondary), {
        x: barStartX + 0.06, y: barY, w: Math.max(barW - 0.1, 0.4), h: barH,
        fontSize: 8.5, color: WHITE, valign: "middle",
      });
    }

    cumOffset += dur;
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: SPLIT HIGHLIGHT ───────────────────────────────────────────────
// First bullet as full-width accent hero box + remaining bullets as a compact list.

function renderSplitHighlight(pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);

  const bullets = slide.bullets;
  if (bullets.length === 0) {
    ps.addNotes(san(slide.speaker_notes));
    return;
  }

  const contentH = CE - CS;
  const heroH = contentH * 0.38;
  const listY = CS + heroH + 0.1;
  const listH = CE - listY;

  const [hero, ...rest] = bullets;
  const { primary: heroPrimary, secondary: heroSecondary } = parseBullet(hero);

  // Hero accent banner
  ps.addShape(pptx.ShapeType.rect, { x: 0.4, y: CS, w: W - 0.8, h: heroH, fill: { color: acc }, line: { color: acc } });
  ps.addShape(pptx.ShapeType.rect, { x: 0.4, y: CS, w: 0.1, h: heroH, fill: { color: light }, line: { color: light } });

  if (heroSecondary) {
    ps.addText(san(heroPrimary), {
      x: 0.65, y: CS + 0.04, w: W - 1.15, h: heroH * 0.54,
      fontSize: 13, bold: true, color: WHITE, valign: "bottom",
    });
    ps.addText(san(heroSecondary), {
      x: 0.65, y: CS + heroH * 0.54, w: W - 1.15, h: heroH * 0.38,
      fontSize: 10, color: light, valign: "top",
    });
  } else {
    ps.addText(san(heroPrimary), {
      x: 0.65, y: CS, w: W - 1.15, h: heroH,
      fontSize: 13, bold: true, color: WHITE, valign: "middle",
    });
  }

  if (rest.length === 0) {
    ps.addNotes(san(slide.speaker_notes));
    return;
  }

  // Secondary list
  const n = rest.length;
  const itemH = Math.min(listH / Math.max(n, 1), 0.84);

  rest.forEach((b, i) => {
    const by = listY + i * itemH;
    const { primary, secondary } = parseBullet(b);
    const dotD = 0.1;

    ps.addShape(pptx.ShapeType.ellipse, {
      x: 0.44, y: by + (itemH - dotD) / 2, w: dotD, h: dotD,
      fill: { color: acc }, line: { color: acc },
    });

    if (secondary) {
      ps.addText(san(primary), {
        x: 0.67, y: by + 0.04, w: W - 1.12, h: itemH * 0.52,
        fontSize: 10.5, bold: true, color: NAVY, valign: "bottom",
      });
      ps.addText(san(secondary), {
        x: 0.67, y: by + itemH * 0.52, w: W - 1.12, h: itemH * 0.42,
        fontSize: 9, color: TEXT, valign: "top",
      });
    } else {
      ps.addText(san(b), {
        x: 0.67, y: by, w: W - 1.12, h: itemH,
        fontSize: 10.5, color: TEXT, valign: "middle",
      });
    }
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── LAYOUT: METRIC TILES ──────────────────────────────────────────────────
// Grid of white tiles with large numeric value + label strip at bottom.
// Uses parseMetric() to extract value+unit; falls back to card-grid style
// when no leading number is detected.

function renderMetricTiles(pptx: PptxGenJS, slide: BriefSlide, acc: string, light: string, bg: string): void {
  const ps = pptx.addSlide();
  drawBg(ps, pptx, bg);
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const bullets = slide.bullets;
  const n = bullets.length;
  const COLS = n <= 2 ? n : Math.min(n, 3);
  const ROWS = Math.ceil(n / COLS);
  const MX = 0.4;
  const GAP = 0.2;
  const tileW = (W - MX * 2 - GAP * (COLS - 1)) / COLS;
  const availH = CE - cY - 0.04;
  const tileH = Math.min((availH - GAP * (ROWS - 1)) / ROWS, 1.88);
  const totalH = ROWS * tileH + (ROWS - 1) * GAP;
  const startY = cY + Math.max(0, (availH - totalH) / 2);

  bullets.forEach((b, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const isLastAlone = n % COLS !== 0 && i === n - 1 && COLS > 1;
    const tx = MX + col * (tileW + GAP);
    const ty = startY + row * (tileH + GAP);
    const thisW = isLastAlone ? W - MX * 2 : tileW;
    const metric = parseMetric(b);
    const LABEL_H = tileH * 0.32;

    ps.addShape(pptx.ShapeType.rect, { x: tx, y: ty, w: thisW, h: tileH, fill: { color: WHITE }, line: { color: "CBD5E1", pt: 0.75 } });
    ps.addShape(pptx.ShapeType.rect, { x: tx, y: ty, w: thisW, h: 0.1, fill: { color: acc }, line: { color: acc } });
    ps.addShape(pptx.ShapeType.rect, { x: tx, y: ty + tileH - LABEL_H, w: thisW, h: LABEL_H, fill: { color: light }, line: { color: light } });

    if (metric) {
      ps.addText(san(metric.value), {
        x: tx + 0.06, y: ty + 0.1, w: thisW - 0.12, h: tileH - LABEL_H - 0.1,
        fontSize: 30, bold: true, color: acc, align: "center", valign: "middle",
      });
      ps.addText(san(metric.label), {
        x: tx + 0.08, y: ty + tileH - LABEL_H, w: thisW - 0.16, h: LABEL_H,
        fontSize: 9, color: NAVY, align: "center", valign: "middle",
      });
    } else {
      const { primary, secondary } = parseBullet(b);
      if (secondary) {
        ps.addText(san(primary), {
          x: tx + 0.1, y: ty + 0.12, w: thisW - 0.2, h: tileH - LABEL_H - 0.12,
          fontSize: 11, bold: true, color: NAVY, align: "center", valign: "bottom",
        });
        ps.addText(san(secondary), {
          x: tx + 0.08, y: ty + tileH - LABEL_H, w: thisW - 0.16, h: LABEL_H,
          fontSize: 9, color: NAVY, align: "center", valign: "middle",
        });
      } else {
        ps.addText(san(b), {
          x: tx + 0.08, y: ty + 0.1, w: thisW - 0.16, h: tileH - 0.1,
          fontSize: 11, color: TEXT, align: "center", valign: "middle",
        });
      }
    }
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── Layout dispatcher ─────────────────────────────────────────────────────

type LayoutRenderer = (
  pptx: PptxGenJS,
  slide: BriefSlide,
  acc: string,
  light: string,
  bg: string,
) => void;

const LAYOUT_RENDERERS: Record<string, LayoutRenderer> = {
  list:              renderList,
  "card-grid":       renderCardGrid,
  "two-panel":       renderTwoPanel,
  "row-cards":       renderRowCards,
  "phase-blocks":    renderPhaseBlocks,
  "insight-boxes":   renderInsightBoxes,
  "chevron-flow":    renderChevronFlow,
  "timeline-bars":   renderTimelineBars,
  "split-highlight": renderSplitHighlight,
  "metric-tiles":    renderMetricTiles,
};

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

    const [acc, light] = ACCENTS[slide.type] ?? ACCENTS.context;
    const bg = BG_COLORS[slide.type] ?? "F8FAFC";
    const layout = slide.layout ?? "list"; // fallback if Claude omits the field

    const renderer = LAYOUT_RENDERERS[layout] ?? renderList;
    renderer(pptx, slide, acc, light, bg);
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}
