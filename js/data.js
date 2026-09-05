import { K, saveJSON } from './storage.js';
import { state } from './state.js';

export const PRESET_PROGRESS = {};

export function starStr(n) {
  n = Math.max(1, Math.min(5, Number(n) || 1));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function defaultProgressFor(id) {
  const preset = PRESET_PROGRESS[id];
  if (preset) return { ...preset };
  return { status: "Unsolved", revision: false, confidence: 0, attempts: 0, timeTaken: 0, lastSolved: "", favorite: false, notes: "" };
}

export async function loadQuestionsData() {
  const response = await fetch('./data/questions.json');
  const data = await response.json();
  state.rawQuestions = data;

  state.totalTopics = [...new Set(data.map(q => q.topic))].sort();
  state.totalPatterns = [...new Set(data.map(q => q.pattern))].sort();
  state.totalPlatforms = [...new Set(data.map(q => q.platform))].sort();

  saveJSON(K.questions, data.map(q => ({ id: q.id, title: q.title })));

  const DATASET_VERSION = "v3_clean_unsolved_reset";
  const storedVersion = localStorage.getItem("dsaDatasetVersion");
  if (storedVersion !== DATASET_VERSION) {
    state.progress = {};
    state.notesStore = {};
    state.activity = {};
    localStorage.setItem("dsaDatasetVersion", DATASET_VERSION);
  }

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
