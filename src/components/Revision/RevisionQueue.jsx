import React, { useState, useMemo } from 'react';
import CollapsibleSection from '../ui/CollapsibleSection.jsx';
import { computeRevisionQueue } from '../../utils/filters.js';
import { starStr } from '../../utils/helpers.js';

export default function RevisionQueue({
  allQuestions,
  onOpenQuestion,
  onMarkMastered,
}) {
  const [visibleCount, setVisibleCount] = useState(30);

  const queue = useMemo(() => {
    return computeRevisionQueue(allQuestions);
  }, [allQuestions]);

  const shown = queue.slice(0, visibleCount);
  const remaining = queue.length - shown.length;

  return (
    <CollapsibleSection
      id="revSection"
      sectionKey="revOpen"
      title="🔁 Revision Queue"
      description="Auto-populated from low confidence, needs-revision, and repeated attempts"
    >
      <div className="rev-grid" id="revGrid">
        {queue.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="emoji">🎉</div>
            <div className="title">No revision questions!</div>
            <div>You're all caught up.</div>
          </div>
        ) : (
          <>
            {shown.map((q) => (
              <div key={q.id} className={`rev-card pri-${q.priority}`} data-id={q.id}>
                <div className={`rev-pri ${q.priority}`}>
                  {q.priority === 'High' ? '🔴' : q.priority === 'Medium' ? '🟡' : '🟢'}{' '}
                  {q.priority} Priority
                </div>
                <div className="rev-title">{q.title}</div>
                <div className="rev-sub">
                  {q.topic} / {q.pattern} · {starStr(q.stars)}
                </div>
                <div className="rev-meta">
                  <span>Confidence: {q.confidence}%</span>
                  <span>{q.lastSolved ? `${q.daysSince}d ago` : 'Not solved'}</span>
                </div>
                <div className="rev-actions">
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => onOpenQuestion(q.id)}
                  >
                    Revise
                  </button>
                  <button
                    type="button"
                    className="btn small primary"
                    onClick={() => onMarkMastered(q.id)}
                  >
                    Mark Mastered
                  </button>
                </div>
              </div>
            ))}

            {remaining > 0 && (
              <div className="rev-pagination" style={{ gridColumn: '1/-1', textAlign: 'center' }}>
                <button
                  type="button"
                  className="btn small"
                  id="revLoadMoreBtn"
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                >
                  Show More ({remaining} left)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </CollapsibleSection>
  );
}
