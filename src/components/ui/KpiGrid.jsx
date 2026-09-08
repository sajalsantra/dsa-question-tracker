import React from 'react';

export default function KpiGrid({ kpis }) {
  const { total, solved, mastered, unsolved, revision, progressPct, solvedOrMastered } = kpis;

  const cards = [
    { label: 'Total Questions', value: total, sub: 'in dataset', cls: '' },
    { label: 'Not Started', value: unsolved, sub: 'remaining to solve', cls: '' },
    { label: 'Solved', value: solved, sub: `of ${total}`, cls: 'solved' },
    { label: 'Mastered', value: mastered, sub: 'fully confident', cls: 'mastered' },
    { label: 'Revision', value: revision, sub: 'needs review', cls: 'revision' },
    {
      label: 'Overall Progress',
      value: `${progressPct}%`,
      sub: `${solvedOrMastered} / ${total}`,
      cls: 'progress',
      bar: progressPct,
    },
  ];

  return (
    <div className="kpi-grid" id="kpiGrid">
      {cards.map((c, i) => (
        <div key={i} className={`kpi ${c.cls}`.trim()}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value">{c.value}</div>
          <div className="kpi-sub">{c.sub}</div>
          {c.bar !== undefined && (
            <div className="kpi-bar">
              <div
                className="kpi-bar-fill"
                style={{ width: `${c.bar}%`, background: 'var(--accent-grad)' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
