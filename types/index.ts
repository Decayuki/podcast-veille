export interface Episode {
  id: string;
  title: string;
  date: string;
  duration: string;
  durationSeconds: number;
  description: string;
  audioUrl: string;
  size?: number;
}
