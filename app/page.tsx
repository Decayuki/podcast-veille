import { readFileSync } from 'fs';
import { join } from 'path';
import EpisodeList from '@/components/EpisodeList';
import type { Episode } from '@/types';

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

function getEpisodes(): Episode[] {
  try {
    const p = join(process.cwd(), 'public', 'episodes.json');
    return JSON.parse(readFileSync(p, 'utf-8'));
  } catch {
    return [];
  }
}

export default function Home() {
  const episodes = getEpisodes();

  return (
    <main className="min-h-dvh max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#e8834a] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="4" width="2" height="8" rx="1" fill="white"/>
              <rect x="5" y="2" width="2" height="12" rx="1" fill="white"/>
              <rect x="8" y="5" width="2" height="6" rx="1" fill="white"/>
              <rect x="11" y="3" width="2" height="10" rx="1" fill="white"/>
              <rect x="14" y="5" width="2" height="6" rx="1" fill="white" opacity="0.5"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Veille de Marc</h1>
        </div>
        <p className="text-[#666] text-sm pl-11">
          La veille tech/IA/dev quotidienne
        </p>
      </header>

      {/* RSS link */}
      <div className="mb-6">
        <a
          href={`${BASE}/podcast.xml`}
          className="inline-flex items-center gap-2 text-xs text-[#666] hover:text-[#e8834a] transition-colors"
          title="RSS Feed"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 2a.5.5 0 0 0 0 1c3.86 0 7 3.14 7 7a.5.5 0 0 0 1 0C10 5.69 6.31 2 2 2zm0 3a.5.5 0 0 0 0 1c2.21 0 4 1.79 4 4a.5.5 0 0 0 1 0c0-2.76-2.24-5-5-5zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
          </svg>
          Flux RSS podcast
        </a>
      </div>

      {/* Episodes */}
      <EpisodeList episodes={episodes} />
    </main>
  );
}
