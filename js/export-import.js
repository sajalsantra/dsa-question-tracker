import { K, persistAll, todayStr } from './storage.js';
import { state } from './state.js';
import { getQuestions, defaultProgressFor } from './data.js';

export function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportJSON(showToast) {
  const data = {
    progress: state.progress,
    notes: state.notesStore,
    settings: state.settings,
    activity: state.activity,
    dailyGoal: state.dailyGoal,
    exportedAt: new Date().toISOString()
  };
  downloadFile("dsa-progress.json", JSON.stringify(data, null, 2), "application/json");
  if (showToast) showToast("Progress exported");
}

export function exportCSV(showToast) {
  const rows = [["Title", "Platform", "Topic", "Pattern", "Difficulty(Stars)", "Status", "Confidence", "Attempts", "TimeTaken", "LastSolved", "Favorite"]];
  getQuestions().forEach(q => rows.push([
    q.title, q.platform, q.topic, q.pattern, q.stars, q.status, q.confidence, q.attempts, q.timeTaken, q.lastSolved, q.favorite
  ]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadFile("dsa-progress.csv", csv, "text/csv");
  if (showToast) showToast("CSV exported");
}

export function setupExportImportListeners(onRenderAll, showToast, applyTheme, applyCollapsible) {
  const expJsonBtn = document.getElementById("exportJsonBtn");
  if (expJsonBtn) expJsonBtn.addEventListener("click", () => exportJSON(showToast));

  const expCsvBtn = document.getElementById("exportCsvBtn");
  if (expCsvBtn) expCsvBtn.addEventListener("click", () => exportCSV(showToast));

  const impBtn = document.getElementById("importBtn");
  const impFile = document.getElementById("importFile");

  if (impBtn && impFile) {
    impBtn.addEventListener("click", () => impFile.click());
    impFile.addEventListener("change", e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data.progress) state.progress = data.progress;
          if (data.notes) state.notesStore = data.notes;
          if (data.settings) state.settings = data.settings;
          if (data.activity) state.activity = data.activity;
          if (data.dailyGoal) state.dailyGoal = data.dailyGoal;
          if (!state.settings.ui) state.settings.ui = { analyticsOpen: true, filtersOpen: true };
          state.rawQuestions.forEach(q => {
            if (!state.progress[q.id]) state.progress[q.id] = defaultProgressFor(q.id);
          });
          persistAll(state);
          if (applyTheme) applyTheme();
          if (applyCollapsible) applyCollapsible();
          if (onRenderAll) onRenderAll();
          if (showToast) showToast("Progress imported successfully");
        } catch (err) {
          if (showToast) showToast("Import failed: invalid file");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
  }

  const handleReset = () => {
    if (confirm("This will permanently erase all saved progress, notes, favorites, streaks and goals (including the imported sheet progress). Continue?")) {
      localStorage.removeItem(K.progress);
      localStorage.removeItem(K.notes);
      localStorage.removeItem(K.activity);
      localStorage.removeItem(K.dailyGoal);
      state.progress = {};
      state.notesStore = {};
      state.activity = {};
      state.dailyGoal = { target: 5, date: todayStr(), count: 0 };
      state.rawQuestions.forEach(q => {
        state.progress[q.id] = defaultProgressFor(q.id);
      });
      persistAll(state);
      if (onRenderAll) onRenderAll();
      if (showToast) showToast("All progress has been reset");
    }
  };

  const resetProgBtn = document.getElementById("resetProgressBtn");
  if (resetProgBtn) resetProgBtn.addEventListener("click", handleReset);

  const resetAllBtn = document.getElementById("resetAllBtn");
  if (resetAllBtn) resetAllBtn.addEventListener("click", handleReset);
}
