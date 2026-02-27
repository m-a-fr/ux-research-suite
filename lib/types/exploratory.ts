export type InterviewStyle = "semi_directive" | "non_directive";

export interface ExploratoryTheme {
  theme: string;
  opening_question: string;
  probes: string[];
  sensitive: boolean;
}

export interface ExploratorySection {
  type: "intro" | "warmup" | "exploration" | "deepdive" | "debrief";
  title: string;
  duration_minutes: number;
  script: string;
  themes: ExploratoryTheme[];
  transition_note: string;
}

export interface ExploratoryProtocol {
  study_type: "exploratory_interview";
  title: string;
  duration_minutes: number;
  interview_style: InterviewStyle;
  sections: ExploratorySection[];
  observer_guide: string;
  consent_note: string;
  materials_needed: string[];
}

export interface ExploratoryFormValues {
  studyType: "exploratory_interview";
  themes: string;
  hypotheses: string;
  interview_style: InterviewStyle;
  sensitive_topics: string;
  audience: string;
  duration: number;
  participants: number;
}
