export interface UserActivity {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface DailyGoal {
  target: number;
  date: string;  // YYYY-MM-DD — resets daily
  count: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
}
