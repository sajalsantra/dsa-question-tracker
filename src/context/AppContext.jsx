/**
 * Application State Context
 * Replaces: js/state.js global mutable state object
 * Uses React Context + useReducer for immutable state management
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import {
  DEFAULT_FILTERS, DEFAULT_SETTINGS, DEFAULT_UI_SETTINGS,
  STORAGE_KEYS as K, todayStr
} from '../utils/constants.js';
import { calculateConfidence, defaultProgressFor } from '../utils/helpers.js';
import {
  loadJSON, saveJSON, persistAll,
  saveProgressDB, saveNoteDB, saveActivityDB,
  isAuthenticated
} from '../services/storage.js';

// ─── Initial State ────────────────────────────────────────────────────────────
function getInitialState() {
  const progress = loadJSON(K.progress, {});
  const notesStore = loadJSON(K.notes, {});
  const activity = loadJSON(K.activity, {});
  const dailyGoal = loadJSON(K.dailyGoal, { target: 5, date: todayStr(), count: 0 });

  let settings = loadJSON(K.settings, { ...DEFAULT_SETTINGS });
  if (!settings.ui) {
    settings.ui = { ...DEFAULT_UI_SETTINGS };
  } else {
    settings.ui = { ...DEFAULT_UI_SETTINGS, ...settings.ui };
  }
  settings.ui.questionsOpen = true;

  return {
    rawQuestions: [],
    progress,
    notesStore,
    settings,
    activity,
    dailyGoal,
    filters: { ...DEFAULT_FILTERS },
    activeQuestionId: null,
    currentPage: 1,
    totalTopics: [],
    totalPatterns: [],
    totalPlatforms: [],
    isLoading: true,
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_QUESTIONS': {
      const data = action.payload;
      const totalTopics = [...new Set(data.map(q => q.topic))].sort();
      const totalPatterns = [...new Set(data.map(q => q.pattern))].sort();
      const totalPlatforms = [...new Set(data.map(q => q.platform))].sort();

      // Merge default progress for new questions
      const progress = { ...state.progress };
      data.forEach(q => {
        if (!progress[q.id]) {
          progress[q.id] = defaultProgressFor();
        }
      });

      // Merge notes from progress if missing
      const notesStore = { ...state.notesStore };
      data.forEach(q => {
        if (notesStore[q.id] === undefined && progress[q.id] && progress[q.id].notes) {
          notesStore[q.id] = progress[q.id].notes;
        }
      });

      saveJSON(K.questions, data.map(q => ({ id: q.id, title: q.title })));

      return {
        ...state,
        rawQuestions: data,
        progress,
        notesStore,
        totalTopics,
        totalPatterns,
        totalPlatforms,
        isLoading: false,
      };
    }

    case 'LOAD_DB_DATA': {
      const dbData = action.payload;
      if (!dbData) return state;
      const newState = { ...state };
      if (dbData.progress) newState.progress = dbData.progress;
      if (dbData.notesStore) newState.notesStore = dbData.notesStore;
      if (dbData.activity) newState.activity = dbData.activity;
      if (dbData.settings) {
        newState.settings = { ...state.settings, ...dbData.settings };
        if (!newState.settings.ui) newState.settings.ui = { ...DEFAULT_UI_SETTINGS };
        else newState.settings.ui = { ...DEFAULT_UI_SETTINGS, ...newState.settings.ui };
        newState.settings.ui.questionsOpen = true;
      }
      if (dbData.dailyGoal) {
        newState.dailyGoal = { ...state.dailyGoal, ...dbData.dailyGoal };
      }

      // Re-merge progress for all loaded questions
      const progress = { ...newState.progress };
      state.rawQuestions.forEach(q => {
        if (!progress[q.id]) {
          progress[q.id] = defaultProgressFor();
        }
      });
      newState.progress = progress;

      return newState;
    }

    case 'SET_STATUS': {
      const { id, status } = action.payload;
      const progress = { ...state.progress };
      if (!progress[id]) progress[id] = defaultProgressFor();
      const p = { ...progress[id] };
      const q = state.rawQuestions.find(x => x.id === id);
      const stars = q ? q.stars : 3;

      const wasSolved = p.status === "Solved" || p.status === "Mastered";
      p.status = status;
      if (status === "Needs Revision") p.revision = true;

      let activity = state.activity;
      let dailyGoal = state.dailyGoal;

      if (status === "Solved" || status === "Mastered") {
        p.lastSolved = todayStr();
        if (p.attempts === 0) p.attempts = 1;
        p.confidence = calculateConfidence(p.attempts, p.timeTaken, stars);
        if (!wasSolved) {
          // Record activity
          activity = { ...state.activity };
          const t = todayStr();
          activity[t] = (activity[t] || 0) + 1;

          // Update daily goal
          dailyGoal = { ...state.dailyGoal };
          if (dailyGoal.date !== todayStr()) {
            dailyGoal.date = todayStr();
            dailyGoal.count = 0;
          }
          dailyGoal.count += 1;
        }
      }

      progress[id] = p;
      const settings = { ...state.settings, lastUpdated: new Date().toISOString() };

      return { ...state, progress, activity, dailyGoal, settings };
    }

    case 'SET_NOTE': {
      const { id, text } = action.payload;
      return {
        ...state,
        notesStore: { ...state.notesStore, [id]: text }
      };
    }

    case 'SET_CONFIDENCE': {
      const { id, confidence } = action.payload;
      const progress = { ...state.progress };
      if (!progress[id]) progress[id] = defaultProgressFor();
      progress[id] = { ...progress[id], confidence };
      return { ...state, progress };
    }

    case 'SET_ATTEMPTS': {
      const { id, attempts } = action.payload;
      const progress = { ...state.progress };
      if (!progress[id]) progress[id] = defaultProgressFor();
      const p = { ...progress[id], attempts: Math.max(0, Number(attempts) || 0) };
      const q = state.rawQuestions.find(x => x.id === id);
      const stars = q ? q.stars : 3;
      p.confidence = calculateConfidence(p.attempts, p.timeTaken, stars);
      progress[id] = p;
      return { ...state, progress };
    }

    case 'SET_TIME': {
      const { id, timeTaken } = action.payload;
      const progress = { ...state.progress };
      if (!progress[id]) progress[id] = defaultProgressFor();
      const p = { ...progress[id], timeTaken: Math.max(0, Number(timeTaken) || 0) };
      const q = state.rawQuestions.find(x => x.id === id);
      const stars = q ? q.stars : 3;
      p.confidence = calculateConfidence(p.attempts, p.timeTaken, stars);
      progress[id] = p;
      return { ...state, progress };
    }

    case 'TOGGLE_FAVORITE': {
      const { id } = action.payload;
      const progress = { ...state.progress };
      if (!progress[id]) progress[id] = defaultProgressFor();
      progress[id] = { ...progress[id], favorite: !progress[id].favorite };
      return { ...state, progress };
    }

    case 'RESET_QUESTION': {
      const { id } = action.payload;
      return {
        ...state,
        progress: { ...state.progress, [id]: defaultProgressFor() },
        notesStore: { ...state.notesStore, [id]: "" }
      };
    }

    case 'SET_FILTER': {
      const { key, value } = action.payload;
      return {
        ...state,
        filters: { ...state.filters, [key]: value },
        currentPage: 1
      };
    }

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: { ...DEFAULT_FILTERS },
        currentPage: 1
      };

    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };

    case 'SET_THEME': {
      const newTheme = state.settings.theme === "light" ? "dark" : "light";
      return {
        ...state,
        settings: { ...state.settings, theme: newTheme }
      };
    }

    case 'TOGGLE_SECTION': {
      const key = action.payload;
      const ui = { ...state.settings.ui };
      ui[key] = !ui[key];
      return {
        ...state,
        settings: { ...state.settings, ui }
      };
    }

    case 'SET_ALL_SECTIONS': {
      const expand = action.payload;
      const ui = { ...state.settings.ui };
      Object.keys(DEFAULT_UI_SETTINGS).forEach(k => {
        if (k === 'questionsOpen') {
          ui[k] = true; // Always open
        } else {
          ui[k] = expand;
        }
      });
      return {
        ...state,
        settings: { ...state.settings, ui }
      };
    }

    case 'SET_DAILY_GOAL_TARGET': {
      return {
        ...state,
        dailyGoal: { ...state.dailyGoal, target: action.payload }
      };
    }

    case 'SET_ACTIVE_QUESTION':
      return { ...state, activeQuestionId: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'IMPORT_DATA': {
      const data = action.payload;
      const newState = { ...state };
      if (data.progress) newState.progress = data.progress;
      if (data.notes) newState.notesStore = data.notes;
      if (data.settings) {
        newState.settings = data.settings;
        if (!newState.settings.ui) newState.settings.ui = { ...DEFAULT_UI_SETTINGS };
        else newState.settings.ui = { ...DEFAULT_UI_SETTINGS, ...newState.settings.ui };
      }
      if (data.activity) newState.activity = data.activity;
      if (data.dailyGoal) newState.dailyGoal = data.dailyGoal;

      // Re-merge defaults for all questions
      const progress = { ...newState.progress };
      state.rawQuestions.forEach(q => {
        if (!progress[q.id]) progress[q.id] = defaultProgressFor();
      });
      newState.progress = progress;

      return newState;
    }

    case 'RESET_ALL': {
      const progress = {};
      state.rawQuestions.forEach(q => {
        progress[q.id] = defaultProgressFor();
      });
      localStorage.removeItem(K.progress);
      localStorage.removeItem(K.notes);
      localStorage.removeItem(K.activity);
      localStorage.removeItem(K.dailyGoal);
      return {
        ...state,
        progress,
        notesStore: {},
        activity: {},
        dailyGoal: { target: 5, date: todayStr(), count: 0 }
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, null, getInitialState);

  // Persist to localStorage + Firestore on state changes
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    if (
      prev.progress !== state.progress ||
      prev.notesStore !== state.notesStore ||
      prev.settings !== state.settings ||
      prev.activity !== state.activity ||
      prev.dailyGoal !== state.dailyGoal
    ) {
      persistAll(state);
    }
    prevStateRef.current = state;
  }, [state.progress, state.notesStore, state.settings, state.activity, state.dailyGoal]);

  // Apply theme to document body
  useEffect(() => {
    document.body.classList.toggle("light", state.settings.theme === "light");
  }, [state.settings.theme]);

  // Sync progress to Firestore when individual question changes
  const saveProgressToDB = useCallback((id) => {
    if (isAuthenticated() && state.progress[id]) {
      saveProgressDB(id, state.progress[id]);
    }
  }, [state.progress]);

  const saveNoteTooDB = useCallback((id) => {
    if (isAuthenticated()) {
      saveNoteDB(id, state.notesStore[id] || "");
    }
  }, [state.notesStore]);

  const saveActivityToDB = useCallback((dateStr, count) => {
    if (isAuthenticated()) {
      saveActivityDB(dateStr, count);
    }
  }, []);

  const value = {
    state,
    dispatch,
    saveProgressToDB,
    saveNoteTooDB,
    saveActivityToDB,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
