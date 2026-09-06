import { state, STATUSES, STATUS_EMOJI } from './state.js';
import { getQuestions, starStr, defaultProgressFor } from './data.js';
import { persistAll, todayStr, saveProgressDB, saveNoteDB, isAuthenticated } from './storage.js';
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
  if (isAuthenticated()) {
    saveProgressDB(id, p);
  }
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
        if (isAuthenticated()) {
          saveProgressDB(state.activeQuestionId, state.progress[state.activeQuestionId]);
        }
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
        if (isAuthenticated()) {
          saveProgressDB(state.activeQuestionId, state.progress[state.activeQuestionId]);
        }
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
        if (isAuthenticated()) {
          saveProgressDB(state.activeQuestionId, state.progress[state.activeQuestionId]);
        }
      }
    });
  }

  const mNotes = document.getElementById("mNotes");
  if (mNotes) {
    mNotes.addEventListener("input", e => {
      if (state.activeQuestionId != null) {
        state.notesStore[state.activeQuestionId] = e.target.value;
        persistAll(state);
        if (isAuthenticated()) {
          saveNoteDB(state.activeQuestionId, e.target.value);
        }
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
      if (isAuthenticated()) {
        saveProgressDB(state.activeQuestionId, state.progress[state.activeQuestionId]);
      }
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
      if (isAuthenticated()) {
        saveProgressDB(state.activeQuestionId, state.progress[state.activeQuestionId]);
        saveNoteDB(state.activeQuestionId, "");
      }
      openModal(state.activeQuestionId, onRenderAll, showToast);
      if (onRenderAll) onRenderAll();
      if (showToast) showToast("Status reset");
    });
  }

  // App Modal overlay click & cancel button listeners
  const appOverlay = document.getElementById("appModalOverlay");
  const appCloseBtn = document.getElementById("appModalCloseBtn");
  const appConfirmBtn = document.getElementById("appModalConfirmBtn");
  const appCancelBtn = document.getElementById("appModalCancelBtn");

  if (appCloseBtn) appCloseBtn.addEventListener("click", () => closeAppModal(false));
  if (appCancelBtn) appCancelBtn.addEventListener("click", () => closeAppModal(false));
  if (appConfirmBtn) appConfirmBtn.addEventListener("click", () => closeAppModal(true));
  if (appOverlay) {
    appOverlay.addEventListener("click", (e) => {
      if (e.target === appOverlay) closeAppModal(false);
    });
  }

  // Global Escape key listener for all open modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeAppOverlay = document.getElementById("appModalOverlay");
      if (activeAppOverlay && activeAppOverlay.classList.contains("open")) {
        closeAppModal(false);
      }
    }
  });
}

let appModalResolver = null;

/**
 * Reusable Custom Application Modal System
 * Replaces browser native alert(), confirm(), prompt() with accessible custom dialogs.
 */
export function showAppModal(options = {}) {
  const {
    title = "Notification",
    message = "",
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
    type = "info"
  } = options;

  return new Promise((resolve) => {
    appModalResolver = resolve;

    const overlay = document.getElementById("appModalOverlay");
    const titleEl = document.getElementById("appModalTitle");
    const subEl = document.getElementById("appModalSub");
    const msgEl = document.getElementById("appModalMessage");
    const confirmBtn = document.getElementById("appModalConfirmBtn");
    const cancelBtn = document.getElementById("appModalCancelBtn");

    if (titleEl) titleEl.textContent = title;
    if (subEl) {
      subEl.textContent = type === "danger" ? "Action requires confirmation" : "Application Notification";
    }
    if (msgEl) msgEl.textContent = message;

    if (confirmBtn) {
      confirmBtn.textContent = confirmText;
      confirmBtn.className = `btn ${type === "danger" ? "danger" : "primary"}`;
    }

    if (cancelBtn) {
      cancelBtn.textContent = cancelText;
      cancelBtn.style.display = showCancel ? "inline-flex" : "none";
    }

    if (overlay) {
      overlay.classList.add("open");
      if (confirmBtn) confirmBtn.focus();
    }
  });
}

export function closeAppModal(result = false) {
  const overlay = document.getElementById("appModalOverlay");
  if (overlay) overlay.classList.remove("open");
  if (appModalResolver) {
    const resolve = appModalResolver;
    appModalResolver = null;
    resolve(result);
  }
}

export function showAppConfirm({ title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) {
  return showAppModal({
    title,
    message,
    confirmText,
    cancelText,
    showCancel: true,
    type
  });
}

export function showAppAlert({ title, message, confirmText = "OK", type = "info" }) {
  return showAppModal({
    title,
    message,
    confirmText,
    showCancel: false,
    type
  });
}

