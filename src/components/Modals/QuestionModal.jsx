import React, { useEffect } from 'react';
import { useAppState } from '../../context/AppContext.jsx';
import { starStr, slug, getConfidenceDescriptor } from '../../utils/helpers.js';
import { STATUSES, STATUS_EMOJI } from '../../utils/constants.js';

export default function QuestionModal({
  questionId,
  onClose,
  onToast,
}) {
  const { state, dispatch } = useAppState();

  const rawQ = state.rawQuestions.find((q) => q.id === questionId);
  const progress = (questionId && state.progress[questionId]) || {};
  const note = (questionId && state.notesStore[questionId]) || '';

  const q = rawQ
    ? {
        ...rawQ,
        ...progress,
        notes: note,
        confidence: progress.confidence ?? 0,
        attempts: progress.attempts ?? 0,
        timeTaken: progress.timeTaken ?? 0,
        status: progress.status || 'Not Started',
        lastSolved: progress.lastSolved || '',
        favorite: !!progress.favorite,
      }
    : null;

  useEffect(() => {
    if (!questionId) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [questionId, onClose]);

  if (!q) return null;

  const handleStatusClick = (status) => {
    dispatch({ type: 'SET_STATUS', id: q.id, status });
    if (onToast) onToast(`Marked as ${status}`);
  };

  const handleConfidenceChange = (e) => {
    const val = Number(e.target.value) || 0;
    dispatch({ type: 'SET_CONFIDENCE', id: q.id, confidence: val });
  };

  const handleAttemptsChange = (e) => {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
    dispatch({ type: 'SET_ATTEMPTS', id: q.id, attempts: val });
  };

  const handleTimeChange = (e) => {
    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
    dispatch({ type: 'SET_TIME', id: q.id, timeTaken: val });
  };

  const handleNotesChange = (e) => {
    dispatch({ type: 'SET_NOTE', id: q.id, note: e.target.value });
  };

  const handleToggleFavorite = () => {
    dispatch({ type: 'TOGGLE_FAVORITE', id: q.id });
    if (onToast) onToast(q.favorite ? 'Removed from favorites' : 'Added to favorites ⭐');
  };

  const handleResetQuestion = () => {
    dispatch({ type: 'RESET_QUESTION', id: q.id });
    if (onToast) onToast('Question status reset');
  };

  return (
    <div
      className="modal-overlay open"
      id="modalOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title" id="mTitle">
              {q.title}
            </div>
            <div className="modal-sub" id="mSub">
              {q.platform} · {q.topic} · {q.pattern}
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            id="modalCloseBtn"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-grid">
          <div className="modal-field">
            <div className="k">Platform</div>
            <div className="v" id="mPlatform">
              {q.platform || '—'}
            </div>
          </div>
          <div className="modal-field">
            <div className="k">Difficulty</div>
            <div className="v" id="mDifficulty">
              <span className={`diff-badge diff-${q.stars}`}>{starStr(q.stars)}</span>
            </div>
          </div>
          <div className="modal-field">
            <div className="k">Topic</div>
            <div className="v" id="mTopic">
              {q.topic || '—'}
            </div>
          </div>
          <div className="modal-field">
            <div className="k">Pattern</div>
            <div className="v" id="mPattern">
              {q.pattern || '—'}
            </div>
          </div>
          <div className="modal-field">
            <div className="k">Problem Link</div>
            <div className="v" id="mLinkWrap">
              {q.problemUrl ? (
                <a
                  id="mLink"
                  href={q.problemUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Problem →
                </a>
              ) : (
                'No link available'
              )}
            </div>
          </div>
          <div className="modal-field">
            <div className="k">Last Solved</div>
            <div className="v" id="mLastSolved">
              {q.lastSolved || 'Not solved yet'}
            </div>
          </div>
        </div>

        <div className="modal-status-row" id="mStatusRow">
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`status-pick ${s === q.status ? `active ${slug(s)}` : ''}`}
              onClick={() => handleStatusClick(s)}
            >
              {STATUS_EMOJI[s]} {s}
            </button>
          ))}
        </div>

        <div className="modal-slider-row">
          <label>
            <span>Confidence</span>
            <span id="mConfVal">
              {q.confidence}% ({getConfidenceDescriptor(q.confidence)})
            </span>
          </label>
          <input
            type="range"
            id="mConfidence"
            min="0"
            max="100"
            step="5"
            value={q.confidence}
            onChange={handleConfidenceChange}
          />
        </div>

        <div className="modal-grid">
          <div className="modal-field-full">
            <label htmlFor="mAttempts">Attempts</label>
            <input
              type="number"
              min="0"
              id="mAttempts"
              value={q.attempts || ''}
              onChange={handleAttemptsChange}
            />
          </div>
          <div className="modal-field-full">
            <label htmlFor="mTime">Time Taken (min)</label>
            <input
              type="number"
              min="0"
              id="mTime"
              value={q.timeTaken || ''}
              onChange={handleTimeChange}
            />
          </div>
        </div>

        <div className="modal-field-full">
          <label htmlFor="mNotes">Personal Notes</label>
          <textarea
            id="mNotes"
            placeholder="Write your approach, mistakes, edge cases, or important observations…"
            value={q.notes || ''}
            onChange={handleNotesChange}
          />
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn primary"
            id="mMarkSolved"
            onClick={() => handleStatusClick('Solved')}
          >
            ✓ Mark Solved
          </button>
          <button
            type="button"
            className="btn"
            id="mMarkRevision"
            onClick={() => handleStatusClick('Needs Revision')}
          >
            🔁 Needs Revision
          </button>
          <button
            type="button"
            className="btn"
            id="mMarkMastered"
            onClick={() => handleStatusClick('Mastered')}
          >
            ⭐ Mark Mastered
          </button>
          <button
            type="button"
            className="btn"
            id="mFavoriteBtn"
            onClick={handleToggleFavorite}
          >
            {q.favorite ? '★ Remove Favorite' : '☆ Add to Favorites'}
          </button>
          <button
            type="button"
            className="btn danger"
            id="mResetStatus"
            onClick={handleResetQuestion}
          >
            ↺ Reset Status
          </button>
        </div>
      </div>
    </div>
  );
}
