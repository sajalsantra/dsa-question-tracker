import { state, initState } from './state.js?v=12';
import { persistAll, loadUserDataFromDB } from './storage.js?v=12';
import { loadQuestionsData, getQuestions } from './data.js?v=12';
import { populateFilterDropdowns, setupFilterListeners } from './filters.js?v=12';
import { renderCharts } from './charts.js?v=12';
import { setupGoalListeners } from './streak.js?v=12';
import { setupModalListeners } from './modal.js?v=12';
import { setupExportImportListeners } from './export-import.js?v=12';
import { renderAll } from './rendering.js?v=12';
import { setupAuthUI } from './auth-ui.js?v=12';

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

export function updateToggleAllBtn() {
  const toggleBtn = document.getElementById("toggleAllSectionsBtn");
  if (!toggleBtn) return;

  const allExpanded = sectionConfig.every(cfg => state.settings.ui[cfg.key] !== false);

  if (allExpanded) {
    toggleBtn.textContent = "📁 Close All";
    toggleBtn.title = "Close all sections except Questions";
  } else {
    toggleBtn.textContent = "📂 Expand All";
    toggleBtn.title = "Expand all sections";
  }
}

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

  updateToggleAllBtn();
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

  // Primary data load callback (triggered initially and whenever user logs in/out)
  const reloadDataAndRender = async () => {
    const dbUserData = await loadUserDataFromDB();
    await loadQuestionsData(dbUserData);

    applyTheme();
    applyCollapsible();
    populateFilterDropdowns();
    renderAll(toast);
  };

  // Setup Auth UI and listener
  setupAuthUI(reloadDataAndRender);

  // Initial questions data load
  await loadQuestionsData(null);
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

  // Toggle All Sections (Smart Toggle: Expand All <-> Close All)
  const toggleAllBtn = document.getElementById("toggleAllSectionsBtn");
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener("click", () => {
      const allExpanded = sectionConfig.every(cfg => state.settings.ui[cfg.key] !== false);

      if (allExpanded) {
        // Currently all expanded -> Close All (except Questions)
        sectionConfig.forEach(cfg => {
          if (cfg.key === "questionsOpen") {
            state.settings.ui.questionsOpen = true; // Always remain open
          } else {
            state.settings.ui[cfg.key] = false;
          }
        });
        toast("Closed all sections except Questions 📁");
      } else {
        // At least one collapsed -> Expand All
        sectionConfig.forEach(cfg => {
          state.settings.ui[cfg.key] = true;
        });
        toast("Expanded all sections 📂");
      }

      persistAll(state);
      applyCollapsible();
      if (state.settings.ui.analyticsOpen) renderCharts(getQuestions());
    });
  }

  setupFilterListeners(() => renderAll(toast));
  setupGoalListeners(() => renderAll(toast));
  setupModalListeners(() => renderAll(toast), toast);
  setupExportImportListeners(() => renderAll(toast), toast, applyTheme, applyCollapsible);

  renderAll(toast);
}

document.addEventListener("DOMContentLoaded", init);

