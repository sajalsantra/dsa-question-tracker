import React, { useMemo } from 'react';
import CollapsibleSection from '../ui/CollapsibleSection.jsx';
import { useAppState } from '../../context/AppContext.jsx';

export default function StreakGoal({ streakData }) {
  const { state, dispatch } = useAppState();
  const { current = 0, longest = 0, heatmap = [], heatmapData = [] } = streakData || {};
  const cells = heatmapData.length > 0 ? heatmapData : heatmap;
  const dailyGoal = state.dailyGoal || { target: 5, count: 0 };

  const target = dailyGoal.target || 5;
  const count = dailyGoal.count || 0;
  const pct = Math.min(100, Math.round((count / target) * 100));
  const isCompleted = count >= target;
  const remaining = Math.max(0, target - count);

  const handleSelectGoal = (newTarget) => {
    dispatch({ type: 'SET_DAILY_GOAL_TARGET', target: newTarget });
  };

  return (
    <CollapsibleSection
      id="streakGoalSection"
      sectionKey="streakGoalOpen"
      title="🔥 Activity &amp; Daily Goals"
      style={{ marginBottom: 0 }}
    >
      <div className="streak-goal-grid">
        {/* Study Streak */}
        <div className="section" style={{ marginBottom: 0 }}>
          <div className="section-title">🔥 Study Streak</div>
          <div className="streak-numbers">
            <div className="streak-num">
              <div className="val" id="curStreak">
                {current}
              </div>
              <div className="lbl">Current streak (days)</div>
            </div>
            <div className="streak-num">
              <div className="val" id="longStreak">
                {longest}
              </div>
              <div className="lbl">🏆 Longest streak</div>
            </div>
          </div>
          <div className="heatmap" id="heatmap">
            {cells.map((cell, idx) => (
              <div
                key={idx}
                className="heat-cell"
                data-lvl={cell.level}
                title={`${cell.date}: ${cell.count} solved`}
              />
            ))}
          </div>
        </div>

        {/* Today's Goal */}
        <div className="section" style={{ marginBottom: 0 }}>
          <div className="section-title">✅ Today's Goal</div>
          <div className="goal-select" id="goalSelect">
            {[3, 5, 10].map((goalNum) => (
              <button
                key={goalNum}
                type="button"
                className={`goal-chip ${target === goalNum ? 'active' : ''}`}
                onClick={() => handleSelectGoal(goalNum)}
              >
                {goalNum} / day
              </button>
            ))}
          </div>
          <div className="goal-progress-wrap">
            <div className="goal-progress-text">
              <span id="goalCountText">
                {count} / {target} Questions
              </span>
              <span id="goalPct">{pct}%</span>
            </div>
            <div className="goal-bar">
              <div
                className="goal-bar-fill"
                id="goalBarFill"
                style={{ width: `${pct}%`, transition: 'width 0.4s ease' }}
              />
            </div>
            <div className={`goal-note ${isCompleted ? 'done' : ''}`} id="goalNote">
              {isCompleted ? '🎉 Goal Completed!' : `${remaining} question${remaining !== 1 ? 's' : ''} remaining`}
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
