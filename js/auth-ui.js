import { 
  initAuth, 
  signInUser, 
  signUpUser, 
  signOutUser, 
  isAuthenticated, 
  getCurrentUser, 
  onSaveStateChange 
} from './storage.js?v=12';

let onAuthChangedCallback = null;

export function setupAuthUI(onReloadData) {
  onAuthChangedCallback = onReloadData;

  // Listen to Save State changes and update the header indicator widget
  onSaveStateChange((state, msg) => {
    updateSaveIndicator(state, msg);
  });

  // Header Auth button click
  const authUserBtn = document.getElementById("authUserBtn");
  if (authUserBtn) {
    authUserBtn.addEventListener("click", () => {
      if (isAuthenticated()) {
        if (confirm(`Logged in as ${getCurrentUser().email}. Do you want to sign out?`)) {
          handleSignOut();
        }
      } else {
        openAuthModal("login");
      }
    });
  }

  // Auth Modal Close button
  const authCloseBtn = document.getElementById("authCloseBtn");
  if (authCloseBtn) {
    authCloseBtn.addEventListener("click", closeAuthModal);
  }

  // Auth Modal Overlay click
  const authOverlay = document.getElementById("authModalOverlay");
  if (authOverlay) {
    authOverlay.addEventListener("click", (e) => {
      if (e.target === authOverlay) closeAuthModal();
    });
  }

  // Toggle Login / Signup mode
  const authToggleBtn = document.getElementById("authToggleModeBtn");
  if (authToggleBtn) {
    authToggleBtn.addEventListener("click", () => {
      const isLogin = authToggleBtn.dataset.mode === "login";
      setAuthModalMode(isLogin ? "signup" : "login");
    });
  }

  // Form Submit (Login / Signup)
  const authForm = document.getElementById("authForm");
  if (authForm) {
    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("authEmail").value.trim();
      const password = document.getElementById("authPassword").value;
      const mode = document.getElementById("authSubmitBtn").dataset.mode;
      const errorEl = document.getElementById("authErrorMsg");
      const submitBtn = document.getElementById("authSubmitBtn");

      if (!email || !password) {
        if (errorEl) errorEl.textContent = "Please fill in all fields.";
        return;
      }

      try {
        if (errorEl) errorEl.textContent = "";
        submitBtn.disabled = true;
        submitBtn.textContent = mode === "login" ? "Signing in..." : "Signing up...";

        if (mode === "login") {
          await signInUser(email, password);
        } else {
          await signUpUser(email, password);
          alert("Account created successfully! If email confirmation is enabled, please check your inbox.");
        }

        closeAuthModal();
        if (onAuthChangedCallback) await onAuthChangedCallback();
      } catch (err) {
        if (errorEl) {
          if (err.code === "over_email_send_rate_limit" || (err.message && err.message.toLowerCase().includes("rate limit"))) {
            errorEl.textContent = "Email rate limit exceeded. Please wait a few minutes before trying again.";
          } else {
            errorEl.textContent = err.message || "Authentication failed.";
          }
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = mode === "login" ? "Sign In" : "Sign Up";
        const passEl = document.getElementById("authPassword");
        if (passEl) passEl.value = "";
      }
    });
  }

  // Initialize Auth lifecycle
  initAuth(async (user) => {
    updateAuthUserUI(user);
    if (onAuthChangedCallback) await onAuthChangedCallback();
  });
}

export function updateAuthUserUI(user) {
  const btn = document.getElementById("authUserBtn");
  const textEl = document.getElementById("authStatusText");

  if (user) {
    if (btn) btn.textContent = `👤 ${user.email.split('@')[0]}`;
    if (textEl) textEl.textContent = `Cloud Synced (${user.email})`;
  } else {
    if (btn) btn.textContent = "🔑 Sign In / Sign Up";
    if (textEl) textEl.textContent = "Local Storage (Guest)";
  }
}

export function updateSaveIndicator(state, msg) {
  const indicator = document.getElementById("saveIndicator");
  if (!indicator) return;

  switch (state) {
    case "saving":
      indicator.className = "save-indicator saving";
      indicator.textContent = "⏳ Saving...";
      break;
    case "saved":
      indicator.className = "save-indicator saved";
      indicator.textContent = "🟢 Saved";
      break;
    case "error":
      indicator.className = "save-indicator error";
      indicator.textContent = msg ? `🔴 ${msg}` : "🔴 Save Failed";
      break;
    case "offline":
      indicator.className = "save-indicator offline";
      indicator.textContent = "🟡 Offline Mode";
      break;
    default:
      indicator.className = "save-indicator saved";
      indicator.textContent = "🟢 Saved";
  }
}

export function openAuthModal(mode = "login") {
  const overlay = document.getElementById("authModalOverlay");
  if (overlay) overlay.classList.add("open");
  setAuthModalMode(mode);
}

export function closeAuthModal() {
  const overlay = document.getElementById("authModalOverlay");
  if (overlay) overlay.classList.remove("open");
  const errorEl = document.getElementById("authErrorMsg");
  if (errorEl) errorEl.textContent = "";
  const passEl = document.getElementById("authPassword");
  if (passEl) passEl.value = "";
}

function setAuthModalMode(mode) {
  const titleEl = document.getElementById("authTitle");
  const submitBtn = document.getElementById("authSubmitBtn");
  const toggleBtn = document.getElementById("authToggleModeBtn");

  if (mode === "login") {
    if (titleEl) titleEl.textContent = "Sign In to DSA Tracker";
    if (submitBtn) {
      submitBtn.textContent = "Sign In";
      submitBtn.dataset.mode = "login";
    }
    if (toggleBtn) {
      toggleBtn.textContent = "Need an account? Sign Up";
      toggleBtn.dataset.mode = "login";
    }
  } else {
    if (titleEl) titleEl.textContent = "Create Account";
    if (submitBtn) {
      submitBtn.textContent = "Sign Up";
      submitBtn.dataset.mode = "signup";
    }
    if (toggleBtn) {
      toggleBtn.textContent = "Already have an account? Sign In";
      toggleBtn.dataset.mode = "signup";
    }
  }
}

async function handleSignOut() {
  try {
    await signOutUser();
    updateAuthUserUI(null);
    if (onAuthChangedCallback) await onAuthChangedCallback();
  } catch (err) {
    console.error("Sign out error:", err);
  }
}
