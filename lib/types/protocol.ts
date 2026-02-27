export type StudyType =
  | "exploratory_interview"
  | "moderated_usability"
  | "unmoderated_usability"
  | "survey"
  | "diary_study";

export type SectionType = "intro" | "warmup" | "tasks" | "debrief";

export interface ProtocolQuestion {
  text: string;
  modality: string;
  options?: string[];
}

export interface ProtocolSection {
  type: SectionType;
  title: string;
  duration_minutes: number;
  script: string;
  questions: ProtocolQuestion[];
  tips: string;
}

export interface ProtocolTask {
  task: string;
  scenario: string;
  success_criteria: string;
  behavioral_metrics?: string[];
  declarative_metrics?: ProtocolQuestion[];
}

export interface Protocol {
  study_type: StudyType;
  title: string;
  duration_minutes: number;
  sections: ProtocolSection[];
  tasks: ProtocolTask[];
  observer_guide: string;
  consent_note: string;
  materials_needed: string[];
}

export interface ProtocolFormValues {
  studyType: StudyType;
  objective: string;
  audience: string;
  duration: number;
  participants: number;
}
