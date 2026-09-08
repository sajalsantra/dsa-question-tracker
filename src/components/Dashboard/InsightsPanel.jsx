import React from 'react';
import CollapsibleSection from '../ui/CollapsibleSection.jsx';
import { starStr } from '../../utils/helpers.js';

export default function InsightsPanel({ insights, onOpenQuestion }) {
  const { readiness, weakTopics, recommendations } = insights;
  const { score = 0, tag = 'Beginner', color = 'var(--red)' } = readiness || {};

  const circ = 2 * Math.PI * 60;
  const dashOffset = circ - (circ * score) / 100;

  return (
    <CollapsibleSection
      id="insightsSection"
      sectionKey="insightsOpen"
      title="💡 Performance &amp; Interview Insights"
      style={{ marginBottom: 0 }}
    >
      <div className="insight-grid">
        {/* Readiness */}
        <div className="section" style={{ marginBottom: 0 }}>
          <div className="section-title">🎯 Interview Readiness</div>
          <div className="readiness-ring">
            <div className="ring-wrap">
              <svg viewBox="0 0 150 150">
                <circle className="ring-bg" cx="75" cy="75" r="60" />
                <circle
                  className="ring-fg"
                  id="readinessRing"
                  cx="75"
                  cy="75"
                  r="60"
                  style={{
                    strokeDasharray: circ,
                    strokeDashoffset: dashOffset,
                    stroke: color,
                    transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease',
                  }}
                />
              </svg>
              <div className="ring-center">
                <div className="ring-num" id="readinessNum">
                  {score}%
                </div>
                <div className="ring-label">Ready</div>
              </div>
            </div>
            <div
              className="readiness-tag"
              id="readinessTag"
              style={{
                background: `color-mix(in srgb, ${color} 16%, transparent)`,
                color: color,
              }}
            >
              {tag}
            </div>
          </div>
        </div>

        {/* Weak Topics */}
        <div className="section" style={{ marginBottom: 0 }}>
          <div className="section-title">⚠️ Weak Topics</div>
          <div id="weakTopicsList">
            {weakTopics && weakTopics.length > 0 ? (
              weakTopics.map((w, i) => (
                <div key={i} className="weak-item">
                  <div className="weak-top">
                    <span>{w.topic}</span>
                    <span>
                      {w.solved}/{w.total}
                    </span>
                  </div>
                  <div className="weak-bar">
                    <div className="weak-bar-fill" style={{ width: `${w.avgConf}%` }} />
                  </div>
                  <div className="weak-meta">Avg confidence: {w.avgConf}%</div>
                </div>
              ))
            ) : (
              <div className="weak-meta">Not enough data yet.</div>
            )}
          </div>
          <div className="recommend-box" id="recommendationText">
            {weakTopics && weakTopics.length > 0 && weakTopics[0].total > 0 ? (
              <>
                💡 Focus on <strong>{weakTopics[0].topic}</strong> next. You have low completion and
                low confidence in this topic.
              </>
            ) : (
              '💡 Keep solving to unlock recommendations.'
            )}
          </div>
        </div>

        {/* Recommended Next */}
        <div className="section" style={{ marginBottom: 0 }}>
          <div className="section-title">🧭 Recommended Next</div>
          <div id="recommendList">
            {recommendations && recommendations.length > 0 ? (
              recommendations.map((q, i) => (
                <div
                  key={q.id}
                  className="rec-item"
                  data-id={q.id}
                  onClick={() => onOpenQuestion(q.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="rec-num">{i + 1}</div>
                  <div className="rec-info">
                    <div className="rec-title">{q.title}</div>
                    <div className="rec-tags">
                      {q.topic} · {starStr(q.stars)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="weak-meta">You've covered everything — great work! 🎉</div>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
