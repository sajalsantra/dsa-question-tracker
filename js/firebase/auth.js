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
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
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
  const auth = getFirebaseAuth();
  return auth.currentUser || currentUser;
}

export function isAuthenticated() {
  const user = getCurrentUser();
  return !!user;
}

export function initAuth(onAuthChangeCallback) {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, (user) => {
    currentUser = user;
    onAuthChangeCallback(currentUser);
  });
}

export async function signUpUser(email, password, name) {
  const auth = getFirebaseAuth();
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
    }
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

export async function sendResetPasswordEmail(email) {
  const auth = getFirebaseAuth();
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw formatAuthError(error, "reset");
  }
}

export async function changeUserPassword(currentPassword, newPassword) {
  const auth = getFirebaseAuth();
  const user = auth.currentUser || currentUser;
  if (!user || !user.email) {
    throw new Error('Please log in again before changing your password.');
  }
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  } catch (error) {
    throw formatAuthError(error, "change_pass");
  }
}

export function formatAuthError(error, context = "") {
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
      message = 'The new password is too weak. Please use at least 6 characters.';
      break;
    case 'auth/user-not-found':
      if (context === "reset") {
        // Return clear user message without exposing user registration status unnecessarily
        message = 'If an account exists for this email address, check your inbox for instructions to reset your password.';
      } else {
        message = 'Invalid email or password. Please check your credentials and try again.';
      }
      break;
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      if (context === "change_pass") {
        message = 'The current password is incorrect. Please check and try again.';
      } else {
        message = 'Invalid email or password. Please check your credentials and try again.';
      }
      break;
    case 'auth/requires-recent-login':
      message = 'Please log in again before changing your password.';
      break;
    case 'auth/too-many-requests':
      message = 'Access to this account has been temporarily disabled due to many requests. Try again later.';
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
