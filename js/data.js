import { K, saveJSON } from './storage.js';
import { state } from './state.js';

export const PRESET_PROGRESS = {};

export function starStr(n) {
  n = Math.max(1, Math.min(5, Number(n) || 1));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/**
 * Automatically calculate difficulty-aware confidence score (0 - 100).
 *
 * Difficulty factors (based on stars 1 to 5):
 * - Stars 1-2 (Easy): Attempt penalty = 18 pts/extra attempt. Time penalty = 0.7 pts/min.
 * - Star 3 (Medium): Attempt penalty = 14 pts/extra attempt. Time penalty = 0.5 pts/min.
 * - Stars 4-5 (Hard): Attempt penalty = 10 pts/extra attempt. Time penalty = 0.3 pts/min.
 */
export function calculateConfidence(attempts, timeTaken, stars = 3) {
  const att = Math.max(0, Number(attempts) || 0);
  const time = Math.max(0, Number(timeTaken) || 0);

  if (att === 0 && time === 0) return 0;

  const s = Math.max(1, Math.min(5, Number(stars) || 3));
  const a = Math.max(1, att);

  let attemptCoeff = 14;
  let timeCoeff = 0.5;

  if (s <= 2) {
    attemptCoeff = 18;
    timeCoeff = 0.7;
  } else if (s >= 4) {
    attemptCoeff = 10;
    timeCoeff = 0.3;
  }

  const attemptPenalty = (a - 1) * attemptCoeff;
  const timePenalty = Math.min(50, time * timeCoeff);

  const rawScore = 100 - attemptPenalty - timePenalty;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
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
  return state.rawQuestions.map(q => {
    const prog = state.progress[q.id] || defaultProgressFor(q.id);
    let confidence = Number(prog.confidence);
    if (isNaN(confidence) || (confidence === 0 && (prog.attempts > 0 || prog.timeTaken > 0))) {
      confidence = calculateConfidence(prog.attempts, prog.timeTaken, q.stars);
    }

    return {
      ...q,
      ...prog,
      confidence,
      notes: state.notesStore[q.id] || ""
    };
  });
}
