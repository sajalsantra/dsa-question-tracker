import { state, STATUS_EMOJI, PAGE_SIZE } from './state.js';
import { getQuestions, starStr, defaultProgressFor } from './data.js';
import { applySort, applyFilters, isRevisionFlagged } from './filters.js';
import { renderCharts, computeTopicStats } from './charts.js';
import { renderStreak, renderGoal } from './streak.js';
import { openModal, setStatus } from './modal.js';
import { persistAll } from './storage.js';

export function slug(s) {
  return s.replace(/\s+/g, "-");
}

export function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str == null ? "" : str;
  return d.innerHTML;
}

export function computeRevisionQueue(all) {
  return all.filter(q => {
    if (q.status === "Mastered") return false;
    if (isRevisionFlagged(q)) return true;
    if ((q.status === "Solved") && (q.confidence < 60 || q.attempts >= 3)) return true;
    return false;
  }).map(q => {
    let priority = "Low";
    const daysSince = q.lastSolved ? Math.floor((Date.now() - new Date(q.lastSolved).getTime()) / 86400000) : 999;
    let score = (100 - q.confidence) + (daysSince > 7 ? 15 : 0) + (q.attempts >= 3 ? 10 : 0);
    if (score >= 70) priority = "High"; else if (score >= 40) priority = "Medium";
    return { ...q, priority, daysSince };
  }).sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.priority] - { High: 0, Medium: 1, Low: 2 }[b.priority]));
}

export function renderKPIs(all) {
  const total = all.length;
  const solved = all.filter(q => q.status === "Solved").length;
  const mastered = all.filter(q => q.status === "Mastered").length;
  const unsolved = all.filter(q => q.status === "Unsolved" || q.status === "Not Started").length;
  const revision = all.filter(isRevisionFlagged).length;
  const solvedOrMastered = solved + mastered;
  const progressPct = total ? Math.round((solvedOrMastered / total) * 100) : 0;

  const cards = [
    { label: "Total Questions", value: total, sub: "in dataset", cls: "" },
    { label: "Unsolved", value: unsolved, sub: "remaining to solve", cls: "" },
    { label: "Solved", value: solved, sub: `of ${total}`, cls: "solved" },
    { label: "Mastered", value: mastered, sub: "fully confident", cls: "mastered" },
    { label: "Revision", value: revision, sub: "needs review", cls: "revision" },
    { label: "Overall Progress", value: `${progressPct}%`, sub: `${solvedOrMastered} / ${total}`, cls: "progress", bar: progressPct },
  ];

  const grid = document.getElementById("kpiGrid");
  if (grid) {
    grid.innerHTML = cards.map(c => `
      <div class="kpi ${c.cls}">
        <div class="kpi-label">${c.label}</div>
        <div class="kpi-value">${c.value}</div>
        <div class="kpi-sub">${c.sub}</div>
        ${c.bar !== undefined ? `<div class="kpi-bar"><div class="kpi-bar-fill" style="width:${c.bar}%; background:var(--accent-grad);"></div></div>` : ""}
      </div>
    `).join("");
  }

  const hsProgress = document.getElementById("hsProgress");
  const hsTotal = document.getElementById("hsTotal");
  const hsSolved = document.getElementById("hsSolved");
  const hsPending = document.getElementById("hsPending");
  const hsRevision = document.getElementById("hsRevision");
  const hsAccuracy = document.getElementById("hsAccuracy");

  if (hsProgress) hsProgress.textContent = progressPct + "%";
  if (hsTotal) hsTotal.textContent = total;
  if (hsSolved) hsSolved.textContent = solvedOrMastered;
  if (hsPending) hsPending.textContent = unsolved;
  if (hsRevision) hsRevision.textContent = revision;

  const attemptedQ = all.filter(q => q.attempts > 0);
  const accuracy = attemptedQ.length ? Math.round((attemptedQ.filter(q => q.status === "Solved" || q.status === "Mastered").length / attemptedQ.length) * 100) : 0;
  if (hsAccuracy) hsAccuracy.textContent = accuracy + "%";
}

