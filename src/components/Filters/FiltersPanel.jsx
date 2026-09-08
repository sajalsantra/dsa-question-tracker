import React from 'react';
import CollapsibleSection from '../ui/CollapsibleSection.jsx';
import { useAppState } from '../../context/AppContext.jsx';

export default function FiltersPanel({ resultCount = 0 }) {
  const { state, dispatch } = useAppState();
  const filters = state.filters || {};
  const { totalTopics = [], totalPatterns = [], totalPlatforms = [] } = state;

  const handleChange = (key, value) => {
    dispatch({ type: 'SET_FILTER', key, value });
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  return (
    <CollapsibleSection
      id="filtersSection"
      sectionKey="filtersOpen"
      title="🔍 Search &amp; Filters"
    >
      <div className="filters-grid">
        <div className="field full">
          <label htmlFor="fSearch">Search</label>
          <input
            type="text"
            id="fSearch"
            placeholder="Search by title, topic, pattern, or platform…"
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="fTopic">Topic</label>
          <select
            id="fTopic"
            value={filters.topic || 'All'}
            onChange={(e) => handleChange('topic', e.target.value)}
          >
            <option value="All">All Topics</option>
            {totalTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="fDifficulty">Difficulty</label>
          <select
            id="fDifficulty"
            value={filters.difficulty || 'All'}
            onChange={(e) => handleChange('difficulty', e.target.value)}
          >
            <option value="All">All Difficulties</option>
            <option value="1">★☆☆☆☆ (1)</option>
            <option value="2">★★☆☆☆ (2)</option>
            <option value="3">★★★☆☆ (3)</option>
            <option value="4">★★★★☆ (4)</option>
            <option value="5">★★★★★ (5)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="fStatus">Status</label>
          <select
            id="fStatus"
            value={filters.status || 'All'}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Not Started">🔴 Not Started</option>
            <option value="In Progress">🟡 In Progress</option>
            <option value="Solved">🟢 Solved</option>
            <option value="Mastered">⭐ Mastered</option>
            <option value="Needs Revision">🔁 Needs Revision</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="fPattern">Pattern</label>
          <select
            id="fPattern"
            value={filters.pattern || 'All'}
            onChange={(e) => handleChange('pattern', e.target.value)}
          >
            <option value="All">All Patterns</option>
            {totalPatterns.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="fPlatform">Platform</label>
          <select
            id="fPlatform"
            value={filters.platform || 'All'}
            onChange={(e) => handleChange('platform', e.target.value)}
          >
            <option value="All">All Platforms</option>
            {totalPlatforms.map((pl) => (
              <option key={pl} value={pl}>
                {pl}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="fConfidence">Confidence</label>
          <select
            id="fConfidence"
            value={filters.confidence || 'All'}
            onChange={(e) => handleChange('confidence', e.target.value)}
          >
            <option value="All">Any</option>
            <option value="0-30">0–30%</option>
            <option value="31-60">31–60%</option>
            <option value="61-80">61–80%</option>
            <option value="81-100">81–100%</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="fSort">Sort By</label>
          <select
            id="fSort"
            value={filters.sort || 'difficulty'}
            onChange={(e) => handleChange('sort', e.target.value)}
          >
            <option value="difficulty">Difficulty</option>
            <option value="recent">Recently Solved</option>
            <option value="confidence">Confidence</option>
            <option value="attempts">Attempts</option>
            <option value="topic">Topic</option>
            <option value="alpha">Alphabetical</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="fFavorite">Show</label>
          <select
            id="fFavorite"
            value={filters.favorite || 'All'}
            onChange={(e) => handleChange('favorite', e.target.value)}
          >
            <option value="All">All Questions</option>
            <option value="Favorites">⭐ Favorites Only</option>
          </select>
        </div>
      </div>

      <div className="filters-footer">
        <span className="result-count" id="resultCount">
          {resultCount} question{resultCount !== 1 ? 's' : ''}
        </span>
        <button type="button" className="btn small" id="clearFiltersBtn" onClick={handleClear}>
          Clear Filters
        </button>
      </div>
    </CollapsibleSection>
  );
}
