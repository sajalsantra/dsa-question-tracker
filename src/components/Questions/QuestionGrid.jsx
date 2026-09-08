import React from 'react';
import CollapsibleSection from '../ui/CollapsibleSection.jsx';
import QuestionCard from './QuestionCard.jsx';
import Pagination from './Pagination.jsx';
import { useAppState } from '../../context/AppContext.jsx';

export default function QuestionGrid({
  questions,
  totalFilteredCount,
  totalPages,
  currentPage,
  onOpenQuestion,
  onToggleFavorite,
  onRevise,
}) {
  const { dispatch } = useAppState();

  const handlePageChange = (page) => {
    dispatch({ type: 'SET_PAGE', page });
  };

  return (
    <CollapsibleSection
      id="questionsSection"
      sectionKey="questionsOpen"
      title="📚 Questions"
    >
      {questions.length === 0 ? (
        <div className="empty-state" style={{ gridColumn: '1/-1' }}>
          <div className="emoji">🎯</div>
          <div className="title">No questions found</div>
          <div>Try changing your filters or search keyword.</div>
        </div>
      ) : (
        <>
          <div className="q-grid" id="qGrid">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onOpen={onOpenQuestion}
                onToggleFavorite={onToggleFavorite}
                onRevise={onRevise}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalQuestions={totalFilteredCount}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </CollapsibleSection>
  );
}
