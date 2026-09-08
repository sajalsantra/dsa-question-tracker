import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onToast,
}) {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  }, [isOpen]);

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
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        if (onToast) onToast('Password changed successfully! 🔐');
        onClose();
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while changing password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay open"
      id="changePasswordOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Change Password</div>
            <div className="modal-sub">Update your account credentials securely</div>
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
            <div className="field-label-row">
              <label htmlFor="currentPassword">Current Password</label>
              <button
                type="button"
                className="toggle-pass-btn"
                onClick={() => setShowCurrent((prev) => !prev)}
              >
                {showCurrent ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showCurrent ? 'text' : 'password'}
              id="currentPassword"
              required
              className="input-text"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="modal-field-full">
            <div className="field-label-row">
              <label htmlFor="newPassword">New Password</label>
              <button
                type="button"
                className="toggle-pass-btn"
                onClick={() => setShowNew((prev) => !prev)}
              >
                {showNew ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showNew ? 'text' : 'password'}
              id="newPassword"
              required
              minLength={6}
              className="input-text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="modal-field-full">
            <div className="field-label-row">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <button
                type="button"
                className="toggle-pass-btn"
                onClick={() => setShowConfirm((prev) => !prev)}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showConfirm ? 'text' : 'password'}
              id="confirmPassword"
              required
              minLength={6}
              className="input-text"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <div className="auth-error-msg">{error}</div>}

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
              disabled={loading}
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
