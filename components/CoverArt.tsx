'use client';

import { useState } from 'react';
import type { Episode } from '@/types';

interface CoverArtProps {
  episode: Episode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
};

// Generate a deterministic color from episode date
function dateToColor(date: string): string {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = date.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 35%)`;
}

export default function CoverArt({ episode, size = 'sm', className = '' }: CoverArtProps) {
  const [hasError, setHasError] = useState(false);
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const coverUrl = episode.coverUrl
    ? `${base}${episode.coverUrl.replace(base, '')}`
    : null;

  const fallbackColor = dateToColor(episode.date);
  const sizeClass = SIZES[size];

  if (!coverUrl || hasError) {
    // Fallback: colored gradient with date
    const day = episode.date.split('-')[2];
    const month = episode.date.split('-')[1];
    return (
      <div
        className={`${sizeClass} rounded-lg flex items-center justify-center flex-shrink-0 ${className}`}
        style={{
          background: `linear-gradient(135deg, ${fallbackColor}, #0d0d0d)`,
        }}
      >
        <span className="text-white/80 font-mono text-[10px] leading-none text-center">
          {day}/{month}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-lg overflow-hidden flex-shrink-0 ${className}`}>
      {coverUrl.endsWith('.svg') ? (
        <object
          data={coverUrl}
          type="image/svg+xml"
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: fallbackColor }}
          />
        </object>
      ) : (
        <img
          src={coverUrl}
          alt={episode.title}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}
