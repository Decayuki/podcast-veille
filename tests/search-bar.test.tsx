import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import SearchBar from '@/components/SearchBar';

describe('SearchBar', () => {
  afterEach(() => cleanup());

  it('renders with placeholder', () => {
    const { container } = render(<SearchBar onSearch={vi.fn()} />);
    expect(container.querySelector('input[placeholder="Rechercher un épisode..."]')).toBeTruthy();
  });

  it('calls onSearch with debounce', async () => {
    const onSearch = vi.fn();
    const { container } = render(<SearchBar onSearch={onSearch} />);
    const input = container.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('test');
    }, { timeout: 500 });
  });

  it('accepts custom placeholder', () => {
    const { container } = render(<SearchBar onSearch={vi.fn()} placeholder="Chercher..." />);
    expect(container.querySelector('input[placeholder="Chercher..."]')).toBeTruthy();
  });
});