export function renderCards(all, showToast) {
  const filtered = applySort(applyFilters(all));
  const resCountEl = document.getElementById("resultCount");
  if (resCountEl) resCountEl.textContent = `${filtered.length} question${filtered.length !== 1 ? "s" : ""}`;
  const grid = document.getElementById("qGrid");
  const paginationWrap = document.getElementById("paginationWrap");
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="emoji">🎯</div>
      <div class="title">No questions found</div>
      <div>Try changing your filters or search keyword.</div>
    </div>`;
    if (paginationWrap) paginationWrap.innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const startIndex = (state.currentPage - 1) * PAGE_SIZE;
  const shown = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  grid.innerHTML = shown.map(q => {
    const isSolved = q.status === "Solved" || q.status === "Mastered";
    const isRev = isRevisionFlagged(q) || q.status === "Needs Revision";
    const solvedCount = q.solvedCount !== undefined ? q.solvedCount : (isSolved ? 1 : 0);
    const revisionCount = q.revisionCount !== undefined ? q.revisionCount : (isRev ? 1 : 0);

    return `
    <div class="q-card" data-id="${q.id}">
      <div class="q-card-top">
        <div>
          <div class="q-title">${escapeHtml(q.title)}</div>
          <div class="q-platform">${escapeHtml(q.platform)}</div>
        </div>
        <button class="fav-btn ${q.favorite ? "active" : ""}" data-fav="${q.id}" aria-label="Toggle favorite">${q.favorite ? "★" : "☆"}</button>
      </div>
      <div class="q-tags">
        <span class="tag">${escapeHtml(q.topic)}</span>
        <span class="tag">${escapeHtml(q.pattern)}</span>
        <span class="diff-badge diff-${q.stars}">${starStr(q.stars)}</span>
      </div>
      <div class="q-status-row-counts">
        <div class="status-badge status-${slug(q.status)}">${STATUS_EMOJI[q.status]} ${q.status}</div>
        <span class="status-count-tag solved">✓ Solved: ${solvedCount}</span>
        <span class="status-count-tag revision">🔁 Revision: ${revisionCount}</span>
      </div>
      <div>
        <div class="q-stats-row"><span>Confidence: ${q.confidence}%</span><span>Attempts: ${q.attempts}</span></div>
        <div class="q-conf-bar"><div class="q-conf-fill" style="width:${q.confidence}%"></div></div>
      </div>
      <div class="q-card-actions">
        ${q.problemUrl ? `<a class="btn small" href="${q.problemUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Open ↗</a>` : `<span class="btn small" disabled>No Link</span>`}
        <button class="btn small" data-revise="${q.id}">🔁 Revise</button>
        <button class="btn small" data-fav2="${q.id}">${q.favorite ? "★" : "☆"} Fav</button>
      </div>
    </div>
  `;
  }).join("");

  renderPagination(filtered, showToast);

  grid.querySelectorAll(".q-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-fav]") || e.target.closest("[data-fav2]") || e.target.closest("[data-revise]") || e.target.closest("a")) return;
      openModal(Number(card.dataset.id), () => renderAll(showToast), showToast);
    });
  });

  grid.querySelectorAll("[data-fav],[data-fav2]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.fav || btn.dataset.fav2);
      if (!state.progress[id]) state.progress[id] = defaultProgressFor(id);
      state.progress[id].favorite = !state.progress[id].favorite;
      persistAll(state);
      renderAll(showToast);
    });
  });

  grid.querySelectorAll("[data-revise]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.revise);
      setStatus(id, "Needs Revision", () => renderAll(showToast));
      if (showToast) showToast("Marked for revision");
    });
  });
}

function renderPagination(filtered, showToast) {
  const wrap = document.getElementById("paginationWrap");
  if (!wrap) return;

  const totalQuestions = filtered.length;
  const pageSize = PAGE_SIZE;
  const totalPages = Math.ceil(totalQuestions / pageSize);

  if (totalQuestions === 0 || totalPages <= 1) {
    wrap.innerHTML = totalQuestions > 0 
      ? `<div class="pagination-info">Showing all ${totalQuestions} questions</div>` 
      : "";
    return;
  }

  if (state.currentPage > totalPages) state.currentPage = totalPages;
  if (state.currentPage < 1) state.currentPage = 1;

  const curPage = state.currentPage;
  const startNum = (curPage - 1) * pageSize + 1;
  const endNum = Math.min(curPage * pageSize, totalQuestions);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (curPage > 3) pages.push("...");

    const start = Math.max(2, curPage - 1);
    const end = Math.min(totalPages - 1, curPage + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (curPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  let html = `
    <div class="pagination-info">Showing ${startNum}–${endNum} of ${totalQuestions} questions</div>
    <div class="pagination-controls">
      <button class="page-btn prev-btn" id="prevPageBtn" ${curPage === 1 ? "disabled" : ""}>← Previous</button>
  `;

  pages.forEach(p => {
    if (p === "...") {
      html += `<span class="page-ellipsis">…</span>`;
    } else {
      html += `<button class="page-btn num-btn ${p === curPage ? "active" : ""}" data-page="${p}">${p}</button>`;
    }
  });

  html += `
      <button class="page-btn next-btn" id="nextPageBtn" ${curPage === totalPages ? "disabled" : ""}>Next →</button>
    </div>
  `;

  wrap.innerHTML = html;

  const prevBtn = wrap.querySelector("#prevPageBtn");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (state.currentPage > 1) {
        state.currentPage--;
        renderCards(getQuestions(), showToast);
        scrollToQuestions();
      }
    });
  }

  const nextBtn = wrap.querySelector("#nextPageBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (state.currentPage < totalPages) {
        state.currentPage++;
        renderCards(getQuestions(), showToast);
        scrollToQuestions();
      }
    });
  }

  wrap.querySelectorAll(".num-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const pageNum = Number(btn.dataset.page);
      if (pageNum && pageNum !== state.currentPage) {
        state.currentPage = pageNum;
        renderCards(getQuestions(), showToast);
        scrollToQuestions();
      }
    });
  });
}

function scrollToQuestions() {
  const el = document.getElementById("questionsSection");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

let revVisibleCount = 30;

export function renderRevisionQueue(all, showToast) {
  const queue = computeRevisionQueue(all);
  const grid = document.getElementById("revGrid");
  if (!grid) return;
  if (queue.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="emoji">🎉</div>
      <div class="title">No revision questions!</div>
      <div>You're all caught up.</div>
    </div>`;
    return;
  }
  const shown = queue.slice(0, revVisibleCount);
  grid.innerHTML = shown.map(q => `
    <div class="rev-card pri-${q.priority}" data-id="${q.id}">
      <div class="rev-pri ${q.priority}">${q.priority === "High" ? "🔴" : q.priority === "Medium" ? "🟡" : "🟢"} ${q.priority} Priority</div>
      <div class="rev-title">${escapeHtml(q.title)}</div>
      <div class="rev-sub">${escapeHtml(q.topic)} / ${escapeHtml(q.pattern)} · ${starStr(q.stars)}</div>
      <div class="rev-meta">
        <span>Confidence: ${q.confidence}%</span>
        <span>${q.lastSolved ? `${q.daysSince}d ago` : "Not solved"}</span>
      </div>
      <div class="rev-actions">
        <button class="btn small" data-open="${q.id}">Revise</button>
        <button class="btn small primary" data-master="${q.id}">Mark Mastered</button>
      </div>
    </div>
  `).join("") + (queue.length > shown.length ? `<div class="rev-pagination" style="grid-column:1/-1;"><button class="btn small" id="revLoadMoreBtn">Show More (${queue.length - shown.length} left)</button></div>` : "");

  grid.querySelectorAll("[data-open]").forEach(b => b.addEventListener("click", () => openModal(Number(b.dataset.open), () => renderAll(showToast), showToast)));
  grid.querySelectorAll("[data-master]").forEach(b => b.addEventListener("click", () => {
    setStatus(Number(b.dataset.master), "Mastered", () => renderAll(showToast));
    if (showToast) showToast("Marked as mastered ⭐");
  }));
  const moreBtn = document.getElementById("revLoadMoreBtn");
  if (moreBtn) moreBtn.addEventListener("click", () => { revVisibleCount += 30; renderRevisionQueue(getQuestions(), showToast); });
}

