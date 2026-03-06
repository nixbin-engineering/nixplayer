import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Track } from '../stores/player.store';
import { useQueueStore } from '../stores/queue.store';
import { TrackList } from '../components/shared/TrackList';

interface PlaylistTrackItem {
  id: string;
  position: number;
  track: Track;
}

interface PlaylistDetail {
  id: string;
  name: string;
  tracks: PlaylistTrackItem[];
}

export function PlaylistPage() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const { playTrackList } = useQueueStore();

  useEffect(() => {
    if (id) api.get<PlaylistDetail>(`/playlists/${id}`).then(setPlaylist).catch(() => {});
  }, [id]);

  if (!playlist) return <div className="text-text-muted">Loading...</div>;

  const tracks = playlist.tracks.map(pt => pt.track);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Playlist</div>
          <h1 className="text-2xl font-bold">{playlist.name}</h1>
          <div className="text-sm text-text-secondary mt-1">{tracks.length} track{tracks.length !== 1 ? 's' : ''}</div>
        </div>
        {tracks.length > 0 && (
          <button
            onClick={() => playTrackList(tracks)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-hover text-accent-text rounded-full text-sm font-medium transition shadow-lg shadow-accent-primary/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play All
          </button>
        )}
      </div>

      {tracks.length > 0 ? <TrackList tracks={tracks} /> : <div className="text-text-muted">Playlist is empty.</div>}
    </div>
  );
}
