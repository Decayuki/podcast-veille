import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DownloadButton, { isEpisodeCached } from '@/components/DownloadButton';
import type { Episode } from '@/types';

const episode: Episode = {
  id: '2026-03-25',
  title: 'Test',
  date: '2026-03-25',
  duration: '10:00',
  durationSeconds: 600,
  description: 'Test',
  audioUrl: '/audio/2026-03-25.mp3',
};

describe('DownloadButton', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders idle state', () => {
    render(<DownloadButton episode={episode} />);
    expect(screen.getByTitle('Télécharger')).toBeInTheDocument();
  });

  it('shows cached state', () => {
    localStorage.setItem('podcast-downloaded-2026-03-25', 'true');
    render(<DownloadButton episode={episode} />);
    expect(screen.getByTitle('Disponible hors-ligne')).toBeInTheDocument();
  });

  it('isEpisodeCached works', () => {
    expect(isEpisodeCached('2026-03-25')).toBe(false);
    localStorage.setItem('podcast-downloaded-2026-03-25', 'true');
    expect(isEpisodeCached('2026-03-25')).toBe(true);
  });
});
