export const K = {
  progress: "dsaProgress",
  notes: "dsaNotes",
  settings: "dsaSettings",
  activity: "dsaActivity",
  dailyGoal: "dsaDailyGoal",
  questions: "dsaQuestions"
};

export function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function saveJSON(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function persistAll(state) {
  saveJSON(K.progress, state.progress);
  saveJSON(K.notes, state.notesStore);
  saveJSON(K.settings, state.settings);
  saveJSON(K.activity, state.activity);
  saveJSON(K.dailyGoal, state.dailyGoal);
}
