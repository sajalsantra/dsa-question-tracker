import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { loadUserDataFromDB } from '../../services/storage.js';

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
  onForgotPassword,
  onToast,
}) {
  const { signIn, signUp } = useAuth();
  const { dispatch } = useAppState();

  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
  }, [initialMode, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSignup = mode === 'signup';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isSignup) {
        if (!name.trim()) {
          setError('Please enter your full name');
          setLoading(false);
          return;
        }
        result = await signUp(email.trim(), password, name.trim());
      } else {
        result = await signIn(email.trim(), password);
      }

      if (result.success) {
        if (onToast) {
          onToast(isSignup ? 'Account created successfully! 🎉' : 'Signed in successfully! 👋');
        }

        // Pull user data from DB and update AppContext
        if (result.user) {
          try {
            const dbData = await loadUserDataFromDB(result.user);
            if (dbData) {
              dispatch({ type: 'LOAD_DB_DATA', payload: dbData });
            }
          } catch (loadErr) {
            console.warn('Could not pull user data from DB:', loadErr);
          }
        }

        onClose();
      } else {
        setError(result.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay open"
      id="authModalOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title" id="authTitle">
              {isSignup ? 'Create your DSA Tracker Account' : 'Sign In to DSA Tracker'}
            </div>
            <div className="modal-sub">
              Save &amp; Sync your progress securely across all devices
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            id="authCloseBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form id="authForm" className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <div className="modal-field-full" id="authNameGroup">
              <label htmlFor="authName">Full Name</label>
              <input
                type="text"
                id="authName"
                placeholder="John Doe"
                className="input-text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignup}
              />
            </div>
          )}

          <div className="modal-field-full">
            <label htmlFor="authEmail">Email Address</label>
            <input
              type="email"
              id="authEmail"
              required
              placeholder="you@example.com"
              className="input-text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="modal-field-full">
            <div className="field-label-row">
              <label htmlFor="authPassword">Password</label>
              {!isSignup && (
                <button
                  type="button"
                  className="btn-link forgot-pass-btn"
                  id="authForgotPasswordBtn"
                  onClick={() => onForgotPassword(email)}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              id="authPassword"
              required
              minLength={6}
              placeholder="••••••••"
              className="input-text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="auth-error-msg" id="authErrorMsg">
              {error}
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button
              type="submit"
              className="btn primary full-width"
              id="authSubmitBtn"
              disabled={loading}
            >
              {loading ? 'Processing…' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          <div className="auth-toggle-row">
            <button
              type="button"
              className="btn-link"
              id="authToggleModeBtn"
              onClick={() => {
                setError('');
                setMode(isSignup ? 'login' : 'signup');
              }}
            >
              {isSignup ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
