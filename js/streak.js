import { state } from './state.js';
import { todayStr, persistAll, saveActivityDB, isAuthenticated } from './storage.js';

export function recordActivity() {
  const t = todayStr();
  state.activity[t] = (state.activity[t] || 0) + 1;
  if (isAuthenticated()) {
    saveActivityDB(t, state.activity[t]);
  }
}

export function computeStreaks() {
  const dates = Object.keys(state.activity).filter(d => state.activity[d] > 0).sort();
  if (dates.length === 0) return { current: 0, longest: 0 };
  const dateSet = new Set(dates);
  let longest = 0, run = 0, prev = null;
  dates.forEach(d => {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  });
  let current = 0;
  let cursor = new Date();
  while (true) {
    const ds = cursor.toISOString().slice(0, 10);
    if (dateSet.has(ds)) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (ds === todayStr()) {
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return { current, longest };
}

export function renderStreak() {
  const { current, longest } = computeStreaks();
  const curStreakEl = document.getElementById("curStreak");
  const longStreakEl = document.getElementById("longStreak");
  const hsStreakEl = document.getElementById("hsStreak");
  if (curStreakEl) curStreakEl.textContent = current;
  if (longStreakEl) longStreakEl.textContent = longest;
  if (hsStreakEl) hsStreakEl.textContent = current + " 🔥";

  const heat = document.getElementById("heatmap");
  if (!heat) return;
  const days = [];
  const cursor = new Date();
  for (let i = 181; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  heat.innerHTML = days.map(d => {
    const c = state.activity[d] || 0;
    let lvl = 0;
    if (c >= 1) lvl = 1;
    if (c >= 2) lvl = 2;
    if (c >= 4) lvl = 3;
    if (c >= 6) lvl = 4;
    return `<div class="heat-cell" data-lvl="${lvl}" title="${d}: ${c} solved"></div>`;
  }).join("");
}

export function refreshDailyGoalDate() {
  if (state.dailyGoal.date !== todayStr()) {
    state.dailyGoal.date = todayStr();
    state.dailyGoal.count = 0;
  }
}

export function renderGoal() {
  refreshDailyGoalDate();
  document.querySelectorAll(".goal-chip").forEach(chip => {
    chip.classList.toggle("active", Number(chip.dataset.goal) === state.dailyGoal.target);
  });
  const pct = Math.min(100, Math.round((state.dailyGoal.count / state.dailyGoal.target) * 100));
  const countTextEl = document.getElementById("goalCountText");
  const pctEl = document.getElementById("goalPct");
  const barFillEl = document.getElementById("goalBarFill");
  const noteEl = document.getElementById("goalNote");

  if (countTextEl) countTextEl.textContent = `${state.dailyGoal.count} / ${state.dailyGoal.target} Questions`;
  if (pctEl) pctEl.textContent = pct + "%";
  if (barFillEl) barFillEl.style.width = pct + "%";

  if (noteEl) {
    if (state.dailyGoal.count >= state.dailyGoal.target) {
      noteEl.textContent = "🎉 Goal Completed!";
      noteEl.classList.add("done");
    } else {
      const rem = state.dailyGoal.target - state.dailyGoal.count;
      noteEl.textContent = `${rem} question${rem !== 1 ? "s" : ""} remaining`;
      noteEl.classList.remove("done");
    }
  }
}

export function setupGoalListeners(onUpdate) {
  document.querySelectorAll(".goal-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      state.dailyGoal.target = Number(chip.dataset.goal);
      persistAll(state);
      renderGoal();
      if (onUpdate) onUpdate();
    });
  });
}