export function renderWeakTopics(all) {
  const stats = computeTopicStats(all).filter(s => s.total > 0);
  const weak = [...stats].sort((a, b) => (a.completion + a.avgConf) - (b.completion + b.avgConf)).slice(0, 3);
  const box = document.getElementById("weakTopicsList");
  if (!box) return;
  box.innerHTML = weak.map(w => `
    <div class="weak-item">
      <div class="weak-top"><span>${escapeHtml(w.topic)}</span><span>${w.solved}/${w.total}</span></div>
      <div class="weak-bar"><div class="weak-bar-fill" style="width:${w.avgConf}%"></div></div>
      <div class="weak-meta">Avg confidence: ${w.avgConf}%</div>
    </div>
  `).join("") || `<div class="weak-meta">Not enough data yet.</div>`;

  const recEl = document.getElementById("recommendationText");
  if (recEl && weak.length && weak[0].total > 0) {
    recEl.innerHTML = `💡 Focus on <strong>${escapeHtml(weak[0].topic)}</strong> next. You have low completion and low confidence in this topic.`;
  }
}

export function renderRecommendations(all, showToast) {
  const stats = computeTopicStats(all);
  const weakTopics = [...stats].sort((a, b) => (a.completion + a.avgConf) - (b.completion + b.avgConf)).map(s => s.topic);
  const revQueue = computeRevisionQueue(all).filter(q => q.priority === "High");
  const unsolved = all.filter(q => q.status === "Unsolved" || q.status === "Not Started");

  const picks = [];
  const seen = new Set();
  function add(q) { if (q && !seen.has(q.id) && picks.length < 5) { seen.add(q.id); picks.push(q); } }

  weakTopics.forEach(t => {
    if (picks.length >= 5) return;
    const cand = unsolved.filter(q => q.topic === t).sort((a, b) => a.stars - b.stars)[0];
    add(cand);
  });
  revQueue.forEach(q => add(q));
  [...unsolved].sort((a, b) => a.stars - b.stars).forEach(q => add(q));

  const list = document.getElementById("recommendList");
  if (!list) return;
  if (picks.length === 0) {
    list.innerHTML = `<div class="weak-meta">You've covered everything — great work! 🎉</div>`;
    return;
  }
  list.innerHTML = picks.map((q, i) => `
    <div class="rec-item" data-id="${q.id}">
      <div class="rec-num">${i + 1}</div>
      <div class="rec-info">
        <div class="rec-title">${escapeHtml(q.title)}</div>
        <div class="rec-tags">${escapeHtml(q.topic)} · ${starStr(q.stars)}</div>
      </div>
    </div>
  `).join("");
  list.querySelectorAll(".rec-item").forEach(el => el.addEventListener("click", () => openModal(Number(el.dataset.id), () => renderAll(showToast), showToast)));
}

