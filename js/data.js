import { K, saveJSON } from './storage.js?v=12';
import { state } from './state.js?v=12';

export const PRESET_PROGRESS = {};

export function starStr(n) {
  n = Math.max(1, Math.min(5, Number(n) || 1));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function defaultProgressFor(id) {
  const preset = PRESET_PROGRESS[id];
  if (preset) return { ...preset };
  return { status: "Not Started", revision: false, confidence: 0, attempts: 0, timeTaken: 0, lastSolved: "", favorite: false, notes: "" };
}

export async function loadQuestionsData(dbUserData = null) {
  const response = await fetch('./data/questions.json');
  const data = await response.json();
  state.rawQuestions = data;

  state.totalTopics = [...new Set(data.map(q => q.topic))].sort();
  state.totalPatterns = [...new Set(data.map(q => q.pattern))].sort();
  state.totalPlatforms = [...new Set(data.map(q => q.platform))].sort();

  saveJSON(K.questions, data.map(q => ({ id: q.id, title: q.title })));

  // Apply DB loaded data if available
  if (dbUserData) {
    if (dbUserData.progress) state.progress = dbUserData.progress;
    if (dbUserData.notesStore) state.notesStore = dbUserData.notesStore;
    if (dbUserData.activity) state.activity = dbUserData.activity;
    if (dbUserData.settings) {
      state.settings = { ...state.settings, ...dbUserData.settings };
    }
    if (dbUserData.dailyGoal) {
      state.dailyGoal = { ...state.dailyGoal, ...dbUserData.dailyGoal };
    }
  }

  // Non-destructive merging:
  // Existing questions keep their progress; missing questions get default progress.
  data.forEach(q => {
    if (!state.progress[q.id]) {
      state.progress[q.id] = defaultProgressFor(q.id);
    }
  });

  data.forEach(q => {
    if (state.notesStore[q.id] === undefined && state.progress[q.id] && state.progress[q.id].notes) {
      state.notesStore[q.id] = state.progress[q.id].notes;
    }
  });
}

export function getQuestions() {
  return state.rawQuestions.map(q => ({
    ...q,
    ...(state.progress[q.id] || defaultProgressFor(q.id)),
    notes: state.notesStore[q.id] || ""
  }));
}
