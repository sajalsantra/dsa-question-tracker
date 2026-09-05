import { state, filterIds, PAGE_SIZE } from './state.js';

export function fillSelect(id, values) {
  const sel = document.getElementById(id);
  if (!sel) return;
  values.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}

export function populateFilterDropdowns() {
  fillSelect("fTopic", state.totalTopics);
  fillSelect("fPattern", state.totalPatterns);
  fillSelect("fPlatform", state.totalPlatforms);
}

export function setupFilterListeners(onFilterChange) {
  Object.keys(filterIds).forEach(elId => {
    const el = document.getElementById(elId);
    if (!el) return;
    const evt = elId === "fSearch" ? "input" : "change";
    el.addEventListener(evt, () => {
      state.filters[filterIds[elId]] = el.value;
      state.currentPage = 1;
      onFilterChange();
    });
  });

  const clearBtn = document.getElementById("clearFiltersBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      state.filters = { search: "", topic: "All", difficulty: "All", status: "All", pattern: "All", platform: "All", confidence: "All", favorite: "All", sort: "difficulty" };
      Object.keys(filterIds).forEach(elId => {
        const el = document.getElementById(elId);
        if (el) el.value = state.filters[filterIds[elId]];
      });
      state.currentPage = 1;
      onFilterChange();
    });
  }
}

export function applyFilters(list) {
  return list.filter(q => {
    if (state.filters.search) {
      const s = state.filters.search.toLowerCase();
      const hay = `${q.title} ${q.topic} ${q.pattern} ${q.platform}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (state.filters.topic !== "All" && q.topic !== state.filters.topic) return false;
    if (state.filters.difficulty !== "All" && q.stars !== Number(state.filters.difficulty)) return false;
    if (state.filters.status !== "All" && q.status !== state.filters.status) return false;
    if (state.filters.pattern !== "All" && q.pattern !== state.filters.pattern) return false;
    if (state.filters.platform !== "All" && q.platform !== state.filters.platform) return false;
    if (state.filters.favorite === "Favorites" && !q.favorite) return false;
    if (state.filters.confidence !== "All") {
      const [lo, hi] = state.filters.confidence.split("-").map(Number);
      if (q.confidence < lo || q.confidence > hi) return false;
    }
    return true;
  });
}

export function applySort(list) {
  const arr = [...list];
  switch (state.filters.sort) {
    case "difficulty": arr.sort((a, b) => a.stars - b.stars); break;
    case "recent": arr.sort((a, b) => (b.lastSolved || "").localeCompare(a.lastSolved || "")); break;
    case "confidence": arr.sort((a, b) => b.confidence - a.confidence); break;
    case "attempts": arr.sort((a, b) => b.attempts - a.attempts); break;
    case "topic": arr.sort((a, b) => a.topic.localeCompare(b.topic)); break;
    case "alpha": arr.sort((a, b) => a.title.localeCompare(b.title)); break;
  }
  return arr;
}

export function isRevisionFlagged(q) {
  return q.status !== "Mastered" && (q.status === "Needs Revision" || q.revision === true);
}
