/**
 * Helper Utility Functions
 * Ported from: js/data.js, js/rendering.js, js/modal.js, js/export-import.js
 */

/**
 * Convert star rating (1-5) to visual star string
 * From: data.js L6-9
 */
export function starStr(n) {
  n = Math.max(1, Math.min(5, Number(n) || 1));
  return "★".repeat(n) + "☆".repeat(5 - n);
}

/**
 * Auto-calculate difficulty-aware confidence score (0-100).
 * From: data.js L19-44
 */
export function calculateConfidence(attempts, timeTaken, stars = 3) {
  const att = Math.max(0, Number(attempts) || 0);
  const time = Math.max(0, Number(timeTaken) || 0);

  if (att === 0 && time === 0) return 0;

  const s = Math.max(1, Math.min(5, Number(stars) || 3));
  const a = Math.max(1, att);

  let attemptCoeff = 14;
  let timeCoeff = 0.5;

  if (s <= 2) {
    attemptCoeff = 18;
    timeCoeff = 0.7;
  } else if (s >= 4) {
    attemptCoeff = 10;
    timeCoeff = 0.3;
  }

  const attemptPenalty = (a - 1) * attemptCoeff;
  const timePenalty = Math.min(50, time * timeCoeff);

  const rawScore = 100 - attemptPenalty - timePenalty;
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

/**
 * Default progress object for a question
 * From: data.js L46-49
 */
export function defaultProgressFor() {
  return {
    status: "Not Started",
    revision: false,
    confidence: 0,
    attempts: 0,
    timeTaken: 0,
    lastSolved: "",
    favorite: false,
    notes: ""
  };
}

/**
 * Convert string to URL-safe slug
 * From: rendering.js L9-11
 */
export function slug(s) {
  return s.replace(/\s+/g, "-");
}

/**
 * Get confidence level descriptor
 * From: modal.js L28-34
 */
export function getConfidenceDescriptor(score) {
  const s = Number(score) || 0;
  if (s >= 80) return "High";
  if (s >= 60) return "Medium";
  if (s >= 40) return "Low";
  return "Very Low";
}

/**
 * Download a file with given content
 * From: export-import.js L6-14
 */
export function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
