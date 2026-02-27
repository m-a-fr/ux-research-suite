export type SurveyQuestionType =
  | "likert"
  | "nps"
  | "csat"
  | "mcq_single"
  | "mcq_multiple"
  | "ranking"
  | "open_short"
  | "matrix"
  | "slider"
  | "demographic";

export type SurveyBlockType =
  | "screening"
  | "intro"
  | "demographics"
  | "thematic"
  | "standard_scale"
  | "closing";

export type StandardScaleName = "SUS" | "UMUX" | "NPS" | "CSAT";

export interface SurveyScaleLabels {
  min: string;
  max: string;
}

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  text: string;
  required: boolean;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
  scale_labels?: SurveyScaleLabels | null;
  matrix_rows?: string[] | null;
  is_screening?: boolean;
  skip_logic?: string;
  analysis_note?: string;
  randomize_options?: boolean;
}

export interface SurveyBlock {
  type: SurveyBlockType;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  randomize?: boolean;
  standard_scale_name?: StandardScaleName | null;
}

export interface Survey {
  study_type: "survey";
  title: string;
  estimated_completion_minutes: number;
  distribution_channel: string;
  blocks: SurveyBlock[];
  screening_criteria: string;
  consent_note: string;
}

// ─── Form types ───────────────────────────────────────────────────────────

export type SurveyDimension =
  | "satisfaction"
  | "nps"
  | "usability"
  | "awareness"
  | "friction"
  | "other";

export type SurveyStandardScale = "NPS" | "SUS" | "UMUX" | "CSAT" | "none";

export type SurveyDistributionChannel =
  | "email"
  | "in_app"
  | "qr_intercept"
  | "external_panel";

export type SurveyTargetDuration = "under_5" | "5_to_10" | "10_to_15";

export interface SurveyFormValues {
  studyType: "survey";
  research_questions: string;
  dimensions: SurveyDimension[];
  standard_scales: SurveyStandardScale[];
  needs_screening: boolean;
  screening_criteria: string;
  target_duration: SurveyTargetDuration;
  distribution_channel: SurveyDistributionChannel;
  audience: string;
}
