import { K, loadJSON, todayStr } from './storage.js';

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

export const state = {
  rawQuestions: [],
  progress: {},
  notesStore: {},
  settings: {
    theme: "dark",
    filters: {},
    lastUpdated: null,
    ui: {
      dashboardGroupOpen: true,
      insightsOpen: true,
      streakGoalOpen: true,
      analyticsOpen: true,
      filtersOpen: true,
      questionsOpen: true,
      revOpen: true,
      dataMgmtOpen: true
    }
  },
  activity: {},
  dailyGoal: { target: 5, date: todayStr(), count: 0 },
  filters: {
    search: "",
    topic: "All",
    difficulty: "All",
    status: "All",
    pattern: "All",
    platform: "All",
    confidence: "All",
    favorite: "All",
    sort: "difficulty"
  },
  activeQuestionId: null,
  currentPage: 1,
  visibleCount: PAGE_SIZE,
  totalTopics: [],
  totalPatterns: [],
  totalPlatforms: []
};

export function initState() {
  state.progress = loadJSON(K.progress, {});
  state.notesStore = loadJSON(K.notes, {});
  state.settings = loadJSON(K.settings, {
    theme: "dark",
    filters: {},
    lastUpdated: null,
    ui: {
      dashboardGroupOpen: true,
      insightsOpen: true,
      streakGoalOpen: true,
      analyticsOpen: true,
      filtersOpen: true,
      questionsOpen: true,
      revOpen: true,
      dataMgmtOpen: true
    }
  });
  if (!state.settings.ui) {
    state.settings.ui = {
      dashboardGroupOpen: true,
      insightsOpen: true,
      streakGoalOpen: true,
      analyticsOpen: true,
      filtersOpen: true,
      questionsOpen: true,
      revOpen: true,
      dataMgmtOpen: true
    };
  } else {
    state.settings.ui = {
      dashboardGroupOpen: true,
      insightsOpen: true,
      streakGoalOpen: true,
      analyticsOpen: true,
      filtersOpen: true,
      questionsOpen: true,
      revOpen: true,
      dataMgmtOpen: true,
      ...state.settings.ui
    };
  }
  state.settings.ui.questionsOpen = true;
  state.activity = loadJSON(K.activity, {});
  state.dailyGoal = loadJSON(K.dailyGoal, { target: 5, date: todayStr(), count: 0 });
  state.currentPage = 1;
}

