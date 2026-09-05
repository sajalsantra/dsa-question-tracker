import { state, STATUSES, STATUS_EMOJI } from './state.js';
import { getQuestions, starStr, defaultProgressFor } from './data.js';
import { persistAll, todayStr } from './storage.js';
import { recordActivity, refreshDailyGoalDate } from './streak.js';

function slug(s) {
  return s.replace(/\s+/g, '-');
}

export function setStatus(id, status, onUpdate) {
  if (!state.progress[id]) {
    state.progress[id] = defaultProgressFor(id);
  }
  const p = state.progress[id];
  const wasSolved = p.status === "Solved" || p.status === "Mastered";
  p.status = status;
  if (status === "Needs Revision") p.revision = true;
  if (status === "Solved" || status === "Mastered") {
    p.lastSolved = todayStr();
    if (!wasSolved) {
      recordActivity();
      refreshDailyGoalDate();
      state.dailyGoal.count += 1;
    }
  }
  persistAll(state);
  state.settings.lastUpdated = new Date().toISOString();
  if (onUpdate) onUpdate();
}

export function openModal(id, onRenderAll, showToast) {
  state.activeQuestionId = id;
  const q = getQuestions().find(x => x.id === id);
  if (!q) return;

  const mTitle = document.getElementById("mTitle");
  const mSub = document.getElementById("mSub");
  const mPlatform = document.getElementById("mPlatform");
  const mDifficulty = document.getElementById("mDifficulty");
  const mTopic = document.getElementById("mTopic");
  const mPattern = document.getElementById("mPattern");
  const linkWrap = document.getElementById("mLinkWrap");
  const mLastSolved = document.getElementById("mLastSolved");
  const mConfidence = document.getElementById("mConfidence");
  const mConfVal = document.getElementById("mConfVal");
  const mAttempts = document.getElementById("mAttempts");
  const mTime = document.getElementById("mTime");
  const mNotes = document.getElementById("mNotes");
  const mFavBtn = document.getElementById("mFavoriteBtn");

  if (mTitle) mTitle.textContent = q.title;
  if (mSub) mSub.textContent = `${q.platform} · ${q.topic} · ${q.pattern}`;
  if (mPlatform) mPlatform.textContent = q.platform;
  if (mDifficulty) mDifficulty.innerHTML = `<span class="diff-badge diff-${q.stars}">${starStr(q.stars)}</span>`;
  if (mTopic) mTopic.textContent = q.topic;
  if (mPattern) mPattern.textContent = q.pattern;
  if (linkWrap) linkWrap.innerHTML = q.problemUrl ? `<a id="mLink" href="${q.problemUrl}" target="_blank" rel="noopener">Open Problem →</a>` : `No link available`;
  if (mLastSolved) mLastSolved.textContent = q.lastSolved || "Not solved yet";
  if (mConfidence) mConfidence.value = q.confidence;
  if (mConfVal) mConfVal.textContent = q.confidence + "%";
  if (mAttempts) mAttempts.value = q.attempts;
  if (mTime) mTime.value = q.timeTaken;
  if (mNotes) mNotes.value = q.notes;
  if (mFavBtn) mFavBtn.textContent = q.favorite ? "★ Remove Favorite" : "☆ Add to Favorites";

  const statusRow = document.getElementById("mStatusRow");
  if (statusRow) {
    statusRow.innerHTML = STATUSES.map(s => `<button class="status-pick ${s === q.status ? "active " + slug(s) : ""}" data-status="${s}">${STATUS_EMOJI[s]} ${s}</button>`).join("");
    statusRow.querySelectorAll("[data-status]").forEach(btn => {
      btn.addEventListener("click", () => {
        setStatus(id, btn.dataset.status, onRenderAll);
        openModal(id, onRenderAll, showToast);
      });
    });
  }

  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.add("open");
}

export function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) overlay.classList.remove("open");
  state.activeQuestionId = null;
}

