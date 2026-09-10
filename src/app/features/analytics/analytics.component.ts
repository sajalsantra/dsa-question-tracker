import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { FilterService } from '../../core/services/filter.service';
import { ProgressService } from '../../core/services/progress.service';
import { ActivityService } from '../../core/services/activity.service';
import { RevisionService } from '../../core/services/revision.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">📈 Analytics & Insights</h1>
        <p class="page-sub">Visual breakdown of your progress, topic coverage, activity timeline, and difficulty distribution</p>
      </div>

      <!-- KPI Summary Cards -->
      <div class="analytics-kpi-grid">
        <div class="kpi-card">
          <span class="kpi-icon">✅</span>
          <div>
            <div class="kpi-val">{{ solvedCount() }}</div>
            <div class="kpi-lbl">Total Solved</div>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">⏳</span>
          <div>
            <div class="kpi-val">{{ pendingCount() }}</div>
            <div class="kpi-lbl">Pending</div>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">🔄</span>
          <div>
            <div class="kpi-val">{{ revisionCount() }}</div>
            <div class="kpi-lbl">Needs Revision</div>
          </div>
        </div>
        <div class="kpi-card">
          <span class="kpi-icon">🎯</span>
          <div>
            <div class="kpi-val">{{ averageConfidence() }}%</div>
            <div class="kpi-lbl">Avg Confidence</div>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">

        <!-- Status Distribution Chart -->
        <div class="card">
          <div class="card-title">🍩 Question Status Breakdown</div>
          <div class="chart-box">
            <canvas
              baseChart
              [data]="statusDoughnutData()"
              [options]="doughnutOptions"
              [type]="'doughnut'"
            ></canvas>
          </div>
        </div>

        <!-- Solved by Difficulty Rating Bar Chart -->
        <div class="card">
          <div class="card-title">📊 Solved by Difficulty Rating</div>
          <div class="chart-box">
            <canvas
              baseChart
              [data]="difficultyBarData()"
              [options]="barOptions"
              [type]="'bar'"
            ></canvas>
          </div>
        </div>

        <!-- Solve Progress Cumulative Timeline -->
        <div class="card wide">
          <div class="card-title">📈 Cumulative Solves Timeline (Last 14 Days)</div>
          <div class="chart-box">
            <canvas
              baseChart
              [data]="timeLineData()"
              [options]="lineOptions"
              [type]="'line'"
            ></canvas>
          </div>
        </div>

        <!-- Questions per Topic Bar Chart -->
        <div class="card wide">
          <div class="card-title">📚 Question Count per Topic</div>
          <div class="chart-box">
            <canvas
              baseChart
              [data]="topicCountBarData()"
              [options]="topicBarOptions"
              [type]="'bar'"
            ></canvas>
          </div>
        </div>

        <!-- Topic Completion Rate Horizontal Chart -->
        <div class="card wide">
          <div class="card-title">🎯 Topic Completion Rate (%)</div>
          <div class="chart-box-lg">
            <canvas
              baseChart
              [data]="topicCompletionBarData()"
              [options]="horizontalBarOptions"
              [type]="'bar'"
            ></canvas>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text); }
    .page-sub { font-size: 13px; color: var(--text-dim); margin-top: 4px; }

    .analytics-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: var(--bg-2, #131A2B);
      border: 1px solid var(--border, #26314A);
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .kpi-icon { font-size: 24px; }
    .kpi-val { font-size: 22px; font-weight: 700; color: var(--text); }
    .kpi-lbl { font-size: 11px; color: var(--text-dim); font-weight: 600; text-transform: uppercase; }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .card {
      background: var(--bg-2, #131A2B);
      border: 1px solid var(--border, #26314A);
      border-radius: 14px;
      padding: 20px;
    }
    .card.wide { grid-column: span 2; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 16px; }

    .chart-box { height: 260px; position: relative; }
    .chart-box-lg { height: 380px; position: relative; }

    @media (max-width: 768px) {
      .charts-grid { grid-template-columns: 1fr; }
      .card.wide { grid-column: span 1; }
    }
  `]
})
export class AnalyticsComponent {
  readonly filterService = inject(FilterService);
  readonly progressService = inject(ProgressService);
  readonly activityService = inject(ActivityService);
  readonly revisionService = inject(RevisionService);

  readonly solvedCount = computed(() =>
    this.filterService.enrichedQuestions().filter(q => q.status === 'Solved' || q.status === 'Mastered').length
  );

  readonly pendingCount = computed(() =>
    this.filterService.enrichedQuestions().filter(q => q.status === 'Not Started' || q.status === 'In Progress').length
  );

  readonly revisionCount = computed(() =>
    this.revisionService.revisionQueue().length
  );

  readonly averageConfidence = computed(() => {
    const solved = this.filterService.enrichedQuestions().filter(q => q.status === 'Solved' || q.status === 'Mastered');
    if (!solved.length) return 0;
    return Math.round(solved.reduce((s, q) => s + q.confidence, 0) / solved.length);
  });

  // Doughnut status breakdown
  readonly statusDoughnutData = computed<ChartData<'doughnut'>>(() => {
    return {
      labels: ['Solved', 'Pending', 'Needs Revision'],
      datasets: [{
        data: [this.solvedCount(), this.pendingCount(), this.revisionCount()],
        backgroundColor: ['#2FD180', '#5D6785', '#38BDF8'],
        borderWidth: 0
      }]
    };
  });

  // Solved by difficulty 1..5 stars
  readonly difficultyBarData = computed<ChartData<'bar'>>(() => {
    const stats = this.filterService.difficultyStats();
    return {
      labels: ['★ Easy', '★★', '★★★ Med', '★★★★', '★★★★★ Hard'],
      datasets: [{
        label: 'Solved',
        data: stats.map(s => s.solved),
        backgroundColor: ['#2FD180', '#8BC34A', '#F5A524', '#F2790C', '#F0546B'],
        borderRadius: 6
      }]
    };
  });

  // Cumulative Solves Timeline (Last 14 active days)
  readonly timeLineData = computed<ChartData<'line'>>(() => {
    const act = this.activityService.activity();
    const sortedDates = Object.keys(act).sort();
    const today = new Date().toISOString().slice(0, 10);
    const dates = sortedDates.length > 0 ? sortedDates.slice(-14) : [today];

    let running = 0;
    const cumMap: Record<string, number> = {};
    for (const d of sortedDates) {
      running += act[d] || 0;
      cumMap[d] = running;
    }

    return {
      labels: dates.map(d => d.slice(5)), // MM-DD format
      datasets: [{
        label: 'Cumulative Solves',
        data: dates.map(d => cumMap[d] || 0),
        borderColor: '#5B7FFF',
        backgroundColor: 'rgba(91, 127, 255, 0.15)',
        tension: 0.35,
        fill: true,
        pointRadius: 3
      }]
    };
  });

  // Question Count per Topic
  readonly topicCountBarData = computed<ChartData<'bar'>>(() => {
    const stats = this.filterService.topicStats();
    return {
      labels: stats.map(s => s.topic),
      datasets: [{
        label: 'Total Questions',
        data: stats.map(s => s.total),
        backgroundColor: '#5B7FFF',
        borderRadius: 6
      }]
    };
  });

  // Topic Completion % Horizontal Bar Chart
  readonly topicCompletionBarData = computed<ChartData<'bar'>>(() => {
    const stats = this.filterService.topicStats();
    return {
      labels: stats.map(s => s.topic),
      datasets: [{
        label: 'Completion %',
        data: stats.map(s => s.completion),
        backgroundColor: '#9B6BFF',
        borderRadius: 6
      }]
    };
  });

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#9AA5BE', font: { family: 'Inter', size: 11 } } }
    }
  };

  readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#9AA5BE', font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { color: '#9AA5BE', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
    },
    plugins: {
      legend: { display: false }
    }
  };

  readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#9AA5BE', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#9AA5BE', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
    },
    plugins: {
      legend: { display: false }
    }
  };

  readonly topicBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { color: '#9AA5BE', font: { size: 9 }, maxRotation: 60, minRotation: 45 }, grid: { display: false } },
      y: { ticks: { color: '#9AA5BE', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
    },
    plugins: {
      legend: { display: false }
    }
  };

  readonly horizontalBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
      x: { max: 100, ticks: { color: '#9AA5BE', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true },
      y: { ticks: { color: '#9AA5BE', font: { size: 10 } }, grid: { display: false } }
    },
    plugins: {
      legend: { display: false }
    }
  };
}
