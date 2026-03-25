import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import EpisodeList from '@/components/EpisodeList';
import type { Episode } from '@/types';

const mockEpisodes: Episode[] = [
  {
    id: '2026-03-25',
    title: 'Bulle IA Quantique',
    date: '2026-03-25',
    duration: '15:06',
    durationSeconds: 906,
    description: 'Veille tech/IA/dev du 2026-03-25',
    audioUrl: '/audio/2026-03-25.mp3',
  },
  {
    id: '2026-03-24',
    title: 'Prompt IA Renes',
    date: '2026-03-24',
    duration: '8:28',
    durationSeconds: 508,
    description: 'Veille tech du 2026-03-24',
    audioUrl: '/audio/2026-03-24.mp3',
  },
  {
    id: '2026-03-23',
    title: 'Coder Mythes Robots',
    date: '2026-03-23',
    duration: '10:53',
    durationSeconds: 653,
    description: 'Veille dev du 2026-03-23',
    audioUrl: '/audio/2026-03-23.mp3',
  },
];

window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
window.HTMLMediaElement.prototype.pause = vi.fn();
window.HTMLMediaElement.prototype.load = vi.fn();

describe('EpisodeList', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders all episodes', () => {
    render(<EpisodeList episodes={mockEpisodes} />);
    expect(screen.getByText('Bulle IA Quantique')).toBeInTheDocument();
    expect(screen.getByText('Prompt IA Renes')).toBeInTheDocument();
    expect(screen.getByText('Coder Mythes Robots')).toBeInTheDocument();
  });

  it('shows empty state when no episodes', () => {
    render(<EpisodeList episodes={[]} />);
    expect(screen.getByText(/Aucun épisode/)).toBeInTheDocument();
  });

  it('has a search input', () => {
    const { container } = render(<EpisodeList episodes={mockEpisodes} />);
    expect(container.querySelector('input[type=text]')).toBeTruthy();
  });

  it('filters episodes by search', async () => {
    const { container } = render(<EpisodeList episodes={mockEpisodes} />);
    const input = container.querySelector('input[type=text]')!;
    fireEvent.change(input, { target: { value: 'Quantique' } });

    await waitFor(() => {
      expect(screen.getByText('Bulle IA Quantique')).toBeInTheDocument();
      expect(screen.queryByText('Prompt IA Renes')).toBeNull();
    });
  });

  it('shows no results on bad search', async () => {
    const { container } = render(<EpisodeList episodes={mockEpisodes} />);
    const input = container.querySelector('input[type=text]')!;
    fireEvent.change(input, { target: { value: 'zzzznotfound' } });

    await waitFor(() => {
      expect(screen.getByText(/Aucun résultat/)).toBeInTheDocument();
    });
  });

  it('shows durations', () => {
    render(<EpisodeList episodes={mockEpisodes} />);
    const allText = document.body.textContent || '';
    expect(allText).toContain('15:06');
    expect(allText).toContain('8:28');
  });

  it('opens player on episode click', async () => {
    render(<EpisodeList episodes={mockEpisodes} />);
    const card = screen.getByText('Bulle IA Quantique').closest('[role=button]');
    expect(card).toBeTruthy();
    fireEvent.click(card!);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Fermer')).toBeInTheDocument();
    });
  });

  it('has download buttons', () => {
    render(<EpisodeList episodes={mockEpisodes} />);
    const btns = screen.getAllByTitle('Télécharger');
    expect(btns.length).toBe(3);
  });
});
