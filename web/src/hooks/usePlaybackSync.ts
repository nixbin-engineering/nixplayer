import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import { usePlayerStore } from '../stores/player.store';
import { useQueueStore } from '../stores/queue.store';

const SYNC_INTERVAL = 10000; // 10 seconds

export function usePlaybackSync() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const { currentTrack, isPlaying, currentTime } = usePlayerStore();

  // Periodic sync to server
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const { currentTrack, isPlaying, currentTime } = usePlayerStore.getState();
      if (currentTrack) {
        api.put('/playback', {
          currentTrackId: currentTrack.id,
          position: currentTime,
          isPlaying,
        }).catch(() => {});
      }
    }, SYNC_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, []);

  // Sync on track change
  useEffect(() => {
    if (currentTrack) {
      api.put('/playback', {
        currentTrackId: currentTrack.id,
        position: currentTime,
        isPlaying,
      }).catch(() => {});
    }
  }, [currentTrack?.id]);

  // Restore state on mount
  useEffect(() => {
    async function restore() {
      try {
        const state = await api.get<{
          currentTrackId: string | null;
          position: number;
          isPlaying: boolean;
        }>('/playback');

        if (state.currentTrackId) {
          // Fetch the queue to find the track
          await useQueueStore.getState().fetchQueue();
          const items = useQueueStore.getState().items;
          const idx = items.findIndex(i => i.trackId === state.currentTrackId);
          if (idx >= 0) {
            useQueueStore.getState().setIndex(idx);
            // Set position after a tick so the audio element has loaded
            setTimeout(() => {
              usePlayerStore.getState().setCurrentTime(state.position);
              usePlayerStore.getState().setPlaying(false); // Don't auto-play on restore
            }, 500);
          }
        }
      } catch {}
    }
    restore();
  }, []);
}
