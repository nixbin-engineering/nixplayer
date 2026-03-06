import { create } from 'zustand';
import { api, setToken, getToken } from '../api/client';

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!getToken(),
  isLoading: true,

  login: async (username, password) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { username, password });
    setToken(res.token);
    set({ user: res.user, isAuthenticated: true });
  },

  register: async (username, password) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', { username, password });
    setToken(res.token);
    set({ user: res.user, isAuthenticated: true });
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    setToken(null);
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    if (!getToken()) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const user = await api.get<User>('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
