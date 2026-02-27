// ─── Shared enums ─────────────────────────────────────────────────────────

export type UnmoderatedTestDesign = "monadic" | "ab" | "benchmark";
export type ABDesign = "within" | "between";
export type BenchmarkType = "internal" | "competitive";

export type AutomatedMetric =
  | "completion_rate"
  | "time_on_task"
  | "click_count"
  | "misclick_rate"
  | "first_click"
  | "drop_off_point"
  | "heatmap"
  | "screen_recording";

export type PostTaskQuestionType =
  | "seq"
  | "likert_5"
  | "nps"
  | "open_short"
  | "mcq_single";

// ─── Shared building blocks ────────────────────────────────────────────────

export interface UnmoderatedPostTaskQuestion {
  type: PostTaskQuestionType;
  text: string;
  options: string[] | null;
  scale_labels: { min: string; max: string } | null;
}

export interface UnmoderatedTask {
  task_number: number;
  task_title: string;
  screen_text: string;
  starting_url: string | null;
  success_criteria: string;
  time_limit_minutes: number;
  automated_metrics: AutomatedMetric[];
  post_task_questions: UnmoderatedPostTaskQuestion[];
}

export interface UnmoderatedWelcomeBlock {
  title: string;
  screen_text: string;
}

export interface UnmoderatedClosingBlock {
  title: string;
  screen_text: string;
}

// ─── Monadic protocol ─────────────────────────────────────────────────────

export interface MonadicProtocol {
  study_type: "unmoderated_usability";
  test_design: "monadic";
  title: string;
  product_name: string;
  platform: "web" | "mobile" | "desktop";
  fidelity: "live_product" | "prototype_hifi" | "prototype_lowfi";
  tool: string;
  estimated_duration_minutes: number;
  welcome_block: UnmoderatedWelcomeBlock;
  tasks: UnmoderatedTask[];
  closing_block: UnmoderatedClosingBlock;
  screener_questions: string[];
  analysis_guide: string;
}

// ─── A/B protocol ─────────────────────────────────────────────────────────

export interface ABVariant {
  label: string;         // "A" | "B"
  product_name: string;
  description: string;   // brief description of what's different in this variant
  tasks: UnmoderatedTask[];
}

export interface ABProtocol {
  study_type: "unmoderated_usability";
  test_design: "ab";
  title: string;
  platform: "web" | "mobile" | "desktop";
  fidelity: "live_product" | "prototype_hifi" | "prototype_lowfi";
  tool: string;
  ab_design: ABDesign;
  counterbalancing: boolean;
  estimated_duration_minutes: number;
  welcome_block: UnmoderatedWelcomeBlock;
  variants: [ABVariant, ABVariant];
  // comparison_questions: only meaningful for within-subjects ([] for between)
  comparison_questions: UnmoderatedPostTaskQuestion[];
  closing_block: UnmoderatedClosingBlock;
  screener_questions: string[];
  analysis_guide: string;
}

// ─── Benchmark protocol ────────────────────────────────────────────────────

export interface BenchmarkProduct {
  name: string;
  role: "our_product" | "competitor" | "previous_version";
  tasks: UnmoderatedTask[];
  // Standard scale questions applied after all tasks for this product (SUS, UMUX-Lite, etc.)
  post_product_questions: UnmoderatedPostTaskQuestion[];
}

export interface BenchmarkProtocol {
  study_type: "unmoderated_usability";
  test_design: "benchmark";
  benchmark_type: BenchmarkType;
  title: string;
  platform: "web" | "mobile" | "desktop";
  fidelity: "live_product" | "prototype_hifi" | "prototype_lowfi";
  tool: string;
  estimated_duration_minutes: number;
  standard_scales: string[];     // e.g. ["SUS", "UMUX-Lite"]
  benchmark_context: string;     // why we're benchmarking and against what baseline
  welcome_block: UnmoderatedWelcomeBlock;
  products: BenchmarkProduct[];  // 2 to 5 products
  closing_block: UnmoderatedClosingBlock;
  screener_questions: string[];
  analysis_guide: string;
}

// ─── Union ────────────────────────────────────────────────────────────────

export type UnmoderatedProtocol = MonadicProtocol | ABProtocol | BenchmarkProtocol;

// ─── Form values ──────────────────────────────────────────────────────────

export interface MonadicFormValues {
  studyType: "unmoderated_usability";
  testDesign: "monadic";
  objective: string;
  product_name: string;
  platform: "web" | "mobile" | "desktop";
  fidelity: "live_product" | "prototype_hifi" | "prototype_lowfi";
  tool: string;
  audience: string;
  duration: number;
  participants: number;
}

export interface ABFormValues {
  studyType: "unmoderated_usability";
  testDesign: "ab";
  ab_design: ABDesign;
  variant_a_name: string;
  variant_a_description: string;
  variant_b_name: string;
  variant_b_description: string;
  platform: "web" | "mobile" | "desktop";
  fidelity: "live_product" | "prototype_hifi" | "prototype_lowfi";
  tool: string;
  audience: string;
  duration: number;
  participants: number;
}

export interface BenchmarkFormValues {
  studyType: "unmoderated_usability";
  testDesign: "benchmark";
  benchmark_type: BenchmarkType;
  products: Array<{ name: string; role: "our_product" | "competitor" | "previous_version" }>;
  standard_scales: string[];
  benchmark_context: string;
  platform: "web" | "mobile" | "desktop";
  fidelity: "live_product" | "prototype_hifi" | "prototype_lowfi";
  tool: string;
  audience: string;
  duration: number;
  participants: number;
}

export type UnmoderatedFormValues = MonadicFormValues | ABFormValues | BenchmarkFormValues;
