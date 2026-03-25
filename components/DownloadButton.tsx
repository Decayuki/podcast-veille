'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Episode } from '@/types';

interface DownloadButtonProps {
  episode: Episode;
  className?: string;
}

type DownloadState = 'idle' | 'downloading' | 'cached' | 'error';

function getCacheKey(id: string): string {
  return `podcast-downloaded-${id}`;
}

export function isEpisodeCached(id: string): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(getCacheKey(id)) === 'true';
}

export default function DownloadButton({ episode, className = '' }: DownloadButtonProps) {
  const [state, setState] = useState<DownloadState>('idle');

  useEffect(() => {
    if (isEpisodeCached(episode.id)) {
      setState('cached');
    }
  }, [episode.id]);

  const handleDownload = useCallback(async () => {
    if (state === 'cached' || state === 'downloading') return;
    setState('downloading');

    try {
      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
      const url = episode.audioUrl.startsWith('http')
        ? episode.audioUrl
        : `${base}${episode.audioUrl.replace(base, '')}`;

      // Request SW to cache the audio
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_AUDIO',
          url,
          episodeId: episode.id,
        });

        // Listen for completion
        const handler = (event: MessageEvent) => {
          if (event.data?.type === 'AUDIO_CACHED' && event.data?.episodeId === episode.id) {
            localStorage.setItem(getCacheKey(episode.id), 'true');
            setState('cached');
            navigator.serviceWorker.removeEventListener('message', handler);
          } else if (event.data?.type === 'AUDIO_CACHE_ERROR' && event.data?.episodeId === episode.id) {
            setState('error');
            navigator.serviceWorker.removeEventListener('message', handler);
          }
        };
        navigator.serviceWorker.addEventListener('message', handler);

        // Timeout after 60s
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('message', handler);
          setState('error');
        }, 60000);
      } else {
        // Fallback: fetch directly to trigger browser cache
        const res = await fetch(url);
        if (res.ok) {
          localStorage.setItem(getCacheKey(episode.id), 'true');
          setState('cached');
        } else {
          setState('error');
        }
      }
    } catch {
      setState('error');
    }
  }, [episode, state]);

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleDownload(); }}
      className={`flex items-center justify-center transition-colors ${className} ${
        state === 'cached'
          ? 'text-[#e8834a]'
          : state === 'downloading'
          ? 'text-[#e8834a] animate-pulse'
          : state === 'error'
          ? 'text-red-400'
          : 'text-[#666] hover:text-[#e8e8e8]'
      }`}
      aria-label={
        state === 'cached' ? 'Téléchargé' :
        state === 'downloading' ? 'Téléchargement...' :
        state === 'error' ? 'Erreur, réessayer' :
        'Télécharger pour écoute hors-ligne'
      }
      title={
        state === 'cached' ? 'Disponible hors-ligne' :
        state === 'downloading' ? 'Téléchargement en cours...' :
        state === 'error' ? 'Erreur — cliquer pour réessayer' :
        'Télécharger'
      }
      disabled={state === 'downloading'}
    >
      {state === 'cached' ? (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 1.5v9m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 12.5v2a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="14" cy="4" r="3" fill="#e8834a"/>
          <path d="M12.5 4l1 1 2-2" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : state === 'downloading' ? (
        <svg className="animate-spin" width="18" height="18" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
          <path d="M9 2a7 7 0 017 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 1.5v9m0 0l-3-3m3 3l3-3"/>
          <path d="M3 12.5v2a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5v-2"/>
        </svg>
      )}
    </button>
  );
}
