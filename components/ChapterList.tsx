'use client';

import { useState, useEffect } from 'react';
import type { Episode } from '@/types';
import { resolveUrl } from '@/lib/utils';

interface Chapter {
  title: string;
  startTime: number;
}

interface ChapterListProps {
  episode: Episode;
  currentTime: number;
  onSeek: (time: number) => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function ChapterList({ episode, currentTime, onSeek }: ChapterListProps) {
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchChapters = async () => {
    if (chapters) {
      setIsOpen(!isOpen);
      return;
    }

    setIsLoading(true);
    try {
      const url = episode.chaptersUrl
        ? resolveUrl(episode.chaptersUrl)
        : resolveUrl('/podcast-veille/chapters/' + episode.id + '.json');

      const res = await fetch(url);
      if (!res.ok) throw new Error('Not found');
      const data: Chapter[] = await res.json();
      setChapters(data);
      setIsOpen(true);
    } catch {
      setChapters(null);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Find active chapter
  const activeChapterIdx = chapters
    ? chapters.reduce((acc, ch, i) => (currentTime >= ch.startTime ? i : acc), 0)
    : -1;

  // Always show the button - chapters may exist even without explicit URL

  return (
    <div className="border-t border-[#2a2a2a]">
      <button
        onClick={fetchChapters}
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
              <path d="M2 2v10M5 2v10M8 2v10M11 2v10"/>
            </svg>
          )}
          Chapitres
        </span>
        {chapters && (
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="M3 4.5l3 3 3-3"/>
          </svg>
        )}
      </button>

      {error && (
        <p className="px-4 pb-3 text-xs text-[#666]">Chapitres non disponibles pour cet épisode.</p>
      )}

      {isOpen && chapters && chapters.length > 0 && (
        <div className="px-4 pb-4 space-y-1">
          {chapters.map((ch, i) => (
            <button
              key={i}
              onClick={() => onSeek(ch.startTime)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                i === activeChapterIdx
                  ? 'bg-[#1e1410] text-[#e8e8e8]'
                  : 'hover:bg-[#1a1a1a] text-[#999]'
              }`}
            >
              <span className={`text-xs font-mono flex-shrink-0 ${
                i === activeChapterIdx ? 'text-[#e8834a]' : 'text-[#555]'
              }`}>
                {formatTime(ch.startTime)}
              </span>
              <span className="text-sm truncate">{ch.title}</span>
              {i === activeChapterIdx && (
                <span className="flex gap-[2px] items-end h-3 ml-auto flex-shrink-0">
                  {[0, 1, 2].map((j) => (
                    <span
                      key={j}
                      className="inline-block w-[2px] bg-[#e8834a] rounded-sm wave-bar playing"
                      style={{ height: `${4 + j * 2}px` }}
                    />
                  ))}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
