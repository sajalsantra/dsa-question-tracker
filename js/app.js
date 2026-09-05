import { state, initState } from './state.js?v=10';
import { persistAll } from './storage.js?v=10';
import { loadQuestionsData, getQuestions } from './data.js?v=10';
import { populateFilterDropdowns, setupFilterListeners } from './filters.js?v=10';
import { renderCharts } from './charts.js?v=10';
import { setupGoalListeners } from './streak.js?v=10';
import { setupModalListeners } from './modal.js?v=10';
import { setupExportImportListeners } from './export-import.js?v=10';
import { renderAll } from './rendering.js?v=10';

let toastTimer;
export function toast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

export function applyTheme() {
  document.body.classList.toggle("light", state.settings.theme === "light");
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.textContent = state.settings.theme === "light" ? "☀️" : "🌙";
  }
}

const sectionConfig = [
  { bodyId: "insightsBody", btnId: "toggleInsightsBtn", key: "insightsOpen" },
  { bodyId: "streakGoalBody", btnId: "toggleStreakGoalBtn", key: "streakGoalOpen" },
  { bodyId: "analyticsBody", btnId: "toggleAnalyticsBtn", key: "analyticsOpen" },
  { bodyId: "filtersBody", btnId: "toggleFiltersBtn", key: "filtersOpen" },
  { bodyId: "questionsBody", btnId: "toggleQuestionsBtn", key: "questionsOpen" },
  { bodyId: "revBody", btnId: "toggleRevBtn", key: "revOpen" },
  { bodyId: "dataMgmtBody", btnId: "toggleDataMgmtBtn", key: "dataMgmtOpen" }
];

export function applyCollapsible() {
  sectionConfig.forEach(({ bodyId, btnId, key }) => {
    const body = document.getElementById(bodyId);
    const btn = document.getElementById(btnId);
    const isOpen = state.settings.ui[key] !== false; // Default to open if undefined

    if (body) {
      body.classList.toggle("collapsed", !isOpen);
    }
    if (btn) {
      btn.classList.toggle("open", isOpen);
    }
  });
}

function bindSectionToggle({ btnId, key, onOpen }) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener("click", () => {
    const nextState = !state.settings.ui[key];
    state.settings.ui[key] = nextState;
    persistAll(state);
    applyCollapsible();
    if (nextState && onOpen) onOpen();
  });
}

async function init() {
  initState();
  await loadQuestionsData();

  applyTheme();
  applyCollapsible();
  populateFilterDropdowns();

  const themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
      applyTheme();
      persistAll(state);
    });
  }

  // Bind section toggles
  sectionConfig.forEach(cfg => {
    bindSectionToggle({
      btnId: cfg.btnId,
      key: cfg.key,
      onOpen: cfg.key === "analyticsOpen" ? () => renderCharts(getQuestions()) : null
    });
  });

  // Expand All
  const expandAllBtn = document.getElementById("expandAllBtn");
  if (expandAllBtn) {
    expandAllBtn.addEventListener("click", () => {
      sectionConfig.forEach(cfg => {
        state.settings.ui[cfg.key] = true;
      });
      persistAll(state);
      applyCollapsible();
      if (state.settings.ui.analyticsOpen) renderCharts(getQuestions());
      toast("Expanded all sections 📂");
    });
  }

  // Close All (Questions section MUST remain open!)
  const closeAllBtn = document.getElementById("closeAllBtn");
  if (closeAllBtn) {
    closeAllBtn.addEventListener("click", () => {
      sectionConfig.forEach(cfg => {
        if (cfg.key === "questionsOpen") {
          state.settings.ui.questionsOpen = true; // Always remain open
        } else {
          state.settings.ui[cfg.key] = false;
        }
      });
      persistAll(state);
      applyCollapsible();
      toast("Closed all sections except Questions 📁");
    });
  }

  setupFilterListeners(() => renderAll(toast));
  setupGoalListeners(() => renderAll(toast));
  setupModalListeners(() => renderAll(toast), toast);
  setupExportImportListeners(() => renderAll(toast), toast, applyTheme, applyCollapsible);

  renderAll(toast);
}

document.addEventListener("DOMContentLoaded", init);
