import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

interface Playlist {
  id: string;
  name: string;
  _count: { tracks: number };
  updatedAt: string;
}

export function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState('');

  const load = () => {
    api.get<{ playlists: Playlist[] }>('/playlists').then(r => setPlaylists(r.playlists)).catch(() => {});
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.post('/playlists', { name: newName.trim() });
    setNewName('');
    load();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/playlists/${id}`);
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Playlists</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New playlist name..."
          className="flex-1 px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors"
        />
        <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent-primary hover:bg-accent-hover text-accent-text rounded-lg text-sm font-medium transition">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create
        </button>
      </form>

      <div className="space-y-0.5">
        {playlists.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors group">
            <div className="w-10 h-10 bg-accent-primary/15 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <Link to={`/playlists/${p.id}`} className="flex-1 min-w-0">
              <div className="font-medium group-hover:text-accent-primary transition-colors">{p.name}</div>
              <div className="text-xs text-text-secondary">{p._count.tracks} track{p._count.tracks !== 1 ? 's' : ''}</div>
            </Link>
            <button
              onClick={() => handleDelete(p.id)}
              className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 transition p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        {playlists.length === 0 && <div className="text-text-muted py-8 text-center">No playlists yet. Create one above!</div>}
      </div>
    </div>
  );
}
