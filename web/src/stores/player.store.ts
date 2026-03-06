import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  fileName: string;
  trackNo: number | null;
  discNo: number | null;
  duration: number | null;
  format: string | null;
  artist?: { id: string; name: string } | null;
  album?: { id: string; name: string } | null;
  coverPath?: string | null;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: 'none' | 'all' | 'one';

  setTrack: (track: Track) => void;
  setPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: parseFloat(localStorage.getItem('volume') || '1'),
  shuffle: false,
  repeat: 'none',

  setTrack: (track) => set({ currentTrack: track, currentTime: 0, isPlaying: true }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => {
    localStorage.setItem('volume', String(volume));
    set({ volume });
  },
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () => set((s) => ({
    repeat: s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none',
  })),
}));
