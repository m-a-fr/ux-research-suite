import PptxGenJS from "pptxgenjs";
import { Brief, BriefSlide } from "@/lib/types/brief";

// ─── Palette ───────────────────────────────────────────────────────────────

const NAVY = "1E3A5F";
const BLUE = "3B82F6";
const LIGHT_BG = "F8FAFC";
const TEXT = "1F2937";
const MUTED = "6B7280";
const WHITE = "FFFFFF";

// ─── Slide dimensions (LAYOUT_16x9: 10 × 5.625 inches) ────────────────────

const W = 10;
const H = 5.625;

// ─── Cover slide ───────────────────────────────────────────────────────────

function addCoverSlide(pptx: PptxGenJS, slide: BriefSlide, brief: Brief): void {
  const s = pptx.addSlide();

  // Full navy background
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: H,
    fill: { color: NAVY },
    line: { color: NAVY },
  });

  // Decorative blue accent bar (left)
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 0.08, h: H,
    fill: { color: BLUE },
    line: { color: BLUE },
  });

  // Title
  s.addText(slide.title, {
    x: 0.6, y: 1.2, w: W - 1.2, h: 1.4,
    fontSize: 32,
    bold: true,
    color: WHITE,
    align: "center",
    valign: "middle",
  });

  // Body / subtitle
  if (slide.body) {
    s.addText(slide.body, {
      x: 0.6, y: 2.7, w: W - 1.2, h: 0.7,
      fontSize: 16,
      color: BLUE,
      align: "center",
      valign: "middle",
    });
  }

  // Bullets as meta info (horizontal, center)
  if (slide.bullets.length > 0) {
    const bulletText = slide.bullets.join("   ·   ");
    s.addText(bulletText, {
      x: 0.6, y: 3.5, w: W - 1.2, h: 0.5,
      fontSize: 12,
      color: "B0C4DE",
      align: "center",
      valign: "middle",
    });
  }

  // Date bottom right
  s.addText(brief.generated_date, {
    x: W - 2, y: H - 0.5, w: 1.8, h: 0.3,
    fontSize: 10,
    color: MUTED,
    align: "right",
  });

  // Speaker notes
  s.addNotes(slide.speaker_notes);
}

// ─── Content slide ─────────────────────────────────────────────────────────

function addContentSlide(pptx: PptxGenJS, slide: BriefSlide): void {
  const s = pptx.addSlide();

  // Light background
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: H,
    fill: { color: LIGHT_BG },
    line: { color: LIGHT_BG },
  });

  // Navy header bar
  s.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: W, h: 0.75,
    fill: { color: NAVY },
    line: { color: NAVY },
  });

  // Slide number badge
  s.addText(String(slide.slide_number), {
    x: 0.15, y: 0, w: 0.5, h: 0.75,
    fontSize: 11,
    color: BLUE,
    bold: true,
    valign: "middle",
    align: "center",
  });

  // Title in header
  s.addText(slide.title, {
    x: 0.65, y: 0, w: W - 0.8, h: 0.75,
    fontSize: 16,
    bold: true,
    color: WHITE,
    valign: "middle",
  });

  let contentY = 0.9;

  // Optional body paragraph
  if (slide.body) {
    s.addText(slide.body, {
      x: 0.45, y: contentY, w: W - 0.9, h: 0.55,
      fontSize: 11,
      color: MUTED,
      italic: true,
      valign: "top",
    });
    contentY += 0.65;
  }

  // Bullets
  if (slide.bullets.length > 0) {
    const bulletItems = slide.bullets.map((b) => ({
      text: b,
      options: { bullet: { type: "bullet" as const }, fontSize: 12, color: TEXT, paraSpaceAfter: 6 },
    }));

    const availableH = H - contentY - 0.35;
    s.addText(bulletItems, {
      x: 0.45, y: contentY, w: W - 0.9, h: availableH,
      valign: "top",
    });
  }

  // Speaker notes
  s.addNotes(slide.speaker_notes);
}

// ─── Main export function ──────────────────────────────────────────────────

export async function generateBriefPptx(brief: Brief): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = brief.project_title;
  pptx.subject = "Brief stakeholders — User Research Suite";
  pptx.author = "User Research Suite";

  for (const slide of brief.slides) {
    if (slide.type === "cover") {
      addCoverSlide(pptx, slide, brief);
    } else {
      addContentSlide(pptx, slide);
    }
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}
