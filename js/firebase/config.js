/**
 * Firebase Client Configuration Layer
 * Firebase JavaScript SDK Version: 12.18.0 (CDN Modular SDK)
 * Project: dsa-tracker-app-ef41d
 */

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js';

const firebaseConfig = {
  apiKey: "AIzaSyBE5wzVTkdBDTGoGqyOfj450MJDHAwDH1U",
  authDomain: "dsa-tracker-app-ef41d.firebaseapp.com",
  projectId: "dsa-tracker-app-ef41d",
  storageBucket: "dsa-tracker-app-ef41d.firebasestorage.app",
  messagingSenderId: "12277083716",
  appId: "1:12277083716:web:c34cacbb81e3f7c7545611",
  measurementId: "G-6G883D1B4T"
};

export function getFirebaseConfig() {
  if (typeof window !== "undefined" && window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
    return window.FIREBASE_CONFIG;
  }
  return firebaseConfig;
}

let firebaseApp = null;

export function getFirebaseApp() {
  if (!firebaseApp) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      const cfg = getFirebaseConfig();
      firebaseApp = initializeApp(cfg);
    }
  }
  return firebaseApp;
}

let analyticsInstance = null;

export async function getFirebaseAnalytics() {
  if (!analyticsInstance) {
    try {
      if (await isSupported()) {
        const app = getFirebaseApp();
        analyticsInstance = getAnalytics(app);
      }
    } catch (err) {
      console.warn("Firebase Analytics initialization skipped:", err);
    }
  }
  return analyticsInstance;
}
