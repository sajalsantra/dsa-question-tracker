import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import CollapsibleSection from '../ui/CollapsibleSection.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { starStr } from '../../utils/helpers.js';
import { computeTopicStats, isRevisionFlagged } from '../../utils/filters.js';
import { todayStr } from '../../utils/constants.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsCharts({ allQuestions }) {
  const { state } = useAppState();
  const isLight = state.settings?.theme === 'light';

  const cc = useMemo(() => ({
    grid: isLight ? 'rgba(30, 41, 71, 0.08)' : '#1C2438',
    text: isLight ? '#5E6883' : '#9AA5BE',
    pendingBg: isLight ? '#98A0B8' : '#5D6785',
  }), [isLight]);

  // 1. Solved by Difficulty
  const starBuckets = [1, 2, 3, 4, 5];
  const solvedByStar = useMemo(() => {
    return starBuckets.map(
      (s) =>
        allQuestions.filter(
          (q) => q.stars === s && (q.status === 'Solved' || q.status === 'Mastered')
        ).length
    );
  }, [allQuestions]);

  const diffChartData = {
    labels: starBuckets.map((s) => starStr(s)),
    datasets: [
      {
        label: 'Solved',
        data: solvedByStar,
        backgroundColor: ['#2FD180', '#8BC34A', '#F5A524', '#F2790C', '#F0546B'],
        borderRadius: 5,
      },
    ],
  };

  const diffChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: cc.text, font: { size: 9 } }, grid: { display: false } },
      y: {
        ticks: { color: cc.text, font: { size: 10 } },
        grid: { color: cc.grid },
        beginAtZero: true,
      },
    },
  };

  // 2. Solved / Pending / Revision
  const solvedCount = useMemo(
    () => allQuestions.filter((q) => q.status === 'Solved' || q.status === 'Mastered').length,
    [allQuestions]
  );
  const pendingCount = useMemo(
    () =>
      allQuestions.filter(
        (q) => q.status === 'Unsolved' || q.status === 'Not Started' || q.status === 'In Progress'
      ).length,
    [allQuestions]
  );
  const revisionCount = useMemo(
    () => allQuestions.filter(isRevisionFlagged).length,
    [allQuestions]
  );

  const statusChartData = {
    labels: ['Solved', 'Pending', 'Revision'],
    datasets: [
      {
        data: [solvedCount, pendingCount, revisionCount],
        backgroundColor: ['#2FD180', cc.pendingBg, '#38BDF8'],
        borderWidth: 0,
      },
    ],
  };

  const statusChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: cc.text, boxWidth: 10, font: { size: 11 } },
      },
    },
    cutout: '65%',
  };

  // 3. Progress Over Time
  const { timeLabels, timeValues } = useMemo(() => {
    const act = state.activity || {};
    const allDatesSorted = Object.keys(act).sort();
    const last14 = allDatesSorted.length > 0 ? allDatesSorted.slice(-14) : [todayStr()];
    let running = 0;
    const cumMap = {};
    allDatesSorted.forEach((d) => {
      running += act[d] || 0;
      cumMap[d] = running;
    });

    return {
      timeLabels: last14.map((d) => d.slice(5)),
      timeValues: last14.map((d) => cumMap[d] || 0),
    };
  }, [state.activity]);

  const timeChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Solved',
        data: timeValues,
        borderColor: '#5B7FFF',
        backgroundColor: 'rgba(91,127,255,0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 2,
      },
    ],
  };

  const timeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: cc.text, font: { size: 10 } }, grid: { color: cc.grid } },
      y: {
        ticks: { color: cc.text, font: { size: 10 } },
        grid: { color: cc.grid },
        beginAtZero: true,
      },
    },
  };

  // 4. Questions by Topic
  const topicCounts = useMemo(() => {
    return (state.totalTopics || []).map(
      (t) => allQuestions.filter((q) => q.topic === t).length
    );
  }, [state.totalTopics, allQuestions]);

  const topicChartData = {
    labels: state.totalTopics || [],
    datasets: [
      {
        label: 'Questions',
        data: topicCounts,
        backgroundColor: '#5B7FFF',
        borderRadius: 5,
        maxBarThickness: 26,
      },
    ],
  };

  const topicChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: cc.text, font: { size: 9 }, maxRotation: 60, minRotation: 60 },
        grid: { display: false },
      },
      y: {
        ticks: { color: cc.text, font: { size: 10 } },
        grid: { color: cc.grid },
        beginAtZero: true,
      },
    },
  };

  // 5. Topic Completion
  const topicStats = useMemo(() => {
    return computeTopicStats(allQuestions, state.totalTopics || []);
  }, [allQuestions, state.totalTopics]);

  const completionChartData = {
    labels: topicStats.map((s) => s.topic),
    datasets: [
      {
        label: 'Completion %',
        data: topicStats.map((s) => s.completion),
        backgroundColor: '#9B6BFF',
        borderRadius: 5,
        maxBarThickness: 16,
      },
    ],
  };

  const completionChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: cc.text, font: { size: 10 } },
        grid: { color: cc.grid },
        max: 100,
        beginAtZero: true,
      },
      y: { ticks: { color: cc.text, font: { size: 9 } }, grid: { display: false } },
    },
  };

  return (
    <CollapsibleSection
      id="analyticsSection"
      sectionKey="analyticsOpen"
      title="📊 Dashboard Analytics"
      description="Updates automatically as you change question statuses"
      style={{ marginBottom: 0 }}
    >
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Solved by Difficulty (★)</h3>
          <div style={{ height: '220px' }}>
            <Bar data={diffChartData} options={diffChartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Solved / Pending / Revision</h3>
          <div style={{ height: '220px' }}>
            <Doughnut data={statusChartData} options={statusChartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Progress Over Time</h3>
          <div style={{ height: '220px' }}>
            <Line data={timeChartData} options={timeChartOptions} />
          </div>
        </div>

        <div className="chart-card wide">
          <h3>Questions by Topic</h3>
          <div style={{ height: '240px' }}>
            <Bar data={topicChartData} options={topicChartOptions} />
          </div>
        </div>

        <div className="chart-card wide">
          <h3>Topic Completion</h3>
          <div style={{ height: '240px' }}>
            <Bar data={completionChartData} options={completionChartOptions} />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
