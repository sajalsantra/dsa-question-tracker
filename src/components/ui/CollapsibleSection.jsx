import React from 'react';
import { useAppState } from '../../context/AppContext.jsx';

export default function CollapsibleSection({
  title,
  description,
  sectionKey,
  id,
  className = '',
  actions,
  children,
  style,
}) {
  const { state, dispatch } = useAppState();
  const isOpen = state.settings?.ui?.[sectionKey] ?? true;

  const handleToggle = () => {
    if (sectionKey) {
      dispatch({ type: 'TOGGLE_SECTION', key: sectionKey });
    }
  };

  return (
    <div className={`section ${className}`.trim()} id={id} style={style}>
      <div className="section-head" onClick={handleToggle} style={{ cursor: 'pointer' }}>
        <div>
          <div className="section-title">{title}</div>
          {description && <div className="section-desc">{description}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
          {actions}
          <button
            type="button"
            className={`collapse-btn ${isOpen ? 'open' : ''}`}
            onClick={handleToggle}
            aria-label={`Toggle ${title}`}
          >
            <span className="chev">▾</span>
          </button>
        </div>
      </div>
      <div className={`collapsible-body ${isOpen ? '' : 'collapsed'}`}>
        <div className="collapsible-body-inner">
          {children}
        </div>
      </div>
    </div>
  );
}
