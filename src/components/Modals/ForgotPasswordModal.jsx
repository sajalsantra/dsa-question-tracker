import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ForgotPasswordModal({
  isOpen,
  initialEmail = '',
  onClose,
  onToast,
}) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
    setError('');
    setSuccess(false);
  }, [initialEmail, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await resetPassword(email.trim());
      if (res.success) {
        setSuccess(true);
        if (onToast) onToast('Password reset link sent to your email! 📧');
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setError(res.error || 'Failed to send reset email.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay open"
      id="forgotPasswordOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Reset Password</div>
            <div className="modal-sub">We'll send a secure password recovery link to your inbox</div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="modal-field-full">
            <label htmlFor="resetEmail">Email Address</label>
            <input
              type="email"
              id="resetEmail"
              required
              placeholder="you@example.com"
              className="input-text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={success || loading}
            />
          </div>

          {error && <div className="auth-error-msg">{error}</div>}
          {success && (
            <div style={{ color: 'var(--green)', fontSize: '13.5px', marginTop: '4px' }}>
              ✓ Reset email sent! Check your inbox and spam folder.
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={loading || success}
            >
              {loading ? 'Sending…' : 'Send Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
