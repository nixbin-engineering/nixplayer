import { create } from 'zustand';

export type Theme = 'midnight' | 'hacker';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const saved = localStorage.getItem('theme') as Theme | null;
const initial: Theme = saved === 'hacker' ? 'hacker' : 'midnight';
document.documentElement.setAttribute('data-theme', initial);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'midnight' ? 'hacker' : 'midnight';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      return { theme: next };
    });
  },
}));