export function renderReadiness(all) {
  const total = all.length;
  const solved = all.filter(q => q.status === "Solved" || q.status === "Mastered");
  const solvedRatio = total ? solved.length / total : 0;

  const totalStarWeight = all.reduce((s, q) => s + q.stars, 0);
  const solvedStarWeight = solved.reduce((s, q) => s + q.stars, 0);
  const diffScore = totalStarWeight ? solvedStarWeight / totalStarWeight : 0;

  const avgConf = solved.length ? solved.reduce((s, q) => s + q.confidence, 0) / solved.length / 100 : 0;

  const revQueue = computeRevisionQueue(all).length;
  const revComp = solved.length ? Math.max(0, 1 - (revQueue / solved.length)) : 0;

  const topicsCovered = new Set(solved.map(q => q.topic)).size;
  const topicCov = state.totalTopics.length ? topicsCovered / state.totalTopics.length : 0;

  const score = Math.round(100 * (0.4 * solvedRatio + 0.2 * diffScore + 0.2 * avgConf + 0.1 * revComp + 0.1 * topicCov));

  let tag = "Beginner", color = "var(--red)";
  if (score > 85) { tag = "Strong"; color = "var(--green)"; }
  else if (score >= 71) { tag = "Interview Ready"; color = "var(--accent)"; }
  else if (score >= 51) { tag = "Developing"; color = "var(--blue)"; }
  else if (score >= 31) { tag = "Learning"; color = "var(--orange)"; }

  const circ = 2 * Math.PI * 60;
  const ring = document.getElementById("readinessRing");
  if (ring) {
    ring.style.strokeDasharray = circ;
    ring.style.strokeDashoffset = circ - (circ * score / 100);
    ring.style.stroke = color;
  }
  const readinessNum = document.getElementById("readinessNum");
  if (readinessNum) readinessNum.textContent = score + "%";

  const tagEl = document.getElementById("readinessTag");
  if (tagEl) {
    tagEl.textContent = tag;
    tagEl.style.background = "color-mix(in srgb, " + color + " 16%, transparent)";
    tagEl.style.color = color;
  }
}

export function renderAll(showToast) {
  const all = getQuestions();
  renderKPIs(all);
  renderCards(all, showToast);
  renderRevisionQueue(all, showToast);
  renderWeakTopics(all);
  renderRecommendations(all, showToast);
  renderReadiness(all);
  renderCharts(all);
  renderStreak();
  renderGoal();
}
