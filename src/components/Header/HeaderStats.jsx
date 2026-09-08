import React from 'react';

export default function HeaderStats({ kpis, streak }) {
  const { progressPct, total, solvedOrMastered, unsolved, revision, accuracy } = kpis;

  return (
    <div className="header-stats">
      <div className="hstat">
        <div className="hstat-label">Progress</div>
        <div className="hstat-value accent" id="hsProgress">{progressPct}%</div>
      </div>
      <div className="hstat">
        <div className="hstat-label">Total</div>
        <div className="hstat-value" id="hsTotal">{total}</div>
      </div>
      <div className="hstat">
        <div className="hstat-label">Solved</div>
        <div className="hstat-value green" id="hsSolved">{solvedOrMastered}</div>
      </div>
      <div className="hstat">
        <div className="hstat-label">Unsolved</div>
        <div className="hstat-value" id="hsPending">{unsolved}</div>
      </div>
      <div className="hstat">
        <div className="hstat-label">Revision</div>
        <div className="hstat-value" id="hsRevision">{revision}</div>
      </div>
      <div className="hstat">
        <div className="hstat-label">Accuracy</div>
        <div className="hstat-value" id="hsAccuracy">{accuracy}%</div>
      </div>
      <div className="hstat">
        <div className="hstat-label">Streak</div>
        <div className="hstat-value orange" id="hsStreak">{streak} 🔥</div>
      </div>
    </div>
  );
}
