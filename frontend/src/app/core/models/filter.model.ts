export interface QuestionFilters {
  search: string;
  topic: string;
  difficulty: string; // 'All' | '1' | '2' | '3' | '4' | '5'
  status: string;     // 'All' | QuestionStatus
  pattern: string;
  platform: string;
  confidence: string; // 'All' | '0-30' | '31-60' | '61-80' | '81-100'
  favorite: string;   // 'All' | 'Favorites'
  sort: SortOption;
}

export type SortOption =
  | 'difficulty'
  | 'recent'
  | 'confidence'
  | 'attempts'
  | 'topic'
  | 'alpha';

export const DEFAULT_FILTERS: QuestionFilters = {
  search: '',
  topic: 'All',
  difficulty: 'All',
  status: 'All',
  pattern: 'All',
  platform: 'All',
  confidence: 'All',
  favorite: 'All',
  sort: 'difficulty'
};
