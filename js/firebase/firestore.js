/**
 * Cloud Firestore Data Access & Migration Layer
 * Firebase JavaScript SDK Version: 12.18.0 (CDN Modular SDK)
 * 
 * Scoped User Data Structure:
 * - users/{uid}/progress/{questionId}
 * - users/{uid}/notes/{questionId}
 * - users/{uid}/activity/{YYYY-MM-DD}
 * - users/{uid}/settings/config
 */

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js';
import { getFirebaseApp } from './config.js';

let dbInstance = null;

export function getFirestoreDb() {
  if (!dbInstance) {
    const app = getFirebaseApp();
    dbInstance = getFirestore(app);
  }
  return dbInstance;
}

/**
 * Fetch all user data from Firestore in parallel (4 collection queries total).
 */
export async function loadUserDataFromFirestore(uid) {
  if (!uid) return null;
  const db = getFirestoreDb();

  try {
    const progressRef = collection(db, "users", uid, "progress");
    const notesRef = collection(db, "users", uid, "notes");
    const activityRef = collection(db, "users", uid, "activity");
    const settingsRef = doc(db, "users", uid, "settings", "config");

    const [progressSnap, notesSnap, activitySnap, settingsSnap] = await Promise.all([
      getDocs(progressRef),
      getDocs(notesRef),
      getDocs(activityRef),
      getDoc(settingsRef)
    ]);

    const progressMap = {};
    progressSnap.forEach(docSnap => {
      const data = docSnap.data();
      const qId = docSnap.id;
      progressMap[qId] = {
        status: data.status || "Not Started",
        revision: !!data.revision,
        confidence: Number(data.confidence) || 0,
        attempts: Number(data.attempts) || 0,
        timeTaken: Number(data.timeTaken) || 0,
        lastSolved: data.lastSolved || "",
        favorite: !!data.favorite
      };
    });

    const notesMap = {};
    notesSnap.forEach(docSnap => {
      notesMap[docSnap.id] = docSnap.data().notes || "";
    });

    const activityMap = {};
    activitySnap.forEach(docSnap => {
      activityMap[docSnap.id] = Number(docSnap.data().count) || 0;
    });

    let settingsObj = {
      theme: "dark",
      ui: {
        dashboardGroupOpen: true, insightsOpen: true, streakGoalOpen: true,
        analyticsOpen: true, filtersOpen: true, questionsOpen: true, revOpen: true, dataMgmtOpen: true
      }
    };
    let dailyGoalObj = {
      target: 5,
      date: new Date().toISOString().slice(0, 10),
      count: 0
    };

    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      if (data.theme) settingsObj.theme = data.theme;
      if (data.ui) settingsObj.ui = { ...settingsObj.ui, ...data.ui };
      if (data.dailyGoal) {
        dailyGoalObj = {
          target: Number(data.dailyGoal.target) || 5,
          date: data.dailyGoal.date || new Date().toISOString().slice(0, 10),
          count: Number(data.dailyGoal.count) || 0
        };
      }
    }

    return {
      progress: progressMap,
      notesStore: notesMap,
      activity: activityMap,
      settings: settingsObj,
      dailyGoal: dailyGoalObj
    };
  } catch (err) {
    console.error("Error loading user data from Firestore:", err);
    throw err;
  }
}

/**
 * Save question progress to Firestore (users/{uid}/progress/{questionId})
 */
export async function saveProgressFirestore(uid, questionId, p) {
  if (!uid || questionId == null) return;
  const db = getFirestoreDb();
  const qDocRef = doc(db, "users", uid, "progress", String(questionId));
  const payload = {
    status: p.status || "Not Started",
    revision: !!p.revision,
    confidence: Number(p.confidence) || 0,
    attempts: Number(p.attempts) || 0,
    timeTaken: Number(p.timeTaken) || 0,
    lastSolved: p.lastSolved || "",
    favorite: !!p.favorite,
    updatedAt: serverTimestamp()
  };
  await setDoc(qDocRef, payload, { merge: true });
}

/**
 * Save question notes to Firestore (users/{uid}/notes/{questionId})
 */
export async function saveNoteFirestore(uid, questionId, noteText) {
  if (!uid || questionId == null) return;
  const db = getFirestoreDb();
  const noteDocRef = doc(db, "users", uid, "notes", String(questionId));
  const payload = {
    notes: noteText || "",
    updatedAt: serverTimestamp()
  };
  await setDoc(noteDocRef, payload, { merge: true });
}

/**
 * Save user activity date to Firestore (users/{uid}/activity/{YYYY-MM-DD})
 */
export async function saveActivityFirestore(uid, dateStr, count) {
  if (!uid || !dateStr) return;
  const db = getFirestoreDb();
  const actDocRef = doc(db, "users", uid, "activity", dateStr);
  const payload = {
    count: Number(count) || 0,
    updatedAt: serverTimestamp()
  };
  await setDoc(actDocRef, payload, { merge: true });
}

/**
 * Save user settings & daily goals to Firestore (users/{uid}/settings/config)
 */
