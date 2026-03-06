import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';

interface Playlist {
  id: string;
  name: string;
  _count: { tracks: number };
}

interface AddToPlaylistMenuProps {
  trackIds: string[];
  onClose?: () => void;
}

export function AddToPlaylistMenu({ trackIds, onClose }: AddToPlaylistMenuProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [message, setMessage] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ playlists: Playlist[] }>('/playlists')
      .then(r => { setPlaylists(r.playlists); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const addToPlaylist = async (playlistId: string) => {
    await api.post(`/playlists/${playlistId}/tracks`, { trackIds });
    setMessage(`Added ${trackIds.length} track${trackIds.length !== 1 ? 's' : ''}`);
    setTimeout(() => onClose?.(), 1200);
  };

  const createAndAdd = async () => {
    if (!newName.trim()) return;
    const playlist = await api.post<Playlist>('/playlists', { name: newName.trim() });
    await api.post(`/playlists/${playlist.id}/tracks`, { trackIds });
    setMessage(`Created "${newName.trim()}" and added ${trackIds.length} track${trackIds.length !== 1 ? 's' : ''}`);
    setTimeout(() => onClose?.(), 1200);
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 z-50 mt-1 w-64 bg-bg-secondary border border-border rounded-lg shadow-xl overflow-hidden"
    >
      {message ? (
        <div className="p-3 text-sm text-green-400">{message}</div>
      ) : loading ? (
        <div className="p-3 text-sm text-text-secondary">Loading...</div>
      ) : (
        <>
          <div className="max-h-48 overflow-y-auto">
            {playlists.map(p => (
              <button
                key={p.id}
                onClick={() => addToPlaylist(p.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-bg-hover transition truncate"
              >
                {p.name}
                <span className="text-text-muted ml-1">({p._count.tracks})</span>
              </button>
            ))}
            {playlists.length === 0 && (
              <div className="px-3 py-2 text-sm text-text-muted">No playlists yet</div>
            )}
          </div>
          <div className="border-t border-border p-2">
            {creating ? (
              <div className="flex gap-1">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createAndAdd()}
                  placeholder="Playlist name"
                  className="flex-1 bg-bg-primary text-sm px-2 py-1 rounded border border-border focus:border-accent-primary outline-none"
                />
                <button
                  onClick={createAndAdd}
                  className="text-sm px-2 py-1 bg-accent-primary text-accent-text rounded hover:opacity-80"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full text-left px-1 py-1 text-sm text-accent-primary hover:opacity-80"
              >
                + New Playlist
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
