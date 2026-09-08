import { useMemo } from 'react';
import { isRevisionFlagged } from '../utils/filters.js';

export function useKPIs(allQuestions) {
  return useMemo(() => {
    const total = allQuestions.length;
    const solved = allQuestions.filter(q => q.status === "Solved").length;
    const mastered = allQuestions.filter(q => q.status === "Mastered").length;
    const unsolved = allQuestions.filter(q => q.status === "Unsolved" || q.status === "Not Started").length;
    const revision = allQuestions.filter(isRevisionFlagged).length;
    const solvedOrMastered = solved + mastered;
    const progressPct = total ? Math.round((solvedOrMastered / total) * 100) : 0;

    const attemptedQ = allQuestions.filter(q => q.attempts > 0);
    const accuracy = attemptedQ.length
      ? Math.round((attemptedQ.filter(q => q.status === "Solved" || q.status === "Mastered").length / attemptedQ.length) * 100)
      : 0;

    return { total, solved, mastered, unsolved, revision, solvedOrMastered, progressPct, accuracy };
  }, [allQuestions]);
}
