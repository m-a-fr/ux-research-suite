export type BriefSlideType =
  | "cover"
  | "context"
  | "objectives"
  | "methodology"
  | "participants"
  | "timeline"
  | "deliverables"
  | "eclairages"
  | "next_steps";

export interface BriefSlide {
  slide_number: number;
  type: BriefSlideType;
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
