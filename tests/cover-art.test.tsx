import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import CoverArt from '@/components/CoverArt';
import type { Episode } from '@/types';

const baseEpisode: Episode = {
  id: '2026-03-25',
  title: 'Test Episode',
  date: '2026-03-25',
  duration: '10:00',
  durationSeconds: 600,
  description: 'Test',
  audioUrl: '/audio/2026-03-25.mp3',
};

describe('CoverArt', () => {
  it('renders fallback when no coverUrl', () => {
    const { container } = render(<CoverArt episode={baseEpisode} />);
    // Should show date-based fallback
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    expect(container.textContent).toContain('25');
  });

  it('renders with different sizes', () => {
    const { container: sm } = render(<CoverArt episode={baseEpisode} size="sm" />);
    const { container: lg } = render(<CoverArt episode={baseEpisode} size="lg" />);
    expect(sm.querySelector('.w-10')).toBeInTheDocument();
    expect(lg.querySelector('.w-24')).toBeInTheDocument();
  });

  it('renders image when coverUrl provided', () => {
    const ep = { ...baseEpisode, coverUrl: '/covers/2026-03-25.png' };
    const { container } = render(<CoverArt episode={ep} />);
    const img = container.querySelector('img');
    expect(img).toBeInTheDocument();
  });

  it('renders SVG object when coverUrl is SVG', () => {
    const ep = { ...baseEpisode, coverUrl: '/covers/2026-03-25.svg' };
    const { container } = render(<CoverArt episode={ep} />);
    const obj = container.querySelector('object');
    expect(obj).toBeInTheDocument();
  });

  it('generates different colors for different dates', () => {
    const ep1 = { ...baseEpisode, date: '2026-03-25' };
    const ep2 = { ...baseEpisode, date: '2026-03-24', id: '2026-03-24' };
    const { container: c1 } = render(<CoverArt episode={ep1} />);
    const { container: c2 } = render(<CoverArt episode={ep2} />);
    const bg1 = c1.querySelector('.rounded-lg')?.getAttribute('style');
    const bg2 = c2.querySelector('.rounded-lg')?.getAttribute('style');
    expect(bg1).not.toBe(bg2);
  });
});
