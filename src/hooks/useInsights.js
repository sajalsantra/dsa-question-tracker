import { useMemo } from 'react';
import { useAppState } from '../context/AppContext.jsx';
import { computeTopicStats, computeRevisionQueue } from '../utils/filters.js';

export function useInsights(allQuestions) {
  const { state } = useAppState();

  const readiness = useMemo(() => {
    const total = allQuestions.length;
    const solved = allQuestions.filter(q => q.status === "Solved" || q.status === "Mastered");
    const solvedRatio = total ? solved.length / total : 0;

    const totalStarWeight = allQuestions.reduce((s, q) => s + q.stars, 0);
    const solvedStarWeight = solved.reduce((s, q) => s + q.stars, 0);
    const diffScore = totalStarWeight ? solvedStarWeight / totalStarWeight : 0;

    const avgConf = solved.length ? solved.reduce((s, q) => s + q.confidence, 0) / solved.length / 100 : 0;

    const revQueue = computeRevisionQueue(allQuestions).length;
    const revComp = solved.length ? Math.max(0, 1 - (revQueue / solved.length)) : 0;

    const topicsCovered = new Set(solved.map(q => q.topic)).size;
    const topicCov = state.totalTopics.length ? topicsCovered / state.totalTopics.length : 0;

    const score = Math.round(100 * (0.4 * solvedRatio + 0.2 * diffScore + 0.2 * avgConf + 0.1 * revComp + 0.1 * topicCov));

    let tag = "Beginner", color = "var(--red)";
    if (score > 85) { tag = "Strong"; color = "var(--green)"; }
    else if (score >= 71) { tag = "Interview Ready"; color = "var(--accent)"; }
    else if (score >= 51) { tag = "Developing"; color = "var(--blue)"; }
    else if (score >= 31) { tag = "Learning"; color = "var(--orange)"; }

    return { score, tag, color };
  }, [allQuestions, state.totalTopics]);

  const weakTopics = useMemo(() => {
    const stats = computeTopicStats(allQuestions, state.totalTopics).filter(s => s.total > 0);
    return [...stats]
      .sort((a, b) => (a.completion + a.avgConf) - (b.completion + b.avgConf))
      .slice(0, 3);
  }, [allQuestions, state.totalTopics]);

  const recommendations = useMemo(() => {
    const stats = computeTopicStats(allQuestions, state.totalTopics);
    const weakTopicNames = [...stats]
      .sort((a, b) => (a.completion + a.avgConf) - (b.completion + b.avgConf))
      .map(s => s.topic);
    const revQueue = computeRevisionQueue(allQuestions).filter(q => q.priority === "High");
    const unsolved = allQuestions.filter(q => q.status === "Unsolved" || q.status === "Not Started");

    const picks = [];
    const seen = new Set();
    function add(q) {
      if (q && !seen.has(q.id) && picks.length < 5) {
        seen.add(q.id);
        picks.push(q);
      }
    }

    weakTopicNames.forEach(t => {
      if (picks.length >= 5) return;
      const cand = unsolved.filter(q => q.topic === t).sort((a, b) => a.stars - b.stars)[0];
      add(cand);
    });
    revQueue.forEach(q => add(q));
    [...unsolved].sort((a, b) => a.stars - b.stars).forEach(q => add(q));

    return picks;
  }, [allQuestions, state.totalTopics]);

  return { readiness, weakTopics, recommendations };
}
