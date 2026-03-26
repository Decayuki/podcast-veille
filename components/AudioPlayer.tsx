'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Episode } from '@/types';
import { resolveUrl } from '@/lib/utils';
import TranscriptView from './TranscriptView';
import CoverArt from './CoverArt';

interface AudioPlayerProps {
  episode: Episode;
  onClose: () => void;
}

interface Chapter {
  title: string;
  startTime: number;
}

const SPEEDS = [1, 1.5, 2];
const SAVE_INTERVAL = 5000;

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
  const lastSaveRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(episode.durationSeconds || 0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [showChapterList, setShowChapterList] = useState(false);

  // Load chapters on mount
  useEffect(() => {
    const url = episode.chaptersUrl
      ? resolveUrl(episode.chaptersUrl)
      : resolveUrl('/podcast-veille/chapters/' + episode.id + '.json');

    fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: Chapter[]) => setChapters(data))
      .catch(() => setChapters(null));
  }, [episode.id, episode.chaptersUrl]);

  // Restore saved progress
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

  // Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: episode.title,
      artist: 'Veille de Marc',
      album: 'Podcast Veille Tech',
    });
    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => skip(-15));
    navigator.mediaSession.setActionHandler('seekforward', () => skip(15));
    return () => {
      navigator.mediaSession.metadata = null;
      ['play', 'pause', 'seekbackward', 'seekforward'].forEach((a) =>
        navigator.mediaSession.setActionHandler(a as MediaSessionAction, null)
      );
    };
  }, [episode]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.pause(); else audio.play();
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

  const cycleSpeed = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    audio.playbackRate = SPEEDS[next];
  }, [speedIdx]);

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

  const dur = duration || episode.durationSeconds || 1;
  const progress = dur > 0 ? currentTime / dur : 0;

  // Active chapter
  const activeChapterIdx = chapters
    ? chapters.reduce((acc, ch, i) => (currentTime >= ch.startTime ? i : acc), 0)
    : -1;
  const activeChapter = chapters && activeChapterIdx >= 0 ? chapters[activeChapterIdx] : null;

  const audioSrc = resolveUrl(episode.audioUrl);

  // Handle click on progress bar for seeking
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const time = pct * dur;
    seekTo(time);
  }, [dur, seekTo]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-lg mx-auto bg-[#161616] border-t border-[#2a2a2a] safe-area-bottom">
        <audio ref={audioRef} src={audioSrc} preload="metadata" />

        {/* Transcript panel */}
        {showTranscript && (
          <div className="max-h-[40vh] overflow-y-auto">
            <TranscriptView episode={episode} currentTime={currentTime} />
          </div>
        )}

        {/* Chapter list (YouTube-style dropdown) */}
        {showChapterList && chapters && chapters.length > 0 && (
          <div className="px-4 pb-2 pt-3 border-t border-[#2a2a2a] max-h-48 overflow-y-auto">
            {chapters.map((ch, i) => (
              <button
                key={i}
                onClick={() => { seekTo(ch.startTime); setShowChapterList(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                  i === activeChapterIdx
                    ? 'bg-[#1e1410] text-[#e8e8e8]'
                    : 'hover:bg-[#1a1a1a] text-[#999]'
                }`}
              >
                <span className={`text-xs font-mono flex-shrink-0 ${
                  i === activeChapterIdx ? 'text-[#e8834a]' : 'text-[#555]'
                }`}>
                  {formatTime(ch.startTime)}
                </span>
                <span className="text-sm truncate">{ch.title}</span>
                {i === activeChapterIdx && (
                  <span className="flex gap-[2px] items-end h-3 ml-auto flex-shrink-0">
                    {[0, 1, 2].map((j) => (
                      <span key={j} className="inline-block w-[2px] bg-[#e8834a] rounded-sm wave-bar playing" style={{ height: `${4 + j * 2}px` }} />
                    ))}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Waveform */}
        <div className="flex items-center justify-center gap-[3px] h-8 px-4 pt-3">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className={`wave-bar ${isPlaying ? 'playing' : ''}`}
              style={{
                height: isPlaying ? undefined : `${3 + Math.sin(i * 0.4) * 6 + 3}px`,
                opacity: progress > 0 && i / 48 < progress ? 1 : 0.35,
              }}
            />
          ))}
        </div>

        {/* Progress bar with chapter markers (YouTube-style) */}
        <div className="px-4 pt-2 pb-1">
          <div className="relative h-[6px] cursor-pointer group" onClick={handleProgressClick}>
            {/* Background */}
            <div className="absolute inset-0 bg-[#2a2a2a] rounded-full" />

            {/* Chapter segments */}
            {chapters && chapters.length > 1 ? (
              <>
                {chapters.map((ch, i) => {
                  const start = ch.startTime / dur;
                  const end = i < chapters.length - 1 ? chapters[i + 1].startTime / dur : 1;
                  const width = end - start;
                  const filled = Math.max(0, Math.min(1, (progress - start) / (end - start)));
                  return (
                    <div key={i} className="absolute top-0 bottom-0" style={{ left: `${start * 100}%`, width: `calc(${width * 100}% - 2px)` }}>
                      <div className="h-full bg-[#e8834a] rounded-full transition-all" style={{ width: `${filled * 100}%` }} />
                    </div>
                  );
                })}
                {/* Chapter gap markers */}
                {chapters.slice(1).map((ch, i) => (
                  <div key={i} className="absolute top-0 bottom-0 w-[2px] bg-[#161616]" style={{ left: `${(ch.startTime / dur) * 100}%` }} />
                ))}
              </>
            ) : (
              /* No chapters: simple progress bar */
              <div className="absolute top-0 bottom-0 left-0 bg-[#e8834a] rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
            )}

            {/* Playhead dot */}
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#e8834a] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${progress * 100}% - 6px)` }} />
          </div>

          <div className="flex justify-between text-[11px] text-[#666] mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Current chapter name (clickable to toggle chapter list) */}
        {activeChapter && (
          <button
            onClick={() => setShowChapterList(!showChapterList)}
            className="w-full px-4 pb-1 text-left flex items-center gap-2 group"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
              <rect x="0" y="0" width="2" height="10" rx="1" fill="#e8834a" />
              <rect x="4" y="2" width="2" height="6" rx="1" fill="#e8834a" opacity="0.6" />
              <rect x="8" y="1" width="2" height="8" rx="1" fill="#e8834a" opacity="0.4" />
            </svg>
            <span className="text-xs text-[#e8834a] truncate group-hover:underline">{activeChapter.title}</span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="#e8834a" strokeWidth="1.5" strokeLinecap="round"
              className={`flex-shrink-0 transition-transform ${showChapterList ? 'rotate-180' : ''}`}>
              <path d="M1 3l3 2.5L7 3" />
            </svg>
          </button>
        )}

        {/* Episode title + cover */}
        <div className="px-4 pb-1 flex items-center gap-3">
          <CoverArt episode={episode} size="sm" />
          <p className="text-sm font-medium truncate flex-1">{episode.title}</p>
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
              showTranscript ? 'bg-[#e8834a]/20 text-[#e8834a]' : 'text-[#666] hover:text-[#e8e8e8]'
            }`}
            aria-label="Voir transcript"
            title="Transcript"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <path d="M2 3h12M2 6h10M2 9h8M2 12h11"/>
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 pb-4 pt-1">
          <button onClick={cycleSpeed} className="w-10 h-10 flex items-center justify-center text-sm font-semibold text-[#666] hover:text-[#e8e8e8] transition-colors">
            {SPEEDS[speedIdx]}x
          </button>

          <button onClick={() => skip(-15)} className="w-12 h-12 flex items-center justify-center text-[#999] hover:text-[#e8e8e8] transition-colors active:scale-95 relative" aria-label="Reculer 15s">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5V3l-4 3 4 3V7a7 7 0 1 1-7 7h0" strokeLinecap="round"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold pt-[2px] pr-[4px]">15</span>
          </button>

          <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-[#e8834a] flex items-center justify-center shadow-lg active:scale-95 transition-transform" aria-label={isPlaying ? 'Pause' : 'Lecture'} disabled={isLoading}>
            {isLoading ? (
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="white"><rect x="5" y="4" width="4" height="14" rx="1.5"/><rect x="13" y="4" width="4" height="14" rx="1.5"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="white"><path d="M7 4.5l12 6.5-12 6.5V4.5z"/></svg>
            )}
          </button>

          <button onClick={() => skip(15)} className="w-12 h-12 flex items-center justify-center text-[#999] hover:text-[#e8e8e8] transition-colors active:scale-95 relative" aria-label="Avancer 15s">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5V3l4 3-4 3V7a7 7 0 1 0 7 7h0" strokeLinecap="round"/>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold pt-[2px] pl-[4px]">15</span>
          </button>

          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-[#666] hover:text-[#e8e8e8] transition-colors" aria-label="Fermer">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l10 10M14 4L4 14"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
