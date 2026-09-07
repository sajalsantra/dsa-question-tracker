import { state, STATUSES, STATUS_EMOJI } from './state.js';
import { getQuestions, starStr, defaultProgressFor } from './data.js';
import { 
  persistAll, 
  todayStr, 
  saveProgressDB, 
  saveNoteDB, 
  isAuthenticated,
  sendResetPasswordEmail,
  changeUserPassword
} from './storage.js';
import { recordActivity, refreshDailyGoalDate } from './streak.js';

function slug(s) {
  return s.replace(/\s+/g, '-');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
  if (appConfirmBtn) {
    appConfirmBtn.addEventListener("click", async () => {
      if (currentOnConfirm) {
        const setSubmitting = (isSubmitting, buttonText) => {
          appConfirmBtn.disabled = isSubmitting;
          if (buttonText) appConfirmBtn.textContent = buttonText;
          if (appCancelBtn) appCancelBtn.disabled = isSubmitting;
          if (appCloseBtn) appCloseBtn.disabled = isSubmitting;
        };
        await currentOnConfirm((res = true) => closeAppModal(res), setSubmitting);
      } else {
        closeAppModal(true);
      }
    });
  }
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
let currentOnConfirm = null;

/**
 * Reusable Custom Application Modal System
 * Replaces browser native alert(), confirm(), prompt() with accessible custom dialogs.
 */
export function showAppModal(options = {}) {
  const {
    title = "Notification",
    subTitle = null,
    message = "",
    customHTML = null,
    confirmText = "OK",
    cancelText = "Cancel",
    showCancel = false,
    type = "info",
    onRender = null,
    onConfirm = null
  } = options;

  return new Promise((resolve) => {
    appModalResolver = resolve;
    currentOnConfirm = onConfirm;

    const overlay = document.getElementById("appModalOverlay");
    const titleEl = document.getElementById("appModalTitle");
    const subEl = document.getElementById("appModalSub");
    const msgEl = document.getElementById("appModalMessage");
    const confirmBtn = document.getElementById("appModalConfirmBtn");
    const cancelBtn = document.getElementById("appModalCancelBtn");
    const closeBtn = document.getElementById("appModalCloseBtn");

    if (titleEl) titleEl.textContent = title;
    if (subEl) {
      subEl.textContent = subTitle || (type === "danger" ? "Action requires confirmation" : "Application Notification");
    }

    if (msgEl) {
      if (customHTML != null) {
        msgEl.innerHTML = customHTML;
      } else {
        msgEl.textContent = message;
      }
    }

    if (confirmBtn) {
      confirmBtn.textContent = confirmText;
      confirmBtn.className = `btn ${type === "danger" ? "danger" : "primary"}`;
      confirmBtn.disabled = false;
    }

    if (cancelBtn) {
      cancelBtn.textContent = cancelText;
      cancelBtn.style.display = showCancel ? "inline-flex" : "none";
      cancelBtn.disabled = false;
    }

    if (closeBtn) closeBtn.disabled = false;

    if (overlay) {
      overlay.classList.add("open");
      if (onRender) onRender(overlay);
      const firstInput = overlay.querySelector("input:not([type='hidden'])");
      if (firstInput) {
        firstInput.focus();
      } else if (confirmBtn) {
        confirmBtn.focus();
      }
    }
  });
}

export function closeAppModal(result = false) {
  const overlay = document.getElementById("appModalOverlay");
  if (overlay) overlay.classList.remove("open");
  currentOnConfirm = null;
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

export function showForgotPasswordModal(defaultEmail = "") {
  return new Promise((resolve) => {
    const html = `
      <p style="margin-bottom:14px; font-size:13.5px; color:var(--text-dim);">Enter your email address and we'll send you a reset link.</p>
      <form id="forgotPasswordForm" style="display:flex; flex-direction:column; gap:12px;">
        <div class="modal-field-full">
          <label for="forgotEmail" style="display:block; font-size:12px; margin-bottom:6px; color:var(--text-dim); font-weight:600;">Email Address</label>
          <input type="email" id="forgotEmail" required placeholder="john@example.com" value="${escapeHtml(defaultEmail)}" class="input-text" style="width:100%;">
        </div>
        <div class="auth-error-msg" id="forgotErrorMsg" style="color:var(--red); font-size:13px; min-height:18px;"></div>
      </form>
    `;

    showAppModal({
      title: "Forgot Password",
      subTitle: "Enter your email address to receive password reset instructions.",
      customHTML: html,
      confirmText: "Send Link",
      cancelText: "Cancel",
      showCancel: true,
      type: "primary",
      onRender: (overlayEl) => {
        const form = overlayEl.querySelector("#forgotPasswordForm");
        if (form) {
          form.addEventListener("submit", (e) => {
            e.preventDefault();
            const confirmBtn = document.getElementById("appModalConfirmBtn");
            if (confirmBtn) confirmBtn.click();
          });
        }
      },
      onConfirm: async (closeModal, setSubmitting) => {
        const emailInput = document.getElementById("forgotEmail");
        const errorEl = document.getElementById("forgotErrorMsg");
        const email = emailInput ? emailInput.value.trim() : "";

        if (!email) {
          if (errorEl) errorEl.textContent = "Please enter your email address.";
          if (emailInput) emailInput.focus();
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          if (errorEl) errorEl.textContent = "Please enter a valid email address.";
          if (emailInput) emailInput.focus();
          return;
        }

        try {
          if (errorEl) errorEl.textContent = "";
          setSubmitting(true, "Sending...");
          await sendResetPasswordEmail(email);
          closeModal(true);
          await showAppAlert({
            title: "Password reset email sent",
            message: "If an account exists for this email address, check your inbox for instructions to reset your password.",
            confirmText: "OK",
            type: "info"
          });
          resolve(true);
        } catch (err) {
          if (errorEl) {
            errorEl.textContent = err.message || "Unable to send reset email right now. Please try again later.";
          }
          setSubmitting(false, "Send Link");
        }
      }
    });
  });
}

export function showChangePasswordModal() {
  return new Promise((resolve) => {
    const html = `
      <form id="changePasswordForm" style="display:flex; flex-direction:column; gap:12px; margin-top:4px;">
        <div class="modal-field-full">
          <div class="field-label-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label for="changeCurrentPassword" style="font-size:12px; color:var(--text-dim); font-weight:600;">Current Password</label>
            <button type="button" class="btn-link toggle-pass-btn" data-target="changeCurrentPassword" style="font-size:11px;">Show</button>
          </div>
          <input type="password" id="changeCurrentPassword" required placeholder="••••••••••••" class="input-text" style="width:100%;">
        </div>
        <div class="modal-field-full">
          <div class="field-label-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label for="changeNewPassword" style="font-size:12px; color:var(--text-dim); font-weight:600;">New Password</label>
            <button type="button" class="btn-link toggle-pass-btn" data-target="changeNewPassword" style="font-size:11px;">Show</button>
          </div>
          <input type="password" id="changeNewPassword" required minlength="6" placeholder="••••••••••••" class="input-text" style="width:100%;">
        </div>
        <div class="modal-field-full">
          <div class="field-label-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label for="changeConfirmPassword" style="font-size:12px; color:var(--text-dim); font-weight:600;">Confirm New Password</label>
            <button type="button" class="btn-link toggle-pass-btn" data-target="changeConfirmPassword" style="font-size:11px;">Show</button>
          </div>
          <input type="password" id="changeConfirmPassword" required minlength="6" placeholder="••••••••••••" class="input-text" style="width:100%;">
        </div>
        <div class="auth-error-msg" id="changePassErrorMsg" style="color:var(--red); font-size:13px; min-height:18px;"></div>
      </form>
    `;

    showAppModal({
      title: "Change Password",
      subTitle: "Update your account password securely",
      customHTML: html,
      confirmText: "Change Password",
      cancelText: "Cancel",
      showCancel: true,
      type: "primary",
      onRender: (overlayEl) => {
        const form = overlayEl.querySelector("#changePasswordForm");
        if (form) {
          form.addEventListener("submit", (e) => {
            e.preventDefault();
            const confirmBtn = document.getElementById("appModalConfirmBtn");
            if (confirmBtn) confirmBtn.click();
          });
        }
        overlayEl.querySelectorAll(".toggle-pass-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (input) {
              const isPass = input.type === "password";
              input.type = isPass ? "text" : "password";
              btn.textContent = isPass ? "Hide" : "Show";
            }
          });
        });
      },
      onConfirm: async (closeModal, setSubmitting) => {
        const currentInput = document.getElementById("changeCurrentPassword");
        const newInput = document.getElementById("changeNewPassword");
        const confirmInput = document.getElementById("changeConfirmPassword");
        const errorEl = document.getElementById("changePassErrorMsg");

        const currentPassword = currentInput ? currentInput.value : "";
        const newPassword = newInput ? newInput.value : "";
        const confirmPassword = confirmInput ? confirmInput.value : "";

        if (!currentPassword) {
          if (errorEl) errorEl.textContent = "Current password is required.";
          if (currentInput) currentInput.focus();
          return;
        }

        if (!newPassword) {
          if (errorEl) errorEl.textContent = "New password is required.";
          if (newInput) newInput.focus();
          return;
        }

        if (newPassword.length < 6) {
          if (errorEl) errorEl.textContent = "New password must be at least 6 characters long.";
          if (newInput) newInput.focus();
          return;
        }

        if (!confirmPassword) {
          if (errorEl) errorEl.textContent = "Please confirm your new password.";
          if (confirmInput) confirmInput.focus();
          return;
        }

        if (newPassword !== confirmPassword) {
          if (errorEl) errorEl.textContent = "Passwords do not match.";
          if (confirmInput) confirmInput.focus();
          return;
        }

        try {
          if (errorEl) errorEl.textContent = "";
          setSubmitting(true, "Changing...");
          await changeUserPassword(currentPassword, newPassword);
          closeModal(true);
          await showAppAlert({
            title: "Success",
            message: "Password changed successfully.",
            confirmText: "OK",
            type: "success"
          });
          resolve(true);
        } catch (err) {
          if (errorEl) {
            errorEl.textContent = err.message || "Failed to change password.";
          }
          setSubmitting(false, "Change Password");
        }
      }
    });
  });
}

