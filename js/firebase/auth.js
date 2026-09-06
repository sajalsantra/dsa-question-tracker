/**
 * Firebase Authentication Abstraction
 * Firebase JavaScript SDK Version: 12.18.0 (CDN Modular SDK)
 * 
 * Provides clean interface wrapping Firebase Authentication operations
 * while isolating Firebase-specific internal details from the UI components.
 */

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js';
import { getFirebaseApp } from './config.js';

let authInstance = null;
let currentUser = null;

export function getFirebaseAuth() {
  if (!authInstance) {
    const app = getFirebaseApp();
    authInstance = getAuth(app);
  }
  return authInstance;
}

export function getCurrentUser() {
  return currentUser;
}

export function isAuthenticated() {
  return !!currentUser;
}

export function initAuth(onAuthChangeCallback) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    onAuthChangeCallback(currentUser);
  });
}

export async function signUpUser(email, password) {
  const auth = getFirebaseAuth();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    return userCredential.user;
  } catch (error) {
    throw formatAuthError(error);
  }
}

export async function signInUser(email, password) {
  const auth = getFirebaseAuth();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    return userCredential.user;
  } catch (error) {
    throw formatAuthError(error);
  }
}

export async function signOutUser() {
  const auth = getFirebaseAuth();
  try {
    await signOut(auth);
    currentUser = null;
  } catch (error) {
    throw formatAuthError(error);
  }
}

export function formatAuthError(error) {
  const code = error ? (error.code || '') : '';
  let message = error ? (error.message || 'Authentication error') : 'Authentication error';
  
  switch (code) {
    case 'auth/email-already-in-use':
      message = 'This email address is already registered. Please sign in instead.';
      break;
    case 'auth/invalid-email':
      message = 'Please enter a valid email address.';
      break;
    case 'auth/weak-password':
      message = 'Password should be at least 6 characters long.';
      break;
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      message = 'Invalid email or password. Please check your credentials and try again.';
      break;
    case 'auth/too-many-requests':
      message = 'Access to this account has been temporarily disabled due to many failed login attempts. Try again later.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your internet connection.';
      break;
    case 'auth/api-key-invalid':
    case 'auth/invalid-api-key':
      message = 'Invalid Firebase API Key. Please verify your project configuration in Firebase Console.';
      break;
    default:
      if (message.includes('Firebase:')) {
        message = message.replace(/^Firebase:\s*/, '').replace(/\s*\(auth\/.*\)\.?$/, '').trim();
      }
      break;
  }
  const err = new Error(message);
  err.code = code;
  return err;
}
