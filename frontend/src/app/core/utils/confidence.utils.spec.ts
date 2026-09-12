import { calculateConfidence, getConfidenceDescriptor } from './confidence.utils';

describe('Confidence Utils', () => {
  describe('calculateConfidence', () => {
    it('should return 0 when attempts and time are 0', () => {
      expect(calculateConfidence(0, 0, 1)).toBe(0);
    });

    it('should return 100 for 1 attempt within target baseline time for all star levels', () => {
      expect(calculateConfidence(1, 5, 1)).toBe(100);  // 1 star: <= 5 min
      expect(calculateConfidence(1, 8, 2)).toBe(100);  // 2 star: <= 8 min
      expect(calculateConfidence(1, 12, 3)).toBe(100); // 3 star: <= 12 min
      expect(calculateConfidence(1, 16, 4)).toBe(100); // 4 star: <= 16 min
      expect(calculateConfidence(1, 20, 5)).toBe(100); // 5 star: <= 20 min
    });

    it('should return 100 when timeTaken is below target baseline for 1 attempt', () => {
      expect(calculateConfidence(1, 2, 1)).toBe(100);
      expect(calculateConfidence(1, 10, 5)).toBe(100);
    });

    it('should apply extra-time penalty when timeTaken exceeds baseline', () => {
      // 1 Star baseline 5 min, rate 1.0 pt/min. 10 min -> 5 min extra -> 5 pt penalty -> 95%
      expect(calculateConfidence(1, 10, 1)).toBe(95);

      // 5 Star baseline 20 min, rate 0.3 pt/min. 40 min -> 20 min extra -> 6 pt penalty -> 94%
      expect(calculateConfidence(1, 40, 5)).toBe(94);
    });

    it('should apply attempt penalty for multiple attempts', () => {
      // 1 Star attempt penalty = 18 pts per extra attempt. 2 attempts, 5 min -> 100 - 18 = 82%
      expect(calculateConfidence(2, 5, 1)).toBe(82);

      // 3 Star attempt penalty = 14 pts per extra attempt. 2 attempts, 12 min -> 100 - 14 = 86%
      expect(calculateConfidence(2, 12, 3)).toBe(86);

      // 5 Star attempt penalty = 10 pts per extra attempt. 3 attempts, 20 min -> 100 - 20 = 80%
      expect(calculateConfidence(3, 20, 5)).toBe(80);
    });

    it('should clamp total score between 0 and 100', () => {
      expect(calculateConfidence(10, 300, 1)).toBe(0);
    });
  });

  describe('getConfidenceDescriptor', () => {
    it('should return correct descriptors', () => {
      expect(getConfidenceDescriptor(90)).toBe('High');
      expect(getConfidenceDescriptor(80)).toBe('High');
      expect(getConfidenceDescriptor(70)).toBe('Medium');
      expect(getConfidenceDescriptor(60)).toBe('Medium');
      expect(getConfidenceDescriptor(50)).toBe('Low');
      expect(getConfidenceDescriptor(40)).toBe('Low');
      expect(getConfidenceDescriptor(30)).toBe('Very Low');
    });
  });
});
