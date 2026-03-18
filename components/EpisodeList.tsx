'use client';

import { useState } from 'react';
import AudioPlayer from './AudioPlayer';
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

export default function EpisodeList({ episodes }: { episodes: Episode[] }) {
  const [active, setActive] = useState<Episode | null>(null);

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
      <div className={`space-y-3 ${active ? 'pb-52' : ''}`}>
        {episodes.map((ep) => (
          <button
            key={ep.id}
            onClick={() => setActive(active?.id === ep.id ? null : ep)}
            className={`w-full text-left rounded-xl border p-4 transition-all active:scale-[0.99] ${
              active?.id === ep.id
                ? 'border-[#e8834a] bg-[#1e1410]'
                : 'border-[#2a2a2a] bg-[#161616] hover:border-[#3a3a3a]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
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
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="text-xs text-[#555] font-mono">{ep.duration}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <AudioPlayer episode={active} onClose={() => setActive(null)} />
      )}
    </>
  );
}
