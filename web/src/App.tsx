import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { FoldersPage } from './pages/FoldersPage';
import { ArtistsPage } from './pages/ArtistsPage';
import { ArtistPage } from './pages/ArtistPage';
import { AlbumsPage } from './pages/AlbumsPage';
import { AlbumPage } from './pages/AlbumPage';
import { SearchPage } from './pages/SearchPage';
import { QueuePage } from './pages/QueuePage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { TagsPage } from './pages/TagsPage';
import { NowPlayingPage } from './pages/NowPlayingPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <div className="text-accent-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route element={isAuthenticated ? <AppShell /> : <Navigate to="/login" />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/folders" element={<FoldersPage />} />
          <Route path="/folders/:id" element={<FoldersPage />} />
          <Route path="/artists" element={<ArtistsPage />} />
          <Route path="/artists/:id" element={<ArtistPage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:id" element={<AlbumPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/queue" element={<QueuePage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/playlists/:id" element={<PlaylistPage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/now-playing" element={<NowPlayingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
