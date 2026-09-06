import { 
  initAuth as initFirebaseAuth, 
  signUpUser as signUpFirebaseUser, 
  signInUser as signInFirebaseUser, 
  signOutUser as signOutFirebaseUser, 
  sendResetPasswordEmail as sendFirebaseResetPasswordEmail,
  changeUserPassword as changeFirebaseUserPassword,
  getCurrentUser as getFirebaseCurrentUser, 
  isAuthenticated as isFirebaseAuthenticated 
} from './firebase/auth.js';

import { 
  loadUserDataFromFirestore, 
  saveProgressFirestore, 
  saveNoteFirestore, 
  saveActivityFirestore, 
  saveSettingsFirestore, 
  migrateLocalStorageToFirestore,
  saveUserProfileFirestore,
  loadUserProfileFirestore
} from './firebase/firestore.js';

export const sendResetPasswordEmail = sendFirebaseResetPasswordEmail;
export const changeUserPassword = changeFirebaseUserPassword;

export const K = {
  progress: "dsaProgress",
  notes: "dsaNotes",
  settings: "dsaSettings",
  activity: "dsaActivity",
  dailyGoal: "dsaDailyGoal",
  questions: "dsaQuestions",
  migrationDone: "dsaMigratedToFirestore"
};

// State for DB sync status
export let saveState = "saved"; // "saved" | "saving" | "error" | "offline"
const statusListeners = [];

export function onSaveStateChange(fn) {
  statusListeners.push(fn);
}

function setSaveState(newState, msg = "") {
  saveState = newState;
  statusListeners.forEach(fn => fn(newState, msg));
}

// LocalStorage helpers
export function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function saveJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

export function todayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCurrentUser() {
  return getFirebaseCurrentUser();
}

export function isAuthenticated() {
  return isFirebaseAuthenticated();
}

/**
 * Resolve user profile name with graceful fallbacks for existing users
 * Priority: 1. Firestore profile -> 2. Auth displayName -> 3. Email username -> 4. "User"
 */
export async function getUserProfile(user = getCurrentUser()) {
  if (!user) return { name: "Guest", email: "" };
  const userEmail = user.email || "";

  try {
    const profile = await loadUserProfileFirestore(user.uid);
    if (profile && profile.name && profile.name.trim()) {
      return { name: profile.name.trim(), email: profile.email || userEmail };
    }
  } catch (e) {
    console.warn("Error fetching profile from Firestore:", e);
  }

  if (user.displayName && user.displayName.trim()) {
    return { name: user.displayName.trim(), email: userEmail };
  }

  if (userEmail) {
    return { name: userEmail.split('@')[0], email: userEmail };
  }

  return { name: "User", email: "" };
}

// Auth Lifecycle
export async function initAuth(onAuthChangeCallback) {
  try {
    initFirebaseAuth(async (user) => {
      onAuthChangeCallback(user);

      // Perform auto-migration if user newly logs in and has local data
      if (user) {
        await migrateLocalStorageToDB();
      }
    });
  } catch (err) {
    console.error("Auth initialization error:", err);
    onAuthChangeCallback(null);
  }
}

export async function signUpUser(email, password, name = "") {
  const user = await signUpFirebaseUser(email, password, name);
  if (user && name) {
    try {
      await saveUserProfileFirestore(user.uid, { name, email });
    } catch (err) {
      console.warn("Failed to persist user profile in Firestore after signup:", err);
    }
  }
  return user;
}

export async function signInUser(email, password) {
  return await signInFirebaseUser(email, password);
}

export async function signOutUser() {
  await signOutFirebaseUser();
}

// Data Fetching from Database
export async function loadUserDataFromDB() {
  const user = getCurrentUser();
  if (!user) return null;

  try {
    setSaveState("saving", "Loading user data...");
    const data = await loadUserDataFromFirestore(user.uid);
    setSaveState("saved");
    return data;
  } catch (err) {
    console.error("Error loading user data from Firestore:", err);
    setSaveState("error", "Failed to load DB data");
    return null;
  }
}

// Debounce helper for rapid save requests (e.g. text input / sliders)
const debouncers = {};
function debounceSave(key, fn, delay = 500) {
  if (debouncers[key]) clearTimeout(debouncers[key]);
  setSaveState("saving");
  debouncers[key] = setTimeout(async () => {
    try {
      await fn();
      setSaveState("saved");
    } catch (err) {
      console.error(`Save error for ${key}:`, err);
      setSaveState("error", "Save failed — Retry");
    }
  }, delay);
}

// Async Database Persistence Functions
export async function saveProgressDB(questionId, p) {
  const user = getCurrentUser();
  if (!user) return;

  debounceSave(`progress_${questionId}`, async () => {
    await saveProgressFirestore(user.uid, questionId, p);
  }, 300);
}

export async function saveNoteDB(questionId, noteText) {
  const user = getCurrentUser();
  if (!user) return;

  debounceSave(`note_${questionId}`, async () => {
    await saveNoteFirestore(user.uid, questionId, noteText);
  }, 600);
}

export async function saveActivityDB(dateStr, count) {
  const user = getCurrentUser();
  if (!user) return;

  debounceSave(`activity_${dateStr}`, async () => {
    await saveActivityFirestore(user.uid, dateStr, count);
  }, 400);
}

export async function saveSettingsDB(settingsObj, dailyGoalObj) {
  const user = getCurrentUser();
  if (!user) return;

  debounceSave("settings", async () => {
    await saveSettingsFirestore(user.uid, settingsObj, dailyGoalObj);
  }, 500);
}

// Master Persist All function (calls DB when logged in, LocalStorage as fallback)
export function persistAll(state) {
  // Always update LocalStorage cache
  saveJSON(K.progress, state.progress);
  saveJSON(K.notes, state.notesStore);
  saveJSON(K.settings, state.settings);
  saveJSON(K.activity, state.activity);
  saveJSON(K.dailyGoal, state.dailyGoal);

  // If logged into Firebase, trigger DB persistence for settings
  if (isAuthenticated()) {
    saveSettingsDB(state.settings, state.dailyGoal);
  }
}

// One-Time Safe Migration from LocalStorage to Cloud Firestore Database
export async function migrateLocalStorageToDB() {
  const user = getCurrentUser();
  if (!user) return;

  const localData = {
    progress: loadJSON(K.progress, null),
    notesStore: loadJSON(K.notes, null),
    activity: loadJSON(K.activity, null),
    settings: loadJSON(K.settings, null),
    dailyGoal: loadJSON(K.dailyGoal, null)
  };

  try {
    setSaveState("saving", "Migrating local progress to cloud...");
    await migrateLocalStorageToFirestore(user.uid, localData);
    setSaveState("saved", "Local progress migrated to database");
  } catch (err) {
    console.error("Migration error:", err);
    setSaveState("error", "Migration failed — Retrying next session");
  }
}
