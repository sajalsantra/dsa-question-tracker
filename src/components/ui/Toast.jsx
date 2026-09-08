import React from 'react';

export default function Toast({ message, isVisible }) {
  return (
    <div className={`toast ${isVisible ? 'show' : ''}`} id="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
