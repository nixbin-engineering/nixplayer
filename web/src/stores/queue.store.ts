import { create } from 'zustand';
import { api } from '../api/client';
import { Track, usePlayerStore } from './player.store';

interface QueueItem {
  id: string;
  trackId: string;
  position: number;
  track: Track;
}

interface QueueState {
  items: QueueItem[];
  currentIndex: number;
  loading: boolean;

  fetchQueue: () => Promise<void>;
  playTrackList: (tracks: Track[], startIndex?: number) => Promise<void>;
  appendTracks: (tracks: Track[]) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  playNext: () => void;
  playPrev: () => void;
  setIndex: (index: number) => void;
  reorder: (itemIds: string[]) => Promise<void>;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  items: [],
  currentIndex: 0,
  loading: false,

  fetchQueue: async () => {
    set({ loading: true });
    try {
      const res = await api.get<{ items: QueueItem[] }>('/queue');
      set({ items: res.items, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  playTrackList: async (tracks, startIndex = 0) => {
    const trackIds = tracks.map(t => t.id);
    await api.put('/queue', { trackIds });
    const res = await api.get<{ items: QueueItem[] }>('/queue');
    set({ items: res.items, currentIndex: startIndex });
    if (tracks[startIndex]) {
      usePlayerStore.getState().setTrack(tracks[startIndex]);
    }
  },

  appendTracks: async (tracks) => {
    await api.post('/queue/append', { trackIds: tracks.map(t => t.id) });
    const res = await api.get<{ items: QueueItem[] }>('/queue');
    set({ items: res.items });
  },

  removeItem: async (itemId) => {
    await api.delete(`/queue/${itemId}`);
    const res = await api.get<{ items: QueueItem[] }>('/queue');
    set({ items: res.items });
  },

  clearQueue: async () => {
    await api.delete('/queue');
    set({ items: [], currentIndex: 0 });
    usePlayerStore.getState().setPlaying(false);
  },

  playNext: () => {
    const { items, currentIndex } = get();
    const player = usePlayerStore.getState();

    if (player.repeat === 'one') {
      player.setCurrentTime(0);
      player.setPlaying(true);
      return;
    }

    if (player.shuffle) {
      const nextIndex = Math.floor(Math.random() * items.length);
      set({ currentIndex: nextIndex });
      if (items[nextIndex]) player.setTrack(items[nextIndex].track);
      return;
    }

    let nextIndex = currentIndex + 1;
    if (nextIndex >= items.length) {
      if (player.repeat === 'all') {
        nextIndex = 0;
      } else {
        player.setPlaying(false);
        return;
      }
    }
    set({ currentIndex: nextIndex });
    if (items[nextIndex]) player.setTrack(items[nextIndex].track);
  },

  playPrev: () => {
    const { items, currentIndex } = get();
    const player = usePlayerStore.getState();

    // If more than 3 seconds in, restart current track
    if (player.currentTime > 3) {
      player.setCurrentTime(0);
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (player.repeat === 'all') {
        prevIndex = items.length - 1;
      } else {
        prevIndex = 0;
      }
    }
    set({ currentIndex: prevIndex });
    if (items[prevIndex]) player.setTrack(items[prevIndex].track);
  },

  setIndex: (index) => {
    const { items } = get();
    if (items[index]) {
      set({ currentIndex: index });
      usePlayerStore.getState().setTrack(items[index].track);
    }
  },

  reorder: async (itemIds) => {
    await api.put('/queue/reorder', { itemIds });
    const res = await api.get<{ items: QueueItem[] }>('/queue');
    set({ items: res.items });
  },
}));
