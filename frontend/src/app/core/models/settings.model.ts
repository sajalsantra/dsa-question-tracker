export interface UiSettings {
  dashboardGroupOpen: boolean;
  insightsOpen: boolean;
  streakGoalOpen: boolean;
  analyticsOpen: boolean;
  filtersOpen: boolean;
  questionsOpen: boolean;
  revOpen: boolean;
  dataMgmtOpen: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  geminiApiKey?: string;
  openAiApiKey?: string;
  aiProvider?: 'gemini' | 'openai';
  ui: UiSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  geminiApiKey: 'AQ.Ab8RN6JoHMw3cwsPe3kIkBkwTBhRQX2KZHj8Q1d2TsRAeDf4jw',
  openAiApiKey: '',
  aiProvider: 'gemini',
  ui: {
    dashboardGroupOpen: true,
    insightsOpen: true,
    streakGoalOpen: true,
    analyticsOpen: true,
    filtersOpen: true,
    questionsOpen: true,
    revOpen: true,
    dataMgmtOpen: true,
  },
};
