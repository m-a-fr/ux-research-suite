export type UsabilityPlatform = "web" | "mobile" | "desktop";
export type PrototypeFidelity = "live_product" | "prototype_hifi" | "prototype_lowfi";
export type ThinkAloudStyle = "concurrent" | "retrospective" | "none";
export type ModeratedSectionType = "intro" | "warmup" | "tasks" | "debrief";

export interface ProbeQuestion {
  condition: string; // "Si le participant utilise la recherche au lieu du menu…"
  question: string;  // "Qu'est-ce qui vous a amené à utiliser la recherche ?"
}

export interface ModeratedSection {
  type: ModeratedSectionType;
  title: string;
  duration_minutes: number;
  script: string;
  questions: string[]; // open questions — no modality
  tips: string;
}

export interface ModeratedTask {
  task_number: number;
  task: string;
  scenario: string;
  success_criteria: string;
  time_limit_minutes: number;
  observer_cues: string[];
  post_task_questions: string[];
  probe_questions: ProbeQuestion[];
}

export interface ModeratedProtocol {
  study_type: "moderated_usability";
  title: string;
  product_name: string;
  platform: UsabilityPlatform;
  fidelity: PrototypeFidelity;
  think_aloud: ThinkAloudStyle;
  duration_minutes: number;
  sections: ModeratedSection[];
  tasks: ModeratedTask[];
  observer_guide: string;
  consent_note: string;
  materials_needed: string[];
}

// ─── Form ─────────────────────────────────────────────────────────────────

export interface ModeratedFormValues {
  studyType: "moderated_usability";
  objective: string;
  product_name: string;
  platform: UsabilityPlatform;
  fidelity: PrototypeFidelity;
  think_aloud: ThinkAloudStyle;
  audience: string;
  duration: number;
  participants: number;
}
