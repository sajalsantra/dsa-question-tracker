export type QuestionStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Solved'
  | 'Needs Revision'
  | 'Mastered';

export interface QuestionProgress {
  questionId: number;
  status: QuestionStatus;
  confidence: number;   // 0–100
  attempts: number;
  timeTaken: number;    // minutes
  lastSolved: string | null; // ISO date YYYY-MM-DD
  revision: boolean;
  favorite: boolean;
  updatedAt: string;    // ISO datetime
}

export interface QuestionNote {
  questionId: number;
  notes: string;
  updatedAt: string;
}

/** Question enriched with its progress data — used in UI components */
export interface EnrichedQuestion {
  id: number;
  title: string;
  topic: string;
  pattern: string;
  platform: string;
  stars: number;
  problemUrl: string;
  // Progress fields (defaults when no progress recorded)
  status: QuestionStatus;
  confidence: number;
  attempts: number;
  timeTaken: number;
  lastSolved: string | null;
  revision: boolean;
  favorite: boolean;
}