export async function saveSettingsFirestore(uid, settingsObj, dailyGoalObj) {
  if (!uid) return;
  const db = getFirestoreDb();
  const settingsDocRef = doc(db, "users", uid, "settings", "config");
  const payload = {
    theme: settingsObj ? settingsObj.theme || "dark" : "dark",
    ui: settingsObj ? settingsObj.ui || {} : {},
    dailyGoal: {
      target: dailyGoalObj ? Number(dailyGoalObj.target) || 5 : 5,
      date: dailyGoalObj ? dailyGoalObj.date || new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      count: dailyGoalObj ? Number(dailyGoalObj.count) || 0 : 0
    },
    updatedAt: serverTimestamp()
  };
  await setDoc(settingsDocRef, payload, { merge: true });
}

/**
 * One-Time Safe Migration from LocalStorage to Firestore
 * Policy: Existing Cloud Data Wins; Local Data uploaded only for missing documents.
 */
export async function migrateLocalStorageToFirestore(uid, localData) {
  if (!uid) return;
  const db = getFirestoreDb();

  const migrationKey = `dsaMigratedToFirestore_${uid}`;
  const legacyKey = `dsaMigratedToDB_${uid}`;

  if (localStorage.getItem(migrationKey) === "true" || localStorage.getItem(legacyKey) === "true") {
    return; // Migration already completed for this user
  }

  const { progress: localProgress, notesStore: localNotes, activity: localActivity, settings: localSettings, dailyGoal: localGoal } = localData;

  const hasLocalProgress = localProgress && Object.keys(localProgress).length > 0;
  const hasLocalNotes = localNotes && Object.values(localNotes).some(n => !!n);
  const hasLocalActivity = localActivity && Object.values(localActivity).some(c => c > 0);

  if (!hasLocalProgress && !hasLocalNotes && !hasLocalActivity) {
    localStorage.setItem(migrationKey, "true");
    return; // No meaningful local data to migrate
  }

  try {
    // Fetch existing cloud data to determine what exists
    const [progressSnap, notesSnap, activitySnap, settingsSnap] = await Promise.all([
      getDocs(collection(db, "users", uid, "progress")),
      getDocs(collection(db, "users", uid, "notes")),
      getDocs(collection(db, "users", uid, "activity")),
      getDoc(doc(db, "users", uid, "settings", "config"))
    ]);

    const existingProgressIds = new Set();
    progressSnap.forEach(d => existingProgressIds.add(d.id));

    const existingNoteIds = new Set();
    notesSnap.forEach(d => existingNoteIds.add(d.id));

    const existingActivityDates = new Set();
    activitySnap.forEach(d => existingActivityDates.add(d.id));

    const writeOps = [];

    // 1. Progress migration (only for non-existing cloud questions)
    if (localProgress) {
      Object.keys(localProgress).forEach(qId => {
        if (!existingProgressIds.has(String(qId))) {
          const p = localProgress[qId];
          const ref = doc(db, "users", uid, "progress", String(qId));
          writeOps.push({
            ref,
            data: {
              status: p.status || "Not Started",
              revision: !!p.revision,
              confidence: Number(p.confidence) || 0,
              attempts: Number(p.attempts) || 0,
              timeTaken: Number(p.timeTaken) || 0,
              lastSolved: p.lastSolved || "",
              favorite: !!p.favorite,
              updatedAt: serverTimestamp()
            }
          });
        }
      });
    }

    // 2. Notes migration (only for non-existing cloud notes)
    if (localNotes) {
      Object.keys(localNotes).forEach(qId => {
        if (!existingNoteIds.has(String(qId)) && localNotes[qId]) {
          const ref = doc(db, "users", uid, "notes", String(qId));
          writeOps.push({
            ref,
            data: {
              notes: localNotes[qId],
              updatedAt: serverTimestamp()
            }
          });
        }
      });
    }

    // 3. Activity migration (only for non-existing activity dates)
    if (localActivity) {
      Object.keys(localActivity).forEach(dateStr => {
        if (!existingActivityDates.has(dateStr) && localActivity[dateStr] > 0) {
          const ref = doc(db, "users", uid, "activity", dateStr);
          writeOps.push({
            ref,
            data: {
              count: Number(localActivity[dateStr]) || 0,
              updatedAt: serverTimestamp()
            }
          });
        }
      });
    }

    // 4. Settings & Daily Goal migration (only if cloud settings config does not exist)
    if (!settingsSnap.exists() && (localSettings || localGoal)) {
      const ref = doc(db, "users", uid, "settings", "config");
      writeOps.push({
        ref,
        data: {
          theme: localSettings ? localSettings.theme || "dark" : "dark",
          ui: localSettings ? localSettings.ui || {} : {},
          dailyGoal: {
            target: localGoal ? Number(localGoal.target) || 5 : 5,
            date: localGoal ? localGoal.date || new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            count: localGoal ? Number(localGoal.count) || 0 : 0
          },
          updatedAt: serverTimestamp()
        }
      });
    }

    // Execute writes in batches of max 400 operations
    const BATCH_SIZE = 400;
    for (let i = 0; i < writeOps.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = writeOps.slice(i, i + BATCH_SIZE);
      chunk.forEach(op => {
        batch.set(op.ref, op.data, { merge: true });
      });
      await batch.commit();
    }

    localStorage.setItem(migrationKey, "true");
  } catch (err) {
    console.error("LocalStorage to Firestore migration failed:", err);
    throw err;
  }
}
