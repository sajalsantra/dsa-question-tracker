import React, { useState, useEffect } from 'react';
import HeaderStats from './HeaderStats.jsx';
import ProfileDropdown from './ProfileDropdown.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Header({
  kpis,
  streak,
  onOpenAuth,
  onChangePassword,
  onResetProgress,
}) {
  const { state, dispatch } = useAppState();
  const { user, isAuthenticated, signOut, saveState, getProfile } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({ name: '', email: '' });

  const theme = state.settings?.theme || 'dark';

  useEffect(() => {
    if (isAuthenticated && user) {
      getProfile(user).then((prof) => {
        if (prof) setUserProfile(prof);
      });
    } else {
      setUserProfile({ name: '', email: '' });
    }
  }, [isAuthenticated, user, getProfile]);

  const handleToggleTheme = () => {
    dispatch({ type: 'SET_THEME' });
  };

  // Check if all sections are expanded
  const ui = state.settings?.ui || {};
  const areAllExpanded =
    ui.questionsOpen &&
    ui.filtersOpen &&
    ui.revOpen &&
    ui.dataMgmtOpen &&
    ui.dashboardGroupOpen &&
    ui.insightsOpen &&
    ui.streakGoalOpen &&
    ui.analyticsOpen;

  const handleToggleAllSections = () => {
    dispatch({ type: 'SET_ALL_SECTIONS', open: !areAllExpanded });
  };

  const handleAuthBtnClick = (e) => {
    e.stopPropagation();
    if (isAuthenticated) {
      setProfileMenuOpen((prev) => !prev);
    } else {
      onOpenAuth('login');
    }
  };

  const handleLogout = async () => {
    await signOut();
    setProfileMenuOpen(false);
  };

  // Save indicator display
  let indicatorCls = 'saved';
  let indicatorText = '🟢 Saved';
  if (saveState === 'saving') {
    indicatorCls = 'saving';
    indicatorText = '🟡 Saving...';
  } else if (saveState === 'error') {
    indicatorCls = 'error';
    indicatorText = '🔴 Sync Error';
  } else if (!navigator.onLine) {
    indicatorCls = 'offline';
    indicatorText = '⚪ Offline';
  }

  const lastUpdatedFormatted = state.settings?.lastUpdated
    ? new Date(state.settings.lastUpdated).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <header className="header">
      <div className="header-top">
        <div className="brand-mark">
          <div className="brand-icon">&lt;/&gt;</div>
          <div>
            <h1>DSA Question Tracker</h1>
            <div className="subtitle">
              Master Data Structures &amp; Algorithms — Track → Solve → Revise → Repeat
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className={`save-indicator ${indicatorCls}`} id="saveIndicator" title="Data synchronization status">
            {indicatorText}
          </div>
          <button type="button" className="btn danger" id="resetProgressBtn" onClick={onResetProgress}>
            Reset Progress
          </button>
          <button
            type="button"
            className="btn"
            id="toggleAllSectionsBtn"
            title={areAllExpanded ? 'Collapse all sections' : 'Expand all sections'}
            onClick={handleToggleAllSections}
          >
            {areAllExpanded ? '📁 Close All' : '📂 Expand All'}
          </button>
          <button
            type="button"
            className="icon-btn"
            id="themeToggle"
            title="Toggle theme"
            aria-label="Toggle theme"
            onClick={handleToggleTheme}
          >
            {theme === 'light' ? '☀️' : '🌙'}
          </button>

          <div className="profile-dropdown-wrap" id="profileDropdownWrap">
            <button
              type="button"
              className="btn accent-btn profile-btn"
              id="authUserBtn"
              aria-expanded={profileMenuOpen}
              aria-haspopup="true"
              onClick={handleAuthBtnClick}
            >
              {isAuthenticated && (
                <span className="user-avatar" id="userAvatar">
                  {(userProfile.name || user?.email || 'U')[0].toUpperCase()}
                </span>
              )}
              <span id="userNameDisplay">
                {isAuthenticated ? userProfile.name || user?.email : '🔑 Sign In / Sign Up'}
              </span>
              {isAuthenticated && <span className="chev" id="authBtnChev">▾</span>}
            </button>
          </div>
        </div>
      </div>

      <HeaderStats kpis={kpis} streak={streak} />

      <div className="meta-line" id="lastUpdated">
        <span id="authStatusText">
          {isAuthenticated ? 'Synced with Cloud' : 'Local Storage (Guest)'}
        </span>{' '}
        · Last updated: {lastUpdatedFormatted}
      </div>

      <ProfileDropdown
        isOpen={profileMenuOpen}
        onClose={() => setProfileMenuOpen(false)}
        userProfile={userProfile}
        onChangePassword={onChangePassword}
        onLogout={handleLogout}
      />
    </header>
  );
}
