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
  ui: UiSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  ui: {
    dashboardGroupOpen: true,
    insightsOpen: true,
    streakGoalOpen: true,
    analyticsOpen: true,
    filtersOpen: true,
    questionsOpen: true,
    revOpen: true,
    dataMgmtOpen: true,
  }
};
