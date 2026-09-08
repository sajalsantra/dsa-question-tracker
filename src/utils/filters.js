/**
 * Filter, Sort, and Computation Utilities
 * Ported from: js/filters.js, js/rendering.js, js/charts.js, js/streak.js
 */

import { todayStr } from './constants.js';

/**
 * Apply all active filters to a questions list
 * From: filters.js L46-64 (modified to take filters as param)
 */
export function applyFilters(list, filters) {
  return list.filter(q => {
    if (filters.search) {
      const s = filters.search.toLowerCase();
      const hay = `${q.title} ${q.topic} ${q.pattern} ${q.platform}`.toLowerCase();
      if (!hay.includes(s)) return false;
    }
    if (filters.topic !== "All" && q.topic !== filters.topic) return false;
    if (filters.difficulty !== "All" && q.stars !== Number(filters.difficulty)) return false;
    if (filters.status !== "All" && q.status !== filters.status) return false;
    if (filters.pattern !== "All" && q.pattern !== filters.pattern) return false;
    if (filters.platform !== "All" && q.platform !== filters.platform) return false;
    if (filters.favorite === "Favorites" && !q.favorite) return false;
    if (filters.confidence !== "All") {
      const [lo, hi] = filters.confidence.split("-").map(Number);
      if (q.confidence < lo || q.confidence > hi) return false;
    }
    return true;
  });
}

/**
 * Apply sort to a questions list
 * From: filters.js L67-78 (modified to take sortKey as param)
 */
export function applySort(list, sortKey) {
  const arr = [...list];
  switch (sortKey) {
    case "difficulty": arr.sort((a, b) => a.stars - b.stars); break;
    case "recent": arr.sort((a, b) => (b.lastSolved || "").localeCompare(a.lastSolved || "")); break;
    case "confidence": arr.sort((a, b) => b.confidence - a.confidence); break;
    case "attempts": arr.sort((a, b) => b.attempts - a.attempts); break;
    case "topic": arr.sort((a, b) => a.topic.localeCompare(b.topic)); break;
    case "alpha": arr.sort((a, b) => a.title.localeCompare(b.title)); break;
  }
  return arr;
}

/**
 * Determine if a question should be flagged for revision
 * From: filters.js L80-101
 */
export function isRevisionFlagged(q) {
  if (q.status === "Mastered") return false;
  if (q.status === "Needs Revision" || q.revision === true) return true;

  if (q.status === "Solved" || q.status === "In Progress") {
    const daysSince = q.lastSolved ? Math.floor((Date.now() - new Date(q.lastSolved).getTime()) / 86400000) : 999;
    const stars = Math.max(1, Math.min(5, Number(q.stars) || 3));

    if (q.confidence < 60) return true;

    const maxAttempts = stars <= 2 ? 2 : (stars >= 4 ? 4 : 3);
    if (q.attempts >= maxAttempts) return true;

    const maxTime = stars <= 2 ? 30 : (stars >= 4 ? 75 : 45);
    if (q.timeTaken >= maxTime) return true;

    if (daysSince > 14 && q.confidence < 80) return true;
    if (daysSince > 30) return true;
  }

  return false;
}

/**
 * Compute the revision queue with priority labels
 * From: rendering.js L19-33
 */
export function computeRevisionQueue(all) {
  return all.filter(q => isRevisionFlagged(q)).map(q => {
    let priority = "Low";
    const daysSince = q.lastSolved ? Math.floor((Date.now() - new Date(q.lastSolved).getTime()) / 86400000) : 999;
    const stars = Math.max(1, Math.min(5, Number(q.stars) || 3));

    const diffWeight = stars <= 2 ? 10 : (stars >= 4 ? 0 : 5);
    let score = (100 - (Number(q.confidence) || 0)) + (daysSince > 7 ? 15 : 0) + (q.attempts >= 3 ? 10 : 0) + diffWeight;

    if (score >= 70) priority = "High";
    else if (score >= 40) priority = "Medium";

    return { ...q, priority, daysSince, revisionPriority: priority };
  }).sort((a, b) => ({ High: 0, Medium: 1, Low: 2 }[a.priority] - { High: 0, Medium: 1, Low: 2 }[b.priority]));
}

/**
 * Compute per-topic statistics
 * From: charts.js L27-35
 */
export function computeTopicStats(all, totalTopics) {
  return totalTopics.map(topic => {
    const qs = all.filter(q => q.topic === topic);
    const solved = qs.filter(q => q.status === "Solved" || q.status === "Mastered").length;
    const avgConf = qs.length ? Math.round(qs.reduce((s, q) => s + q.confidence, 0) / qs.length) : 0;
    const completion = qs.length ? Math.round((solved / qs.length) * 100) : 0;
    return { topic, total: qs.length, solved, avgConf, completion };
  });
}

/**
 * Compute current and longest streaks from activity data
 * From: streak.js L12-37
 */
export function computeStreaks(activity) {
  const dates = Object.keys(activity).filter(d => activity[d] > 0).sort();
  if (dates.length === 0) return { current: 0, longest: 0 };
  const dateSet = new Set(dates);
  let longest = 0, run = 0, prev = null;
  dates.forEach(d => {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else run = 1;
    longest = Math.max(longest, run);
    prev = d;
  });
  let current = 0;
  let cursor = new Date();
  while (true) {
    const ds = cursor.toISOString().slice(0, 10);
    if (dateSet.has(ds)) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (ds === todayStr()) {
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return { current, longest };
}