export function setupModalListeners(onRenderAll, showToast) {
  const overlay = document.getElementById("modalOverlay");
  const closeBtn = document.getElementById("modalCloseBtn");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (overlay) {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeModal();
    });
  }

  const mConf = document.getElementById("mConfidence");
  if (mConf) {
    mConf.addEventListener("input", e => {
      const confVal = document.getElementById("mConfVal");
      if (confVal) confVal.textContent = e.target.value + "%";
      if (state.activeQuestionId != null) {
        if (!state.progress[state.activeQuestionId]) state.progress[state.activeQuestionId] = defaultProgressFor(state.activeQuestionId);
        state.progress[state.activeQuestionId].confidence = Number(e.target.value);
        persistAll(state);
      }
    });
  }

  const mAtt = document.getElementById("mAttempts");
  if (mAtt) {
    mAtt.addEventListener("change", e => {
      if (state.activeQuestionId != null) {
        if (!state.progress[state.activeQuestionId]) state.progress[state.activeQuestionId] = defaultProgressFor(state.activeQuestionId);
        state.progress[state.activeQuestionId].attempts = Math.max(0, Number(e.target.value) || 0);
        persistAll(state);
        if (onRenderAll) onRenderAll();
      }
    });
  }

  const mTime = document.getElementById("mTime");
  if (mTime) {
    mTime.addEventListener("change", e => {
      if (state.activeQuestionId != null) {
        if (!state.progress[state.activeQuestionId]) state.progress[state.activeQuestionId] = defaultProgressFor(state.activeQuestionId);
        state.progress[state.activeQuestionId].timeTaken = Math.max(0, Number(e.target.value) || 0);
        persistAll(state);
      }
    });
  }

  const mNotes = document.getElementById("mNotes");
  if (mNotes) {
    mNotes.addEventListener("input", e => {
      if (state.activeQuestionId != null) {
        state.notesStore[state.activeQuestionId] = e.target.value;
        persistAll(state);
      }
    });
  }

  const mSolvedBtn = document.getElementById("mMarkSolved");
  if (mSolvedBtn) {
    mSolvedBtn.addEventListener("click", () => {
      if (state.activeQuestionId == null) return;
      setStatus(state.activeQuestionId, "Solved", onRenderAll);
      openModal(state.activeQuestionId, onRenderAll, showToast);
      if (showToast) showToast("Marked solved 🟢");
    });
  }

  const mRevBtn = document.getElementById("mMarkRevision");
  if (mRevBtn) {
    mRevBtn.addEventListener("click", () => {
      if (state.activeQuestionId == null) return;
      setStatus(state.activeQuestionId, "Needs Revision", onRenderAll);
      openModal(state.activeQuestionId, onRenderAll, showToast);
      if (showToast) showToast("Marked for revision 🔵");
    });
  }

  const mMasteredBtn = document.getElementById("mMarkMastered");
  if (mMasteredBtn) {
    mMasteredBtn.addEventListener("click", () => {
      if (state.activeQuestionId == null) return;
      setStatus(state.activeQuestionId, "Mastered", onRenderAll);
      openModal(state.activeQuestionId, onRenderAll, showToast);
      if (showToast) showToast("Mastered ⭐");
    });
  }

  const mFavBtn = document.getElementById("mFavoriteBtn");
  if (mFavBtn) {
    mFavBtn.addEventListener("click", () => {
      if (state.activeQuestionId == null) return;
      if (!state.progress[state.activeQuestionId]) state.progress[state.activeQuestionId] = defaultProgressFor(state.activeQuestionId);
      state.progress[state.activeQuestionId].favorite = !state.progress[state.activeQuestionId].favorite;
      persistAll(state);
      openModal(state.activeQuestionId, onRenderAll, showToast);
      if (onRenderAll) onRenderAll();
    });
  }

  const mResetBtn = document.getElementById("mResetStatus");
  if (mResetBtn) {
    mResetBtn.addEventListener("click", () => {
      if (state.activeQuestionId == null) return;
      state.progress[state.activeQuestionId] = defaultProgressFor(state.activeQuestionId);
      state.notesStore[state.activeQuestionId] = "";
      persistAll(state);
      openModal(state.activeQuestionId, onRenderAll, showToast);
      if (onRenderAll) onRenderAll();
      if (showToast) showToast("Status reset");
    });
  }
}
