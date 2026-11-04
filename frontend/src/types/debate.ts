export type EvidenceStatus = 'verified' | 'unverified' | 'opinion' | 'unavailable';
export type StrengthLabel = 'Decisive' | 'Strong' | 'Moderate' | 'Supporting';
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type DebateStyle = 'Simple' | 'Academic' | 'Persuasive';
export type ArgumentCount = 3 | 5 | 7;
export type DurationMinutes = 2 | 5 | 10;
export type SideFocus = 'Both' | 'FOR' | 'AGAINST';

export interface EvidenceItem {
  claim: string;
  status: EvidenceStatus;
  source_title?: string;
  publisher?: string;
  url?: string;
  publication_date?: string;
  explanation?: string;
}

export interface Argument {
  id: string;
  claim: string;
  logical_explanation: string;
  real_world_example: string;
  evidence_items: EvidenceItem[];
  strength_label: StrengthLabel;
}

export interface DebateSide {
  opening_statement: string;
  arguments: Argument[];
  concluding_statement: string;
}

export interface RebuttalItem {
  argument_id: string;
  original_claim: string;
  counter_challenge: string;
  logical_response: string;
  supporting_evidence: EvidenceItem;
  weak_point: string;
}

export interface ExpectedQuestion {
  question: string;
  suggested_answer: string;
}

export interface DebatePrep {
  opening_speech: string;
  closing_speech: string;
  duration_minutes: number;
  word_count: number;
  cross_examination_questions: string[];
  expected_questions: ExpectedQuestion[];
  checklist: string[];
}

export interface DebateInterpretation {
  interpreted_as: string;
  alternative_interpretations: string[];
  is_time_sensitive: boolean;
  category?: string;
}

export interface VerificationSummary {
  verified_count: number;
  unverified_count: number;
  opinion_count: number;
  unavailable_count: number;
  retrieval_date: string;
  search_engine_used: string;
}

export interface SourceItem {
  id?: string;
  title?: string;
  publisher?: string;
  url: string;
  published_date?: string;
  retrieved_at?: string;
  verified: boolean;
  status_label: string;
  snippet?: string;
}

export interface DebateSettings {
  difficulty: Difficulty;
  style: DebateStyle;
  argument_count: ArgumentCount;
  duration_minutes: DurationMinutes;
  side_focus: SideFocus;
  format?: string;
  language?: string;
}

export interface DebateResult {
  interpretation: DebateInterpretation;
  for_side: DebateSide;
  against_side: DebateSide;
  for_rebuttals: RebuttalItem[];
  against_rebuttals: RebuttalItem[];
  prep_for?: DebatePrep;
  prep_against?: DebatePrep;
  verification_summary: VerificationSummary;
  sources: SourceItem[];
}

export interface DebateRecord {
  id: string;
  topic: string;
  interpretation?: string;
  settings: DebateSettings;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage_message?: string;
  error_message?: string;
  result?: DebateResult;
  created_at: string;
  updated_at?: string;
}

export interface DebateSummary {
  id: string;
  topic: string;
  interpretation?: string;
  status: string;
  settings: DebateSettings;
  created_at: string;
  argument_count: number;
}

export interface DebateListResponse {
  items: DebateSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface HealthStatus {
  status: string;
  version: string;
  llm_configured: boolean;
  llm_provider: string;
  search_configured: boolean;
  search_provider: string;
  database: string;
}

export interface StreamEvent {
  stage: string;
  message: string;
  percent: number;
  partial_data?: any;
}
