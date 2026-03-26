'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Episode } from '@/types';
import { resolveUrl } from '@/lib/utils';
import TranscriptView from './TranscriptView';
import ChapterList from './ChapterList';
import CoverArt from './CoverArt';

interface AudioPlayerProps {
  episode: Episode;
  onClose: () => void;
}

const SPEEDS = [1, 1.5, 2];
const SAVE_INTERVAL = 5000; // Save progress every 5s

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function getProgressKey(id: string): string {
  return `podcast-progress-${id}`;
}

export function getSavedProgress(id: string): number {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem(getProgressKey(id));
  return val ? parseFloat(val) : 0;
}

export default function AudioPlayer({ episode, onClose }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const lastSaveRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.durationSeconds || 0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  // Restore saved progress on mount
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const saved = getSavedProgress(episode.id);
    if (saved > 0 && saved < (episode.durationSeconds || Infinity) - 5) {
      audio.currentTime = saved;
      setCurrentTime(saved);
    }
    localStorage.setItem('podcast-last-episode', episode.id);
  }, [episode.id, episode.durationSeconds]);

  // Save progress periodically
  useEffect(() => {
    const now = Date.now();
    if (now - lastSaveRef.current >= SAVE_INTERVAL && currentTime > 0) {
      localStorage.setItem(getProgressKey(episode.id), currentTime.toString());
      lastSaveRef.current = now;
    }
  }, [currentTime, episode.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      // Clear saved progress on completion
      localStorage.removeItem(getProgressKey(episode.id));
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      // Save progress on unmount
      if (audio.currentTime > 0) {
        localStorage.setItem(getProgressKey(episode.id), audio.currentTime.toString());
      }
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [episode.id]);

  // Media Session API (lock screen controls)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: episode.title,
      artist: 'Veille de Marc',
      album: 'Podcast Veille Tech',
      artwork: [
        { src: (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: (process.env.NEXT_PUBLIC_BASE_PATH ?? '') + '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => skip(-15));
    navigator.mediaSession.setActionHandler('seekforward', () => skip(15));
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (audioRef.current && details.seekTime != null) {
        audioRef.current.currentTime = details.seekTime;
      }
    });

    return () => {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [episode]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
  }, [isPlaying]);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + seconds));
  }, []);

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleProgress = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = parseFloat(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  }, []);

  const cycleSpeed = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    audio.playbackRate = SPEEDS[next];
  }, [speedIdx]);

  const progress = duration > 0 ? currentTime / duration : 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') skip(15);
      if (e.code === 'ArrowLeft') skip(-15);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, skip]);

  const audioSrc = resolveUrl(episode.audioUrl);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
    <div className="max-w-lg mx-auto bg-[#161616] border-t border-[#2a2a2a] safe-area-bottom">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Extras panel (transcript + chapters) */}
      {showExtras && (
        <div className="max-h-[40vh] overflow-y-auto">
          <ChapterList episode={episode} currentTime={currentTime} onSeek={seekTo} />
          <TranscriptView episode={episode} currentTime={currentTime} />
        </div>
      )}

      {/* Waveform */}
      <div className="flex items-center justify-center gap-[3px] h-8 px-4 pt-3">
        {Array.from({ length: 48 }).map((_, i) => (
          <div
            key={i}
            className={`wave-bar ${isPlaying ? 'playing' : ''}`}
            style={{
              height: isPlaying ? undefined : `${3 + Math.sin(i * 0.4) * 6 + 3}px`,
              opacity: progress > 0 && i / 48 < progress ? 1 : 0.35,
            }}
          />
        ))}
      </div>

      {/* Progress */}
      <div className="px-4 pt-2 pb-1">
        <input
          ref={progressRef}
          type="range"
          min={0}
          max={duration || episode.durationSeconds || 100}
          value={currentTime}
          onChange={handleProgress}
          className="w-full"
          style={{
            background: `linear-gradient(to right, #e8834a ${progress * 100}%, #2a2a2a ${progress * 100}%)`,
          }}
        />
        <div className="flex justify-between text-[11px] text-[#666] mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Episode title + cover */}
      <div className="px-4 pb-1 flex items-center gap-3">
        <CoverArt episode={episode} size="sm" />
        <p className="text-sm font-medium truncate flex-1">{episode.title}</p>
        <button
          onClick={() => setShowExtras(!showExtras)}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            showExtras ? 'bg-[#e8834a]/20 text-[#e8834a]' : 'text-[#666] hover:text-[#e8e8e8]'
          }`}
          aria-label="Voir transcript et chapitres"
          title="Transcript & Chapitres"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M2 3h12M2 6h10M2 9h8M2 12h11"/>
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 pb-4 pt-1">
        {/* Speed */}
        <button
          onClick={cycleSpeed}
          className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-[#666] hover:text-[#e8e8e8] transition-colors"
        >
          {SPEEDS[speedIdx]}x
        </button>

        {/* Skip back */}
        <button
          onClick={() => skip(-15)}
          className="w-12 h-12 flex items-center justify-center text-[#999] hover:text-[#e8e8e8] transition-colors active:scale-95"
          aria-label="Reculer 15s"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5V3l-4 3 4 3V7a7 7 0 1 1-7 7h0" strokeLinecap="round"/>
            <text x="7.5" y="14" fontSize="6" fill="currentColor" stroke="none" fontWeight="600" textAnchor="middle">15</text>
          </svg>
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-[#e8834a] flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : isPlaying ? (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="white">
              <rect x="5" y="4" width="4" height="14" rx="1.5"/>
              <rect x="13" y="4" width="4" height="14" rx="1.5"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="white">
              <path d="M7 4.5l12 6.5-12 6.5V4.5z"/>
            </svg>
          )}
        </button>

        {/* Skip forward */}
        <button
          onClick={() => skip(15)}
          className="w-12 h-12 flex items-center justify-center text-[#999] hover:text-[#e8e8e8] transition-colors active:scale-95"
          aria-label="Avancer 15s"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5V3l4 3-4 3V7a7 7 0 1 0 7 7h0" strokeLinecap="round"/>
            <text x="12" y="14" fontSize="6" fill="currentColor" stroke="none" fontWeight="600" textAnchor="middle">15</text>
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-[#666] hover:text-[#e8e8e8] transition-colors"
          aria-label="Fermer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4l10 10M14 4L4 14"/>
          </svg>
        </button>
      </div>
    </div>
    </div>
  );
}
