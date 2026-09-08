import React, { useRef, useEffect } from 'react';

export default function ProfileDropdown({
  isOpen,
  onClose,
  userProfile,
  onChangePassword,
  onLogout,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      ref={menuRef}
      className={`profile-dropdown-menu ${isOpen ? 'open' : ''}`}
      id="profileDropdown"
    >
      <div className="dropdown-header">
        <div className="dropdown-name" id="dropdownUserName">
          {userProfile?.name || 'User Name'}
        </div>
        <div className="dropdown-email" id="dropdownUserEmail">
          {userProfile?.email || 'user@example.com'}
        </div>
      </div>
      <div className="dropdown-divider" />
      <button
        type="button"
        className="dropdown-item"
        id="dropdownChangePassBtn"
        onClick={() => {
          onClose();
          onChangePassword();
        }}
      >
        <span>🔑 Change Password</span>
      </button>
      <button
        type="button"
        className="dropdown-item danger"
        id="dropdownLogoutBtn"
        onClick={() => {
          onClose();
          onLogout();
        }}
      >
        <span>🚪 Log Out</span>
      </button>
    </div>
  );
}
