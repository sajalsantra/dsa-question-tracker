import React from 'react';
import { starStr, slug } from '../../utils/helpers.js';
import { STATUS_EMOJI } from '../../utils/constants.js';

export default function QuestionCard({
  question,
  onOpen,
  onToggleFavorite,
  onRevise,
}) {
  const isSolved = question.status === 'Solved' || question.status === 'Mastered';
  const isRev = question.revision || question.status === 'Needs Revision';

  return (
    <div
      className="q-card"
      data-id={question.id}
      onClick={() => onOpen(question.id)}
      style={{ cursor: 'pointer' }}
    >
      <div className="q-card-top">
        <div>
          <div className="q-title">{question.title}</div>
          <div className="q-platform">{question.platform}</div>
        </div>
        <button
          type="button"
          className={`fav-btn ${question.favorite ? 'active' : ''}`}
          aria-label="Toggle favorite"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(question.id);
          }}
        >
          {question.favorite ? '★' : '☆'}
        </button>
      </div>

      <div className="q-tags">
        <span className="tag">{question.topic}</span>
        <span className="tag">{question.pattern}</span>
        <span className={`diff-badge diff-${question.stars}`}>{starStr(question.stars)}</span>
      </div>

      <div className="q-status-row-counts">
        <div className={`status-badge status-${slug(question.status)}`}>
          {STATUS_EMOJI[question.status] || '🔴'} {question.status}
        </div>
        {isSolved && (
          <span className="status-count-tag solved">
            ✓ {question.lastSolved ? `Solved: ${question.lastSolved}` : 'Solved'}
          </span>
        )}
        {isRev && <span className="status-count-tag revision">🔁 Revision</span>}
      </div>

      <div>
        <div className="q-stats-row">
          <span>Confidence: {question.confidence}%</span>
          <span>Attempts: {question.attempts}</span>
        </div>
        <div className="q-conf-bar">
          <div className="q-conf-fill" style={{ width: `${question.confidence}%` }} />
        </div>
      </div>

      <div className="q-card-actions">
        {question.problemUrl ? (
          <a
            className="btn small"
            href={question.problemUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Open ↗
          </a>
        ) : (
          <span className="btn small" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            No Link
          </span>
        )}
        <button
          type="button"
          className="btn small"
          onClick={(e) => {
            e.stopPropagation();
            onRevise(question.id);
          }}
        >
          🔁 Revise
        </button>
        <button
          type="button"
          className="btn small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(question.id);
          }}
        >
          {question.favorite ? '★' : '☆'} Fav
        </button>
      </div>
    </div>
  );
}
