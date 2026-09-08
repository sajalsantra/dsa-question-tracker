import React, { useEffect } from 'react';

export default function AppModal({
  modalState,
  onConfirm,
  onCancel,
}) {
  const {
    isOpen,
    title = 'Notification',
    subtitle = '',
    message = '',
    confirmText = 'OK',
    cancelText = 'Cancel',
    isDanger = false,
    showCancel = false,
  } = modalState || {};

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay open"
      id="appModalOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appModalTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal app-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title" id="appModalTitle">
              {title}
            </div>
            {subtitle && (
              <div className="modal-sub" id="appModalSub">
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            className="modal-close"
            id="appModalCloseBtn"
            aria-label="Close modal"
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        <div className="modal-body-text" id="appModalMessage">
          {message}
        </div>

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          {showCancel && (
            <button
              type="button"
              className="btn"
              id="appModalCancelBtn"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            className={`btn ${isDanger ? 'danger' : 'primary'}`}
            id="appModalConfirmBtn"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
