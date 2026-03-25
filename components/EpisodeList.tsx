'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import AudioPlayer, { getSavedProgress } from './AudioPlayer';
import SearchBar from './SearchBar';
import DownloadButton from './DownloadButton';
import CoverArt from './CoverArt';
import type { Episode } from '@/types';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function ProgressBar({ episodeId, durationSeconds }: { episodeId: string; durationSeconds: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const saved = getSavedProgress(episodeId);
    if (saved > 0 && durationSeconds > 0) {
      setProgress(Math.min(saved / durationSeconds, 1));
    }
  }, [episodeId, durationSeconds]);

  if (progress <= 0) return null;

  return (
    <div className="mt-2 h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
      <div
        className="h-full bg-[#e8834a] rounded-full transition-all"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

export default function EpisodeList({ episodes }: { episodes: Episode[] }) {
  const [active, setActive] = useState<Episode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Restore last episode on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lastId = localStorage.getItem('podcast-last-episode');
    if (lastId) {
      const ep = episodes.find((e) => e.id === lastId);
      if (ep && getSavedProgress(lastId) > 0) {
        // Don't auto-open, just highlight it
      }
    }
  }, [episodes]);

  const handleSearch = useCallback((q: string) => setSearchQuery(q), []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return episodes;
    const q = searchQuery.toLowerCase();
    return episodes.filter(
      (ep) =>
        ep.title.toLowerCase().includes(q) ||
        (ep.description && ep.description.toLowerCase().includes(q))
    );
  }, [episodes, searchQuery]);

  if (episodes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4 opacity-30">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto">
            <rect x="8" y="16" width="6" height="20" rx="3" fill="#666"/>
            <rect x="17" y="10" width="6" height="28" rx="3" fill="#666"/>
            <rect x="26" y="18" width="6" height="16" rx="3" fill="#666"/>
            <rect x="35" y="12" width="6" height="24" rx="3" fill="#666"/>
          </svg>
        </div>
        <p className="text-[#666] text-sm">Aucun épisode pour l&apos;instant.</p>
        <p className="text-[#444] text-xs mt-1">Le prochain épisode sera généré après la veille.</p>
      </div>
    );
  }

  return (
    <>
      <SearchBar onSearch={handleSearch} />

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#666] text-sm">Aucun résultat pour &laquo; {searchQuery} &raquo;</p>
        </div>
      ) : (
        <div className={`space-y-3 ${active ? 'pb-52' : ''}`}>
          {filtered.map((ep) => (
            <div
              key={ep.id}
              onClick={() => setActive(active?.id === ep.id ? null : ep)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive(active?.id === ep.id ? null : ep); } }}
              className={`w-full text-left rounded-xl border p-4 transition-all active:scale-[0.99] cursor-pointer ${
                active?.id === ep.id
                  ? 'border-[#e8834a] bg-[#1e1410]'
                  : 'border-[#2a2a2a] bg-[#161616] hover:border-[#3a3a3a]'
              }`}
            >
              <div className="flex items-start gap-3">
                <CoverArt episode={ep} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {active?.id === ep.id ? (
                      <span className="flex gap-[2px] items-end h-4">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="inline-block w-[3px] bg-[#e8834a] rounded-sm wave-bar playing"
                            style={{ height: `${8 + i * 4}px` }}
                          />
                        ))}
                      </span>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="#e8834a" className="opacity-60 flex-shrink-0">
                        <path d="M5 3.5l8 4.5-8 4.5V3.5z"/>
                      </svg>
                    )}
                    <span className="text-xs text-[#666] capitalize">{formatDate(ep.date)}</span>
                  </div>
                  <p className="font-medium text-[15px] leading-snug">{ep.title}</p>
                  {ep.description && (
                    <p className="text-[13px] text-[#666] mt-1 line-clamp-2">{ep.description}</p>
                  )}
                  <ProgressBar episodeId={ep.id} durationSeconds={ep.durationSeconds} />
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-[#555] font-mono">{ep.duration}</span>
                  <DownloadButton episode={ep} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {active && (
        <AudioPlayer episode={active} onClose={() => setActive(null)} />
      )}
    </>
  );
}
