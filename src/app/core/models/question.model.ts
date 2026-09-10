export interface Question {
  id: number;
  title: string;
  topic: string;
  pattern: string;
  platform: string;
  stars: number; // 1-5 difficulty rating
  problemUrl: string;
}
