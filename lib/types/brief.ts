export type BriefSlideType =
  | "cover"
  | "context"
  | "objectives"
  | "methodology"
  | "participants"
  | "timeline"
  | "deliverables"
  | "insights"
  | "next_steps";

/**
 * Layout chosen by Claude at generation time based on the slide content.
 * The exporter dispatches on this field — not on the slide type.
 * The slide type still determines the accent color palette.
 *
 * - list         : vertical list with accent bars (universal fallback)
 * - card-grid    : 2×N white cards with colored top bar — equal-weight items
 * - two-panel    : dark left spotlight (body) + light right bullets
 * - row-cards    : full-width numbered rows — sequential/ordered items
 * - phase-blocks : horizontal colored blocks — temporal sequences (≤5 phases)
 * - insight-boxes: full-width boxes with thick left accent — insights/éclairages
 */
export type BriefLayoutType =
  | "list"
  | "card-grid"
  | "two-panel"
  | "row-cards"
  | "phase-blocks"
  | "insight-boxes"
  | "chevron-flow"
  | "timeline-bars"
  | "split-highlight"
  | "metric-tiles";

export interface BriefSlide {
  slide_number: number;
  type: BriefSlideType;
  /** Layout chosen by Claude based on content — defaults to "list" if absent. */
  layout?: BriefLayoutType;
  title: string;
  body?: string;
  bullets: string[];
  speaker_notes: string;
}

export interface Brief {
  source_study_type: string;
  project_title: string;
  generated_date: string;
  slides: BriefSlide[];
}
