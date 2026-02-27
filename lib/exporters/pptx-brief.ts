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

// Accent color [main, light] per slide type
const ACCENTS: Record<string, [string, string]> = {
  cover:        ["3B82F6", "1E3A5F"],
  context:      ["475569", "F1F5F9"],
  objectives:   ["2563EB", "DBEAFE"],
  methodology:  ["7C3AED", "EDE9FE"],
  participants: ["0D9488", "CCFBF1"],
  timeline:     ["B45309", "FEF3C7"],
  deliverables: ["059669", "D1FAE5"],
  decisions:    ["DC2626", "FEE2E2"],
  next_steps:   ["4F46E5", "EEF2FF"],
};

// ─── Shared drawing primitives ─────────────────────────────────────────────

type Slide = ReturnType<PptxGenJS["addSlide"]>;

function drawBg(ps: Slide, pptx: PptxGenJS, color: string) {
  ps.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color }, line: { color } });
}

function drawHeader(ps: Slide, pptx: PptxGenJS, slide: BriefSlide, acc: string) {
  // Navy bar
  ps.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: HDR_H, fill: { color: NAVY }, line: { color: NAVY } });
  // Slide number badge (ellipse)
  ps.addShape(pptx.ShapeType.ellipse, { x: 0.18, y: 0.22, w: 0.32, h: 0.32, fill: { color: acc }, line: { color: acc } });
  ps.addText(String(slide.slide_number), {
    x: 0.18, y: 0.22, w: 0.32, h: 0.32,
    fontSize: 9, bold: true, color: WHITE, align: "center", valign: "middle",
  });
  // Title
  ps.addText(san(slide.title), {
    x: 0.62, y: 0, w: W - 0.77, h: HDR_H,
    fontSize: 16, bold: true, color: WHITE, valign: "middle",
  });
}

// Returns next Y after the body highlight box (or CS if no body)
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

// ─── COVER ─────────────────────────────────────────────────────────────────
// Layout: full navy bg, dark right panel, big title left, bullets as metadata right

