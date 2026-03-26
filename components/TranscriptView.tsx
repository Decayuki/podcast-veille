'use client';

import { useState, useEffect, useRef } from 'react';
import type { Episode } from '@/types';
import { resolveUrl } from '@/lib/utils';

interface TranscriptLine {
  speaker: string;
  text: string;
}

interface TranscriptViewProps {
  episode: Episode;
  currentTime: number;
  chapters?: { title: string; startTime: number }[];
}

export default function TranscriptView({ episode, currentTime, chapters }: TranscriptViewProps) {
  const [transcript, setTranscript] = useState<TranscriptLine[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const fetchTranscript = async () => {
    if (transcript) {
      setIsOpen(!isOpen);
      return;
    }

    setIsLoading(true);
    setError(false);

    try {
      const url = episode.transcriptUrl
        ? resolveUrl(episode.transcriptUrl)
        : resolveUrl('/podcast-veille/transcripts/' + episode.id + '.json');

      const res = await fetch(url);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setTranscript(data.dialogue || data);
      setIsOpen(true);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to approximate current line based on time
  useEffect(() => {
    if (!isOpen || !transcript || !activeLineRef.current) return;
    activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentTime, isOpen, transcript]);

  // Estimate which line is active based on currentTime and total duration
  const activeLine = transcript
    ? Math.min(
        Math.floor((currentTime / (episode.durationSeconds || 1)) * transcript.length),
        transcript.length - 1
      )
    : -1;

  return (
    <div className="border-t border-[#2a2a2a]">
      <button
        onClick={fetchTranscript}
        disabled={isLoading}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#999] hover:text-[#e8e8e8] transition-colors"
      >
        <span className="flex items-center gap-2">
          {isLoading ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" opacity="0.3"/>
              <path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M2 3h10M2 6h8M2 9h6M2 12h9"/>
            </svg>
          )}
          Transcript
        </span>
        {transcript && (
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M3 4.5l3 3 3-3"/>
          </svg>
        )}
      </button>

      {isOpen && transcript && (
        <div className="max-h-64 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin">
          {transcript.map((line, i) => (
            <div
              key={i}
              ref={i === activeLine ? activeLineRef : undefined}
              className={`text-[13px] leading-relaxed transition-colors ${
                i === activeLine
                  ? 'text-[#e8e8e8]'
                  : 'text-[#666]'
              }`}
            >
              <span className={`font-semibold ${
                line.speaker.toLowerCase() === 'denise' ? 'text-[#e8834a]' : 'text-[#6ba3d6]'
              }`}>
                {line.speaker}
              </span>
              {' — '}
              {line.text}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="px-4 pb-3 text-xs text-[#666]">Transcript non disponible pour cet épisode.</p>
      )}
    </div>
  );
}
