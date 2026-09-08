/**
 * useQuestions Hook
 * Derives merged questions list + applies filters/sort/pagination
 * Replaces: getQuestions() from data.js + renderCards() filtering from rendering.js
 */

import { useMemo } from 'react';
import { useAppState } from '../context/AppContext.jsx';
import { calculateConfidence, defaultProgressFor } from '../utils/helpers.js';
import { applyFilters, applySort } from '../utils/filters.js';
import { PAGE_SIZE } from '../utils/constants.js';

export function useQuestions() {
  const { state } = useAppState();
  const { rawQuestions, progress, notesStore, filters, currentPage } = state;

  // Merge raw questions with progress + notes (equivalent of getQuestions())
  const allQuestions = useMemo(() => {
    return rawQuestions.map(q => {
      const prog = progress[q.id] || defaultProgressFor();
      let confidence = Number(prog.confidence);
      if (isNaN(confidence) || (confidence === 0 && (prog.attempts > 0 || prog.timeTaken > 0))) {
        confidence = calculateConfidence(prog.attempts, prog.timeTaken, q.stars);
      }
      return {
        ...q,
        ...prog,
        confidence,
        notes: notesStore[q.id] || ""
      };
    });
  }, [rawQuestions, progress, notesStore]);

  // Apply filters + sort
  const filteredQuestions = useMemo(() => {
    const filtered = applyFilters(allQuestions, filters);
    return applySort(filtered, filters.sort);
  }, [allQuestions, filters]);

  // Apply pagination
  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));
  const startIndex = (safePage - 1) * PAGE_SIZE;

  const paginatedQuestions = useMemo(() => {
    return filteredQuestions.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredQuestions, startIndex]);

  return {
    allQuestions,
    filteredQuestions,
    paginatedQuestions,
    totalPages,
    currentPage: safePage,
    resultCount: filteredQuestions.length,
  };
}
