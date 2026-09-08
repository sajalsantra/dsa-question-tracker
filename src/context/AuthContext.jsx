/**
 * Authentication Context
 * Replaces: auth state from js/auth-ui.js + js/storage.js auth wrappers
 * Separate context to avoid re-rendering entire app on auth events
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  initAuth,
  signInUser,
  signUpUser,
  signOutUser,
  getCurrentUser,
  getUserProfile as fetchUserProfile,
  onSaveStateChange,
  sendResetPasswordEmail,
  changeUserPassword,
  loadUserDataFromDB
} from '../services/storage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children, onAuthDataLoaded }) {
  const [user, setUser] = useState(null);
  const [saveState, setSaveState] = useState("saved");
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Listen to save state changes
    onSaveStateChange((newState) => {
      setSaveState(newState);
    });

    // Initialize Firebase auth
    initAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);

      if (firebaseUser && onAuthDataLoaded) {
        const dbData = await loadUserDataFromDB();
        onAuthDataLoaded(dbData);
      }
    });
  }, []);

  const signIn = useCallback(async (email, password) => {
    const u = await signInUser(email, password);
    setUser(u);
    if (onAuthDataLoaded) {
      const dbData = await loadUserDataFromDB();
      onAuthDataLoaded(dbData);
    }
    return u;
  }, [onAuthDataLoaded]);

  const signUp = useCallback(async (email, password, name) => {
    const u = await signUpUser(email, password, name);
    setUser(u);
    if (onAuthDataLoaded) {
      const dbData = await loadUserDataFromDB();
      onAuthDataLoaded(dbData);
    }
    return u;
  }, [onAuthDataLoaded]);

  const signOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
  }, []);

  const getProfile = useCallback(async (u) => {
    return await fetchUserProfile(u || getCurrentUser());
  }, []);

  const resetPassword = useCallback(async (email) => {
    return await sendResetPasswordEmail(email);
  }, []);

  const changePassword = useCallback(async (currentPwd, newPwd) => {
    return await changeUserPassword(currentPwd, newPwd);
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    authReady,
    saveState,
    signIn,
    signUp,
    signOut,
    getProfile,
    resetPassword,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
