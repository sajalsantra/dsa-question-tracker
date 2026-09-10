import { computeStreaks } from './streak.service';

describe('computeStreaks', () => {
  it('should return 0 streak for empty activity', () => {
    const res = computeStreaks({});
    expect(res.current).toBe(0);
    expect(res.longest).toBe(0);
  });

  it('should calculate consecutive days streak correctly', () => {
    const activity = {
      '2026-09-08': 2,
      '2026-09-09': 1,
      '2026-09-10': 3,
    };
    const res = computeStreaks(activity);
    expect(res.longest).toBe(3);
  });

  it('should handle broken streaks correctly', () => {
    const activity = {
      '2026-09-01': 1,
      '2026-09-02': 1,
      '2026-09-05': 1, // gap
      '2026-09-06': 1,
    };
    const res = computeStreaks(activity);
    expect(res.longest).toBe(2);
  });
});
