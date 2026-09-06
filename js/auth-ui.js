import { 
  initAuth, 
  signInUser, 
  signUpUser, 
  signOutUser, 
  isAuthenticated, 
  getCurrentUser, 
  getUserProfile,
  onSaveStateChange 
} from './storage.js';

import { showAppConfirm, showAppAlert } from './modal.js';

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
    authUserBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isAuthenticated()) {
        toggleProfileDropdown();
      } else {
        openAuthModal("login");
      }
    });
  }

  // Logout button inside Profile Dropdown
  const dropdownLogoutBtn = document.getElementById("dropdownLogoutBtn");
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener("click", async () => {
      closeProfileDropdown();
      const user = getCurrentUser();
      const profile = await getUserProfile(user);
      const confirmed = await showAppConfirm({
        title: "Log Out",
        message: `Are you sure you want to log out, ${profile.name}? Your progress will remain saved in the cloud.`,
        confirmText: "Log Out",
        cancelText: "Cancel",
        type: "danger"
      });
      if (confirmed) {
        await handleSignOut();
      }
    });
  }

  // Document listener to close dropdown on click outside
  document.addEventListener("click", (e) => {
    const wrap = document.getElementById("profileDropdownWrap");
    if (wrap && !wrap.contains(e.target)) {
      closeProfileDropdown();
    }
  });

  // Escape key listener for profile dropdown
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeProfileDropdown();
    }
  });

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
      const nameInput = document.getElementById("authName");
      const name = nameInput ? nameInput.value.trim() : "";
      const email = document.getElementById("authEmail").value.trim();
      const password = document.getElementById("authPassword").value;
      const mode = document.getElementById("authSubmitBtn").dataset.mode;
      const errorEl = document.getElementById("authErrorMsg");
      const submitBtn = document.getElementById("authSubmitBtn");

      if (mode === "signup" && !name) {
        if (errorEl) errorEl.textContent = "Please enter your name.";
        if (nameInput) nameInput.focus();
        return;
      }

      if (!email || !password) {
        if (errorEl) errorEl.textContent = "Please fill in all required fields.";
        return;
      }

      try {
        if (errorEl) errorEl.textContent = "";
        submitBtn.disabled = true;
        submitBtn.textContent = mode === "login" ? "Signing in..." : "Signing up...";

        if (mode === "login") {
          await signInUser(email, password);
        } else {
          await signUpUser(email, password, name);
          closeAuthModal();
          await showAppAlert({
            title: "Account Created",
            message: `Welcome ${name || "to DSA Tracker"}! Your account has been successfully created.`,
            confirmText: "Get Started",
            type: "success"
          });
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
        submitBtn.textContent = mode === "login" ? "Sign In" : "Create Account";
        const passEl = document.getElementById("authPassword");
        if (passEl) passEl.value = "";
      }
    });
  }

  // Initialize Auth lifecycle
  initAuth(async (user) => {
    await updateAuthUserUI(user);
    if (onAuthChangedCallback) await onAuthChangedCallback();
  });
}

export function toggleProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  const authBtn = document.getElementById("authUserBtn");
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains("open");
  if (isOpen) {
    closeProfileDropdown();
  } else {
    dropdown.style.display = "block";
    // Trigger reflow for smooth animation
    dropdown.offsetHeight;
    dropdown.classList.add("open");
    if (authBtn) authBtn.setAttribute("aria-expanded", "true");
  }
}

export function closeProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  const authBtn = document.getElementById("authUserBtn");
  if (dropdown) {
    dropdown.classList.remove("open");
    dropdown.style.display = "none";
  }
  if (authBtn) authBtn.setAttribute("aria-expanded", "false");
}

export async function updateAuthUserUI(user) {
  const userAvatar = document.getElementById("userAvatar");
  const userNameDisplay = document.getElementById("userNameDisplay");
  const authBtnChev = document.getElementById("authBtnChev");
  const dropdownUserName = document.getElementById("dropdownUserName");
  const dropdownUserEmail = document.getElementById("dropdownUserEmail");
  const textEl = document.getElementById("authStatusText");

  if (user) {
    const profile = await getUserProfile(user);
    const displayName = profile.name || "User";
    const displayEmail = profile.email || user.email || "";

    // Generate initials (e.g. "John Doe" -> "JD", "Sajal" -> "S", "sajal@ex.com" -> "S")
    const words = displayName.trim().split(/\s+/);
    let initials = words[0] ? words[0][0].toUpperCase() : "U";
    if (words.length > 1 && words[1]) {
      initials += words[1][0].toUpperCase();
    }

    if (userAvatar) {
      userAvatar.textContent = initials;
      userAvatar.style.display = "inline-flex";
    }
    if (userNameDisplay) {
      userNameDisplay.textContent = displayName;
    }
    if (authBtnChev) {
      authBtnChev.style.display = "inline-block";
    }
    if (dropdownUserName) {
      dropdownUserName.textContent = displayName;
    }
    if (dropdownUserEmail) {
      dropdownUserEmail.textContent = displayEmail;
    }
    if (textEl) {
      textEl.textContent = `Cloud Synced (${displayEmail})`;
    }
  } else {
    if (userAvatar) userAvatar.style.display = "none";
    if (userNameDisplay) userNameDisplay.textContent = "🔑 Sign In / Sign Up";
    if (authBtnChev) authBtnChev.style.display = "none";
    if (dropdownUserName) dropdownUserName.textContent = "";
    if (dropdownUserEmail) dropdownUserEmail.textContent = "";
    if (textEl) textEl.textContent = "Local Storage (Guest)";
    closeProfileDropdown();
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
  const nameEl = document.getElementById("authName");
  if (nameEl) nameEl.value = "";
  const passEl = document.getElementById("authPassword");
  if (passEl) passEl.value = "";
}

function setAuthModalMode(mode) {
  const titleEl = document.getElementById("authTitle");
  const submitBtn = document.getElementById("authSubmitBtn");
  const toggleBtn = document.getElementById("authToggleModeBtn");
  const nameGroup = document.getElementById("authNameGroup");
  const nameInput = document.getElementById("authName");

  if (mode === "login") {
    if (titleEl) titleEl.textContent = "Sign In to DSA Tracker";
    if (nameGroup) nameGroup.style.display = "none";
    if (nameInput) nameInput.removeAttribute("required");
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
    if (nameGroup) nameGroup.style.display = "block";
    if (nameInput) nameInput.setAttribute("required", "true");
    if (submitBtn) {
      submitBtn.textContent = "Create Account";
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
    await updateAuthUserUI(null);
    if (onAuthChangedCallback) await onAuthChangedCallback();
  } catch (err) {
    console.error("Sign out error:", err);
  }
}

