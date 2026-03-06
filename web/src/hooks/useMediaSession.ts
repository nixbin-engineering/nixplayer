import { useEffect } from 'react';
import { usePlayerStore } from '../stores/player.store';
import { useQueueStore } from '../stores/queue.store';
import { coverUrl } from '../api/client';

export function useMediaSession(seek: (time: number) => void) {
  const { currentTrack, isPlaying, currentTime, duration } = usePlayerStore();
  const { togglePlay } = usePlayerStore();
  const { playNext, playPrev } = useQueueStore();

  // Update metadata
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    const artwork = currentTrack.id
      ? [{ src: coverUrl(currentTrack.id), sizes: '512x512', type: 'image/jpeg' }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist?.name || 'Unknown Artist',
      album: currentTrack.album?.name || 'Unknown Album',
      artwork,
    });
  }, [currentTrack?.id]);

  // Update playback state
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  // Update position state
  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      });
    } catch {}
  }, [currentTime, duration]);

  // Register action handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => togglePlay()],
      ['pause', () => togglePlay()],
      ['nexttrack', () => playNext()],
      ['previoustrack', () => playPrev()],
      ['seekto', (details) => {
        if (details.seekTime != null) seek(details.seekTime);
      }],
      ['seekforward', (details) => {
        const offset = details.seekOffset || 10;
        seek(Math.min(currentTime + offset, duration));
      }],
      ['seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        seek(Math.max(currentTime - offset, 0));
      }],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {}
    }

    return () => {
      for (const [action] of handlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      }
    };
  }, [currentTime, duration, playNext, playPrev, togglePlay, seek]);
}
