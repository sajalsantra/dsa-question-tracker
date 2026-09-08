import { useMemo } from 'react';
import { useAppState } from '../context/AppContext.jsx';
import { computeStreaks } from '../utils/filters.js';

export function useStreak() {
  const { state } = useAppState();
  const { activity } = state;

  const streaks = useMemo(() => computeStreaks(activity), [activity]);

  const heatmapData = useMemo(() => {
    const days = [];
    const cursor = new Date();
    for (let i = 181; i >= 0; i--) {
      const d = new Date(cursor);
      d.setDate(cursor.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const c = activity[ds] || 0;
      let lvl = 0;
      if (c >= 1) lvl = 1;
      if (c >= 2) lvl = 2;
      if (c >= 4) lvl = 3;
      if (c >= 6) lvl = 4;
      days.push({ date: ds, count: c, level: lvl });
    }
    return days;
  }, [activity]);

  return { ...streaks, heatmapData };
}
