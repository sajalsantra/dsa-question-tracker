import { getSupabaseConfig } from './config.js?v=12';

export const K = {
  progress: "dsaProgress",
  notes: "dsaNotes",
  settings: "dsaSettings",
  activity: "dsaActivity",
  dailyGoal: "dsaDailyGoal",
  questions: "dsaQuestions",
  migrationDone: "dsaMigratedToDB"
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
  return new Date().toISOString().slice(0, 10);
}

// Supabase Client Initialization
let supabaseClient = null;
let currentUser = null;

export function getSupabase() {
  if (!supabaseClient && typeof window !== "undefined" && window.supabase) {
    const cfg = getSupabaseConfig();
    if (cfg.url && !cfg.url.includes("your-supabase-project")) {
      try {
        supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
      } catch (err) {
        console.warn("Supabase client initialization failed:", err);
      }
    }
  }
  return supabaseClient;
}

export function getCurrentUser() {
  return currentUser;
}

export function isAuthenticated() {
  return !!currentUser;
}

// Auth Lifecycle
export async function initAuth(onAuthChangeCallback) {
  const sb = getSupabase();
  if (!sb) {
    onAuthChangeCallback(null);
    return;
  }

  try {
    const { data: { session } } = await sb.auth.getSession();
    currentUser = session ? session.user : null;
    onAuthChangeCallback(currentUser);

    sb.auth.onAuthStateChange(async (_event, session) => {
      const prevUser = currentUser;
      currentUser = session ? session.user : null;
      onAuthChangeCallback(currentUser);

      // Perform auto-migration if user newly logs in and has local data
      if (currentUser && (!prevUser || prevUser.id !== currentUser.id)) {
        await migrateLocalStorageToDB();
      }
    });
  } catch (err) {
    console.error("Auth initialization error:", err);
    onAuthChangeCallback(null);
  }
}

export async function signUpUser(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase is not configured yet. Please update js/config.js with your project URL.");
  const { data, error } = await sb.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInUser(email, password) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase is not configured yet. Please update js/config.js with your project URL.");
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const sb = getSupabase();
  if (sb) {
    await sb.auth.signOut();
  }
  currentUser = null;
}

