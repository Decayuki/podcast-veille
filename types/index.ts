export interface Chapter {
  title: string;
  startTime: number;
}

export interface TranscriptLine {
  speaker: string;
  text: string;
}

export interface Episode {
  id: string;
  title: string;
  date: string;
  duration: string;
  durationSeconds: number;
  description: string;
  audioUrl: string;
  size?: number;
  transcriptUrl?: string;
  chaptersUrl?: string;
  coverUrl?: string;
}
