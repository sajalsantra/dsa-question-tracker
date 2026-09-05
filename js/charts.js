import { state } from './state.js';
import { starStr } from './data.js';
import { isRevisionFlagged } from './filters.js';
import { todayStr } from './storage.js';

let charts = {};

function chartColors() {
  return {
    grid: getComputedStyle(document.body).getPropertyValue('--border-soft').trim() || '#1C2438',
    text: getComputedStyle(document.body).getPropertyValue('--text-dim').trim() || '#9AA5BE'
  };
}

function upsertChart(id, config) {
  const canvas = document.getElementById(id);
  if (!canvas || canvas.offsetParent === null) return;
  const ctx = canvas.getContext("2d");
  if (charts[id]) charts[id].destroy();
  if (window.Chart) {
    charts[id] = new window.Chart(ctx, config);
  }
}

export function computeTopicStats(all) {
  return state.totalTopics.map(topic => {
    const qs = all.filter(q => q.topic === topic);
    const solved = qs.filter(q => q.status === "Solved" || q.status === "Mastered").length;
    const avgConf = qs.length ? Math.round(qs.reduce((s, q) => s + q.confidence, 0) / qs.length) : 0;
    const completion = qs.length ? Math.round((solved / qs.length) * 100) : 0;
    return { topic, total: qs.length, solved, avgConf, completion };
  });
}

export function renderCharts(all) {
  if (!state.settings.ui.analyticsOpen) return;
  const cc = chartColors();
  const starBuckets = [1, 2, 3, 4, 5];
  const solvedByStar = starBuckets.map(s => all.filter(q => q.stars === s && (q.status === "Solved" || q.status === "Mastered")).length);

  upsertChart("chartDifficulty", {
    type: "bar",
    data: {
      labels: starBuckets.map(s => starStr(s)),
      datasets: [{ label: "Solved", data: solvedByStar, backgroundColor: ["#2FD180", "#8BC34A", "#F5A524", "#F2790C", "#F0546B"], borderRadius: 5 }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: cc.text, font: { size: 9 } }, grid: { display: false } },
        y: { ticks: { color: cc.text, font: { size: 10 } }, grid: { color: cc.grid }, beginAtZero: true }
      }
    }
  });

  const solvedCount = all.filter(q => q.status === "Solved" || q.status === "Mastered").length;
  const pendingCount = all.filter(q => q.status === "Unsolved" || q.status === "Not Started" || q.status === "In Progress").length;
  const revisionCount = all.filter(isRevisionFlagged).length;

  upsertChart("chartStatus", {
    type: "doughnut",
    data: {
      labels: ["Solved", "Pending", "Revision"],
      datasets: [{ data: [solvedCount, pendingCount, revisionCount], backgroundColor: ["#2FD180", "#5D6785", "#38BDF8"], borderWidth: 0 }]
    },
    options: {
      plugins: { legend: { position: "bottom", labels: { color: cc.text, boxWidth: 10, font: { size: 11 } } } },
      cutout: "65%"
    }
  });

  const allDatesSorted = Object.keys(state.activity).sort();
  const last14 = allDatesSorted.length ? allDatesSorted.slice(-14) : [todayStr()];
  let running = 0;
  const cumMap = {};
  allDatesSorted.forEach(d => { running += state.activity[d]; cumMap[d] = running; });

  upsertChart("chartTime", {
    type: "line",
    data: {
      labels: last14.map(d => d.slice(5)),
      datasets: [{ label: "Solved", data: last14.map(d => cumMap[d] || 0), borderColor: "#5B7FFF", backgroundColor: "rgba(91,127,255,0.15)", tension: 0.35, fill: true, pointRadius: 2 }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: cc.text, font: { size: 10 } }, grid: { color: cc.grid } },
        y: { ticks: { color: cc.text, font: { size: 10 } }, grid: { color: cc.grid }, beginAtZero: true }
      }
    }
  });

  const topicCounts = state.totalTopics.map(t => all.filter(q => q.topic === t).length);
  upsertChart("chartTopic", {
    type: "bar",
    data: {
      labels: state.totalTopics,
      datasets: [{ label: "Questions", data: topicCounts, backgroundColor: "#5B7FFF", borderRadius: 5, maxBarThickness: 26 }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: cc.text, font: { size: 9 }, maxRotation: 60, minRotation: 60 }, grid: { display: false } },
        y: { ticks: { color: cc.text, font: { size: 10 } }, grid: { color: cc.grid }, beginAtZero: true }
      }
    }
  });

  const stats = computeTopicStats(all);
  upsertChart("chartCompletion", {
    type: "bar",
    data: {
      labels: stats.map(s => s.topic),
      datasets: [{ label: "Completion %", data: stats.map(s => s.completion), backgroundColor: "#9B6BFF", borderRadius: 5, maxBarThickness: 16 }]
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: cc.text, font: { size: 10 } }, grid: { color: cc.grid }, max: 100 },
        y: { ticks: { color: cc.text, font: { size: 9 } }, grid: { display: false } }
      }
    }
  });
}
