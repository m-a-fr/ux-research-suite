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

export interface BriefSlide {
  slide_number: number;
  type: BriefSlideType;
  /** Short title for PPTX header and slide identification. */
  title: string;
  /** Presenter coaching notes — rendered in PPTX speaker notes. */
  speaker_notes: string;
  /** Self-contained HTML fragment with inline styles — rendered in the browser viewer. */
  html: string;
}

export interface Brief {
  source_study_type: string;
  project_title: string;
  generated_date: string;
  slides: BriefSlide[];
}
