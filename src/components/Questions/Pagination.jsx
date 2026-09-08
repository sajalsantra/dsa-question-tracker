import React from 'react';
import { PAGE_SIZE } from '../../utils/constants.js';

export default function Pagination({
  currentPage,
  totalPages,
  totalQuestions,
  onPageChange,
}) {
  if (totalQuestions === 0) return null;

  if (totalPages <= 1) {
    return (
      <div className="pagination-wrap" id="paginationWrap">
        <div className="pagination-info">Showing all {totalQuestions} questions</div>
      </div>
    );
  }

  const curPage = Math.max(1, Math.min(totalPages, currentPage));
  const startNum = (curPage - 1) * PAGE_SIZE + 1;
  const endNum = Math.min(curPage * PAGE_SIZE, totalQuestions);

  const pages = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (curPage > 3) pages.push('...');

    const start = Math.max(2, curPage - 1);
    const end = Math.min(totalPages - 1, curPage + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    if (curPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const handlePageClick = (p) => {
    if (typeof p === 'number' && p !== curPage) {
      onPageChange(p);
      const el = document.getElementById('questionsSection');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="pagination-wrap" id="paginationWrap">
      <div className="pagination-info">
        Showing {startNum}–{endNum} of {totalQuestions} questions
      </div>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn prev-btn"
          id="prevPageBtn"
          disabled={curPage === 1}
          onClick={() => handlePageClick(curPage - 1)}
        >
          ← Previous
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={idx} className="page-ellipsis">
              …
            </span>
          ) : (
            <button
              key={idx}
              type="button"
              className={`page-btn num-btn ${p === curPage ? 'active' : ''}`}
              onClick={() => handlePageClick(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="page-btn next-btn"
          id="nextPageBtn"
          disabled={curPage === totalPages}
          onClick={() => handlePageClick(curPage + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
