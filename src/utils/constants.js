/**
 * Application Constants
 * Ported from: js/state.js
 */

export const STATUSES = ["Not Started", "In Progress", "Solved", "Needs Revision", "Mastered"];

export const STATUS_EMOJI = {
  "Unsolved": "🔴",
  "Not Started": "🔴",
  "In Progress": "🟡",
  "Solved": "🟢",
  "Needs Revision": "🔵",
  "Mastered": "⭐"
};

export const PAGE_SIZE = 20;

export const filterIds = {
  fSearch: "search",
  fTopic: "topic",
  fDifficulty: "difficulty",
  fStatus: "status",
  fPattern: "pattern",
  fPlatform: "platform",
  fConfidence: "confidence",
  fFavorite: "favorite",
  fSort: "sort"
};

export const DEFAULT_FILTERS = {
  search: "",
  topic: "All",
  difficulty: "All",
  status: "All",
  pattern: "All",
  platform: "All",
  confidence: "All",
  favorite: "All",
  sort: "difficulty"
};

export const DEFAULT_UI_SETTINGS = {
  dashboardGroupOpen: true,
  insightsOpen: true,
  streakGoalOpen: true,
  analyticsOpen: true,
  filtersOpen: true,
  questionsOpen: true,
  revOpen: true,
  dataMgmtOpen: true
};

export const DEFAULT_SETTINGS = {
  theme: "dark",
  lastUpdated: null,
  ui: { ...DEFAULT_UI_SETTINGS }
};

export function todayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_DAILY_GOAL = {
  target: 5,
  date: todayStr(),
  count: 0
};

export const STORAGE_KEYS = {
  progress: "dsaProgress",
  notes: "dsaNotes",
  settings: "dsaSettings",
  activity: "dsaActivity",
  dailyGoal: "dsaDailyGoal",
  questions: "dsaQuestions",
  migrationDone: "dsaMigratedToFirestore"
};