// Data Fetching from Database
export async function loadUserDataFromDB() {
  const sb = getSupabase();
  if (!sb || !currentUser) return null;

  try {
    setSaveState("saving", "Loading user data...");
    const userId = currentUser.id;

    // Fetch all 4 tables in parallel
    const [progressRes, notesRes, activityRes, settingsRes] = await Promise.all([
      sb.from("question_progress").select("*").eq("user_id", userId),
      sb.from("question_notes").select("*").eq("user_id", userId),
      sb.from("user_activity").select("*").eq("user_id", userId),
      sb.from("user_settings").select("*").eq("user_id", userId).maybeSingle()
    ]);

    if (progressRes.error) throw progressRes.error;
    if (notesRes.error) throw notesRes.error;
    if (activityRes.error) throw activityRes.error;
    if (settingsRes.error) throw settingsRes.error;

    // Format progress
    const progressMap = {};
    (progressRes.data || []).forEach(row => {
      progressMap[row.question_id] = {
        status: row.status,
        revision: row.revision,
        confidence: row.confidence,
        attempts: row.attempts,
        timeTaken: row.time_taken,
        lastSolved: row.last_solved || "",
        favorite: row.favorite
      };
    });

    // Format notes
    const notesMap = {};
    (notesRes.data || []).forEach(row => {
      notesMap[row.question_id] = row.notes;
    });

    // Format activity
    const activityMap = {};
    (activityRes.data || []).forEach(row => {
      activityMap[row.activity_date] = row.count;
    });

    // Format settings
    const settingsRow = settingsRes.data || {};
    const settingsObj = {
      theme: settingsRow.theme || "dark",
      ui: settingsRow.ui_state || {
        insightsOpen: true, streakGoalOpen: true, analyticsOpen: true,
        filtersOpen: true, questionsOpen: true, revOpen: true, dataMgmtOpen: true
      }
    };

    const dailyGoalObj = {
      target: settingsRow.daily_goal_target || 5,
      date: settingsRow.daily_goal_date || todayStr(),
      count: settingsRow.daily_goal_count || 0
    };

    setSaveState("saved");
    return {
      progress: progressMap,
      notesStore: notesMap,
      activity: activityMap,
      settings: settingsObj,
      dailyGoal: dailyGoalObj
    };
  } catch (err) {
    console.error("Error loading user data from DB:", err);
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
  const sb = getSupabase();
  if (!sb || !currentUser) return;

  const payload = {
    user_id: currentUser.id,
    question_id: Number(questionId),
    status: p.status,
    revision: !!p.revision,
    confidence: Number(p.confidence) || 0,
    attempts: Number(p.attempts) || 0,
    time_taken: Number(p.timeTaken) || 0,
    last_solved: p.lastSolved || "",
    favorite: !!p.favorite,
    updated_at: new Date().toISOString()
  };

  debounceSave(`progress_${questionId}`, async () => {
    const { error } = await sb.from("question_progress").upsert(payload, { onConflict: "user_id,question_id" });
    if (error) throw error;
  }, 300);
}

export async function saveNoteDB(questionId, noteText) {
  const sb = getSupabase();
  if (!sb || !currentUser) return;

  const payload = {
    user_id: currentUser.id,
    question_id: Number(questionId),
    notes: noteText || "",
    updated_at: new Date().toISOString()
  };

  debounceSave(`note_${questionId}`, async () => {
    const { error } = await sb.from("question_notes").upsert(payload, { onConflict: "user_id,question_id" });
    if (error) throw error;
  }, 600);
}

export async function saveActivityDB(dateStr, count) {
  const sb = getSupabase();
  if (!sb || !currentUser) return;

  const payload = {
    user_id: currentUser.id,
    activity_date: dateStr,
    count: count,
    updated_at: new Date().toISOString()
  };

  debounceSave(`activity_${dateStr}`, async () => {
    const { error } = await sb.from("user_activity").upsert(payload, { onConflict: "user_id,activity_date" });
    if (error) throw error;
  }, 400);
}

export async function saveSettingsDB(settingsObj, dailyGoalObj) {
  const sb = getSupabase();
  if (!sb || !currentUser) return;

  const payload = {
    user_id: currentUser.id,
    theme: settingsObj.theme || "dark",
    ui_state: settingsObj.ui || {},
    daily_goal_target: dailyGoalObj ? dailyGoalObj.target : 5,
    daily_goal_date: dailyGoalObj ? dailyGoalObj.date : todayStr(),
    daily_goal_count: dailyGoalObj ? dailyGoalObj.count : 0,
    updated_at: new Date().toISOString()
  };

  debounceSave("settings", async () => {
    const { error } = await sb.from("user_settings").upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
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

  // If logged into Supabase, trigger DB persistence for settings
  if (isAuthenticated()) {
    saveSettingsDB(state.settings, state.dailyGoal);
  }
}

// One-Time Safe Migration from LocalStorage to Supabase Database
export async function migrateLocalStorageToDB() {
  const sb = getSupabase();
  if (!sb || !currentUser) return;

  const userId = currentUser.id;
  const migrationKey = `${K.migrationDone}_${userId}`;
  if (localStorage.getItem(migrationKey) === "true") {
    return; // Migration already completed for this user
  }

  const localProgress = loadJSON(K.progress, null);
  const localNotes = loadJSON(K.notes, null);
  const localActivity = loadJSON(K.activity, null);
  const localSettings = loadJSON(K.settings, null);
  const localGoal = loadJSON(K.dailyGoal, null);

  if (!localProgress && !localNotes && !localActivity) {
    localStorage.setItem(migrationKey, "true");
    return; // No local data to migrate
  }

  try {
    setSaveState("saving", "Migrating local progress to cloud...");

    // 1. Progress records
    if (localProgress) {
      const progressPayload = Object.keys(localProgress).map(qId => {
        const p = localProgress[qId];
        return {
          user_id: userId,
          question_id: Number(qId),
          status: p.status || "Not Started",
          revision: !!p.revision,
          confidence: Number(p.confidence) || 0,
          attempts: Number(p.attempts) || 0,
          time_taken: Number(p.timeTaken) || 0,
          last_solved: p.lastSolved || "",
          favorite: !!p.favorite,
          updated_at: new Date().toISOString()
        };
      });

      if (progressPayload.length > 0) {
        const { error } = await sb.from("question_progress").upsert(progressPayload, { onConflict: "user_id,question_id" });
        if (error) throw error;
      }
    }

    // 2. Notes records
    if (localNotes) {
      const notesPayload = Object.keys(localNotes).filter(qId => localNotes[qId]).map(qId => ({
        user_id: userId,
        question_id: Number(qId),
        notes: localNotes[qId],
        updated_at: new Date().toISOString()
      }));

      if (notesPayload.length > 0) {
        const { error } = await sb.from("question_notes").upsert(notesPayload, { onConflict: "user_id,question_id" });
        if (error) throw error;
      }
    }

    // 3. Activity records
    if (localActivity) {
      const activityPayload = Object.keys(localActivity).filter(d => localActivity[d] > 0).map(d => ({
        user_id: userId,
        activity_date: d,
        count: Number(localActivity[d]),
        updated_at: new Date().toISOString()
      }));

      if (activityPayload.length > 0) {
        const { error } = await sb.from("user_activity").upsert(activityPayload, { onConflict: "user_id,activity_date" });
        if (error) throw error;
      }
    }

    // 4. Settings & Goal record
    if (localSettings || localGoal) {
      const settingsPayload = {
        user_id: userId,
        theme: localSettings ? localSettings.theme : "dark",
        ui_state: localSettings ? localSettings.ui : {},
        daily_goal_target: localGoal ? localGoal.target : 5,
        daily_goal_date: localGoal ? localGoal.date : todayStr(),
        daily_goal_count: localGoal ? localGoal.count : 0,
        updated_at: new Date().toISOString()
      };
      const { error } = await sb.from("user_settings").upsert(settingsPayload, { onConflict: "user_id" });
      if (error) throw error;
    }

    localStorage.setItem(migrationKey, "true");
    setSaveState("saved", "Local progress migrated to database");
  } catch (err) {
    console.error("Migration error:", err);
    setSaveState("error", "Migration failed — Retrying next session");
  }
}
