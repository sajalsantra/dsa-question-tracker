import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StreakService } from '../../core/services/streak.service';
import { ActivityService } from '../../core/services/activity.service';

@Component({
  selector: 'app-streak-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">🔥 Streak & Daily Goals</h1>
        <p class="page-sub">Build solving consistency and track your daily coding habits</p>
      </div>

      <div class="grid-layout">

        <!-- Streak Stats Card -->
        <div class="card">
          <div class="card-title">🔥 Current Streak</div>
          <div class="streak-hero">
            <div class="streak-num">{{ streakService.streak().current }}</div>
            <div class="streak-label">Days Active</div>
          </div>
          <div class="streak-sub">
            Longest Streak: <strong>{{ streakService.streak().longest }} days</strong>
          </div>
        </div>

        <!-- Daily Goal Card -->
        <div class="card">
          <div class="card-title">🎯 Daily Goal Progress</div>
          <div class="goal-box">
            <div class="goal-info">
              <span class="goal-count">
                <strong>{{ activityService.dailyGoal().count }}</strong> / {{ activityService.dailyGoal().target }} solved today
              </span>
              <span class="goal-status">
                @if (activityService.dailyGoal().count >= activityService.dailyGoal().target) {
                  🎉 Goal Completed!
                } @else {
                  {{ activityService.dailyGoal().target - activityService.dailyGoal().count }} more to go
                }
              </span>
            </div>

            <div class="goal-progress-bar">
              <div class="goal-fill" [style.width.%]="goalPct()"></div>
            </div>

            <div class="target-setter">
              <label>Set Daily Target:</label>
              <div class="target-chips">
                @for (t of [3, 5, 10, 15]; track t) {
                  <button
                    class="chip-btn"
                    [class.active]="activityService.dailyGoal().target === t"
                    (click)="activityService.setGoalTarget(t)"
                  >
                    {{ t }} / day
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Heatmap Card -->
        <div class="card wide">
          <div class="card-title">📅 Activity Heatmap (Last 180 Days)</div>
          <div class="heatmap-grid">
            @for (day of heatmapDays(); track day.date) {
              <div
                class="heat-cell"
                [ngClass]="heatColor(day.count)"
                [title]="day.date + ': ' + day.count + ' problems solved'"
              ></div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 700; color: var(--text); }
    .page-sub { font-size: 13px; color: var(--text-dim); margin-top: 4px; }

    .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .card { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
    .card.wide { grid-column: span 2; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 16px; }

    .streak-hero { text-align: center; padding: 20px 0; }
    .streak-num { font-size: 56px; font-weight: 800; color: var(--orange); line-height: 1; }
    .streak-label { font-size: 13px; color: var(--text-dim); margin-top: 4px; }
    .streak-sub { font-size: 12px; color: var(--text-dim); text-align: center; border-top: 1px solid var(--border); padding-top: 12px; }

    .goal-box { display: flex; flex-direction: column; gap: 14px; }
    .goal-info { display: flex; justify-content: space-between; font-size: 13px; color: var(--text); }
    .goal-status { font-weight: 600; color: var(--accent); }
    .goal-progress-bar { height: 10px; background: var(--bg-3); border-radius: 99px; overflow: hidden; }
    .goal-fill { height: 100%; background: linear-gradient(90deg, var(--green), #10B981); border-radius: 99px; transition: width 0.3s; }

    .target-setter { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-dim); }
    .target-chips { display: flex; gap: 6px; }
    .chip-btn {
      padding: 5px 10px; border-radius: 6px; border: 1px solid var(--border);
      background: var(--bg-3); color: var(--text); font-size: 11px; font-weight: 600;
    }
    .chip-btn.active { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }

    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(30, 1fr);
      gap: 4px;
      padding: 10px 0;
    }
    .heat-cell {
      aspect-ratio: 1;
      border-radius: 3px;
      background: var(--bg-3);
    }
    .heat-cell.l1 { background: rgba(47, 209, 128, 0.25); }
    .heat-cell.l2 { background: rgba(47, 209, 128, 0.50); }
    .heat-cell.l3 { background: rgba(47, 209, 128, 0.75); }
    .heat-cell.l4 { background: #2FD180; }

    @media (max-width: 768px) {
      .grid-layout { grid-template-columns: 1fr; }
      .card.wide { grid-column: span 1; }
      .heatmap-grid { grid-template-columns: repeat(15, 1fr); }
    }
  `]
})
export class StreakGoalsComponent {
  readonly streakService = inject(StreakService);
  readonly activityService = inject(ActivityService);

  goalPct(): number {
    const g = this.activityService.dailyGoal();
    if (!g.target) return 0;
    return Math.min(100, Math.round((g.count / g.target) * 100));
  }

  heatmapDays(): { date: string; count: number }[] {
    const activity = this.activityService.activity();
    const days: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = 179; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      days.push({ date: ds, count: activity[ds] ?? 0 });
    }

    return days;
  }

  heatColor(count: number): string {
    if (count >= 5) return 'l4';
    if (count >= 3) return 'l3';
    if (count >= 2) return 'l2';
    if (count >= 1) return 'l1';
    return '';
  }
}