function renderCover(pptx: PptxGenJS, slide: BriefSlide, brief: Brief): void {
  const ps = pptx.addSlide();
  const PANEL_X = 7.4;
  const panelW = W - PANEL_X;

  // Backgrounds
  ps.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: NAVY }, line: { color: NAVY } });
  ps.addShape(pptx.ShapeType.rect, { x: PANEL_X, y: 0, w: panelW, h: H, fill: { color: "162D4A" }, line: { color: "162D4A" } });

  // Blue left accent bar
  ps.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.1, h: H, fill: { color: "3B82F6" }, line: { color: "3B82F6" } });
  // Blue horizontal rule
  ps.addShape(pptx.ShapeType.rect, { x: 0.1, y: 2.58, w: PANEL_X - 0.3, h: 0.04, fill: { color: "3B82F6" }, line: { color: "3B82F6" } });
  // Right panel top accent
  ps.addShape(pptx.ShapeType.rect, { x: PANEL_X, y: 0, w: panelW, h: 0.07, fill: { color: "3B82F6" }, line: { color: "3B82F6" } });

  // Title
  ps.addText(san(slide.title), {
    x: 0.35, y: 0.75, w: PANEL_X - 0.55, h: 1.7,
    fontSize: 28, bold: true, color: WHITE, valign: "bottom",
  });

  // Body / subtitle
  if (slide.body) {
    ps.addText(san(slide.body), {
      x: 0.35, y: 2.7, w: PANEL_X - 0.55, h: 0.65,
      fontSize: 12, color: "93C5FD", valign: "top",
    });
  }

  // Right panel: bullets as vertical metadata items
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

  // Date bottom left
  ps.addText(san(brief.generated_date), {
    x: 0.35, y: H - 0.42, w: 3, h: 0.28,
    fontSize: 9, color: "64748B",
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── CONTEXT ───────────────────────────────────────────────────────────────
// Layout: left-border accent bar on each bullet

function renderContext(pptx: PptxGenJS, slide: BriefSlide): void {
  const ps = pptx.addSlide();
  const [acc, light] = ACCENTS.context;

  drawBg(ps, pptx, "F8FAFC");
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const n = slide.bullets.length;
  const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.9);

  slide.bullets.forEach((b, i) => {
    const by = cY + i * itemH;
    ps.addShape(pptx.ShapeType.rect, { x: 0.4, y: by + 0.1, w: 0.055, h: itemH - 0.22, fill: { color: "3B82F6" }, line: { color: "3B82F6" } });
    ps.addText(san(b), { x: 0.6, y: by, w: W - 1.05, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── OBJECTIVES ────────────────────────────────────────────────────────────
// Layout: numbered ellipse badges

function renderObjectives(pptx: PptxGenJS, slide: BriefSlide): void {
  const ps = pptx.addSlide();
  const [acc, light] = ACCENTS.objectives;

  drawBg(ps, pptx, "F8FAFC");
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const n = slide.bullets.length;
  const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.9);
  const badge = Math.min(itemH * 0.52, 0.4);

  slide.bullets.forEach((b, i) => {
    const by = cY + i * itemH;
    const cy = by + (itemH - badge) / 2;
    ps.addShape(pptx.ShapeType.ellipse, { x: 0.4, y: cy, w: badge, h: badge, fill: { color: acc }, line: { color: acc } });
    ps.addText(String(i + 1), { x: 0.4, y: cy, w: badge, h: badge, fontSize: Math.round(badge * 22), bold: true, color: WHITE, align: "center", valign: "middle" });
    ps.addText(san(b), { x: 0.4 + badge + 0.14, y: by, w: W - 0.4 - badge - 0.55, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── METHODOLOGY ───────────────────────────────────────────────────────────
// Layout: large body highlight (method name) + diamond bullet points

function renderMethodology(pptx: PptxGenJS, slide: BriefSlide): void {
  const ps = pptx.addSlide();
  const [acc, light] = ACCENTS.methodology;

  drawBg(ps, pptx, "FAFAFA");
  drawHeader(ps, pptx, slide, acc);

  let cY = CS;
  if (slide.body) {
    const mh = 0.72;
    ps.addShape(pptx.ShapeType.rect, { x: 0.4, y: CS, w: W - 0.8, h: mh, fill: { color: light }, line: { color: acc, pt: 1.5 } });
    ps.addShape(pptx.ShapeType.rect, { x: 0.4, y: CS, w: 0.08, h: mh, fill: { color: acc }, line: { color: acc } });
    ps.addText(san(slide.body), { x: 0.6, y: CS, w: W - 1.15, h: mh, fontSize: 12, bold: true, color: NAVY, valign: "middle" });
    cY = CS + mh + 0.15;
  }

  const n = slide.bullets.length;
  const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.82);
  const dsize = 0.2;

  slide.bullets.forEach((b, i) => {
    const by = cY + i * itemH;
    const dy = by + (itemH - dsize) / 2;
    ps.addShape(pptx.ShapeType.diamond, { x: 0.42, y: dy, w: dsize, h: dsize, fill: { color: acc }, line: { color: acc } });
    ps.addText(san(b), { x: 0.75, y: by, w: W - 1.2, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── PARTICIPANTS ──────────────────────────────────────────────────────────
// Layout: two-column grid with teal square bullets + vertical separator

function renderParticipants(pptx: PptxGenJS, slide: BriefSlide): void {
  const ps = pptx.addSlide();
  const [acc, light] = ACCENTS.participants;

  drawBg(ps, pptx, "F0FDFA");
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const bullets = slide.bullets;
  const half = Math.ceil(bullets.length / 2);
  const colW = (W - 1.0) / 2;
  const availH = CE - cY;
  const itemH = Math.min(availH / Math.max(half, 1), 0.9);
  const sq = 0.14;

  // Column separator
  if (bullets.length > 1) {
    ps.addShape(pptx.ShapeType.rect, { x: 0.4 + colW + 0.07, y: cY, w: 0.01, h: CE - cY, fill: { color: "D1FAE5" }, line: { color: "D1FAE5" } });
  }

  bullets.forEach((b, i) => {
    const col = i < half ? 0 : 1;
    const row = i < half ? i : i - half;
    const bx = 0.4 + col * (colW + 0.15);
    const by = cY + row * itemH;
    ps.addShape(pptx.ShapeType.rect, { x: bx, y: by + (itemH - sq) / 2, w: sq, h: sq, fill: { color: acc }, line: { color: acc } });
    ps.addText(san(b), { x: bx + sq + 0.1, y: by, w: colW - sq - 0.15, h: itemH, fontSize: 10.5, color: TEXT, valign: "middle" });
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── TIMELINE ──────────────────────────────────────────────────────────────
// Layout: horizontal colored blocks (≤5 items) or vertical numbered list

function renderTimeline(pptx: PptxGenJS, slide: BriefSlide): void {
  const ps = pptx.addSlide();
  const [acc, light] = ACCENTS.timeline;

  drawBg(ps, pptx, "FFFBEB");
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const bullets = slide.bullets;
  const n = bullets.length;

  if (n <= 5) {
    // Horizontal phase blocks with gradient-like progression
    const blockW = (W - 0.9) / n;
    const blockH = CE - cY;
    const blockColors = ["1E3A5F", "1D4ED8", "2563EB", "3B82F6", "60A5FA"];
    const textFs = n <= 3 ? 9.5 : n === 4 ? 8.5 : 8;

    bullets.forEach((b, i) => {
      const bx = 0.45 + i * blockW;
      const col = blockColors[i % blockColors.length];
      // Block
      ps.addShape(pptx.ShapeType.rect, { x: bx, y: cY, w: blockW - 0.06, h: blockH, fill: { color: col }, line: { color: WHITE, pt: 1.5 } });
      // Phase number (large, top of block)
      ps.addText(String(i + 1), { x: bx, y: cY + 0.06, w: blockW - 0.06, h: 0.5, fontSize: 22, bold: true, color: WHITE, align: "center" });
      // Phase text (below number)
      ps.addText(san(b), { x: bx + 0.06, y: cY + 0.6, w: blockW - 0.18, h: blockH - 0.65, fontSize: textFs, color: WHITE, align: "center", valign: "top" });
    });
  } else {
    // Vertical list: circle badge + connector line + text
    const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.78);
    const badge = 0.3;
    const cx = 0.4 + badge / 2;

    bullets.forEach((b, i) => {
      const by = cY + i * itemH;
      // Connector line (not after last)
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

// ─── DELIVERABLES ──────────────────────────────────────────────────────────
// Layout: checkbox squares + alternating row backgrounds

function renderDeliverables(pptx: PptxGenJS, slide: BriefSlide): void {
  const ps = pptx.addSlide();
  const [acc, light] = ACCENTS.deliverables;

  drawBg(ps, pptx, "F0FDF4");
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const n = slide.bullets.length;
  const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.92);
  const ck = Math.min(itemH * 0.42, 0.34);

  slide.bullets.forEach((b, i) => {
    const by = cY + i * itemH;
    // Alternating row tint
    if (i % 2 === 0) {
      ps.addShape(pptx.ShapeType.rect, { x: 0.35, y: by + 0.04, w: W - 0.7, h: itemH - 0.08, fill: { color: "DCFCE7" }, line: { color: "DCFCE7" } });
    }
    // Checkbox (filled square)
    const cy = by + (itemH - ck) / 2;
    ps.addShape(pptx.ShapeType.rect, { x: 0.42, y: cy, w: ck, h: ck, fill: { color: acc }, line: { color: acc } });
    ps.addText("v", { x: 0.42, y: cy, w: ck, h: ck, fontSize: Math.round(ck * 18), bold: true, color: WHITE, align: "center", valign: "middle" });
    ps.addText(san(b), { x: 0.42 + ck + 0.12, y: by, w: W - 0.42 - ck - 0.55, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── DECISIONS ─────────────────────────────────────────────────────────────
// Layout: rightArrow shapes + alternating row backgrounds

function renderDecisions(pptx: PptxGenJS, slide: BriefSlide): void {
  const ps = pptx.addSlide();
  const [acc, light] = ACCENTS.decisions;

  drawBg(ps, pptx, "FFF5F5");
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const n = slide.bullets.length;
  const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.85);
  const arrowH = Math.min(itemH * 0.38, 0.3);
  const arrowW = arrowH * 1.15;

  slide.bullets.forEach((b, i) => {
    const by = cY + i * itemH;
    const ay = by + (itemH - arrowH) / 2;
    // Alternating row tint
    if (i % 2 === 0) {
      ps.addShape(pptx.ShapeType.rect, { x: 0.35, y: by + 0.03, w: W - 0.7, h: itemH - 0.06, fill: { color: "FEE2E2" }, line: { color: "FEE2E2" } });
    }
    // Arrow
    ps.addShape(pptx.ShapeType.rightArrow, { x: 0.4, y: ay, w: arrowW, h: arrowH, fill: { color: acc }, line: { color: acc } });
    ps.addText(san(b), { x: 0.4 + arrowW + 0.12, y: by, w: W - 0.4 - arrowW - 0.55, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── NEXT STEPS ────────────────────────────────────────────────────────────
// Layout: numbered ellipse badges with vertical connector dots

function renderNextSteps(pptx: PptxGenJS, slide: BriefSlide): void {
  const ps = pptx.addSlide();
  const [acc, light] = ACCENTS.next_steps;

  drawBg(ps, pptx, "F5F3FF");
  drawHeader(ps, pptx, slide, acc);
  const cY = drawBody(ps, pptx, slide, acc, light);

  const n = slide.bullets.length;
  const itemH = Math.min((CE - cY) / Math.max(n, 1), 0.92);
  const badge = Math.min(itemH * 0.48, 0.38);
  const cx = 0.4 + badge / 2;

  slide.bullets.forEach((b, i) => {
    const by = cY + i * itemH;
    const cy = by + (itemH - badge) / 2;
    // Connector line between steps
    if (i < n - 1) {
      ps.addShape(pptx.ShapeType.rect, { x: cx - 0.012, y: cy + badge, w: 0.024, h: itemH - badge, fill: { color: "A5B4FC" }, line: { color: "A5B4FC" } });
    }
    // Badge
    ps.addShape(pptx.ShapeType.ellipse, { x: 0.4, y: cy, w: badge, h: badge, fill: { color: acc }, line: { color: acc } });
    ps.addText(String(i + 1), { x: 0.4, y: cy, w: badge, h: badge, fontSize: Math.round(badge * 20), bold: true, color: WHITE, align: "center", valign: "middle" });
    ps.addText(san(b), { x: 0.4 + badge + 0.15, y: by, w: W - 0.4 - badge - 0.55, h: itemH, fontSize: 11, color: TEXT, valign: "middle" });
  });

  ps.addNotes(san(slide.speaker_notes));
}

// ─── Dispatcher ────────────────────────────────────────────────────────────

type Renderer = (pptx: PptxGenJS, slide: BriefSlide, brief: Brief) => void;

const RENDERERS: Record<string, Renderer> = {
  cover:        (pptx, slide, brief) => renderCover(pptx, slide, brief),
  context:      (pptx, slide) => renderContext(pptx, slide),
  objectives:   (pptx, slide) => renderObjectives(pptx, slide),
  methodology:  (pptx, slide) => renderMethodology(pptx, slide),
  participants: (pptx, slide) => renderParticipants(pptx, slide),
  timeline:     (pptx, slide) => renderTimeline(pptx, slide),
  deliverables: (pptx, slide) => renderDeliverables(pptx, slide),
  decisions:    (pptx, slide) => renderDecisions(pptx, slide),
  next_steps:   (pptx, slide) => renderNextSteps(pptx, slide),
};

// ─── Main export ───────────────────────────────────────────────────────────

export async function generateBriefPptx(brief: Brief): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = san(brief.project_title);
  pptx.subject = "Brief stakeholders -- User Research Suite";
  pptx.author = "User Research Suite";

  for (const slide of brief.slides) {
    const renderer = RENDERERS[slide.type];
    if (renderer) renderer(pptx, slide, brief);
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}
