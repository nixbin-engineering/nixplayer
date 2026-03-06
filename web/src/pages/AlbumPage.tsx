import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Track } from '../stores/player.store';
import { useQueueStore } from '../stores/queue.store';
import { CoverArt } from '../components/shared/CoverArt';
import { TrackList } from '../components/shared/TrackList';

interface AlbumDetail {
  id: string;
  name: string;
  year: number | null;
  artist?: { id: string; name: string } | null;
  tracks: Track[];
}

export function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const { playTrackList } = useQueueStore();

  useEffect(() => {
    if (id) api.get<AlbumDetail>(`/albums/${id}`).then(setAlbum).catch(() => {});
  }, [id]);

  if (!album) return <div className="text-text-muted">Loading...</div>;

  const totalDuration = album.tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const mins = Math.floor(totalDuration / 60);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 mb-8">
        <div className="relative overflow-hidden rounded-xl shadow-2xl sm:w-48 sm:h-48 w-full aspect-square shrink-0">
          <CoverArt albumId={album.id} size="xl" className="w-full h-full" />
        </div>
        <div className="flex flex-col justify-end">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Album</div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{album.name}</h1>
          {album.artist && (
            <Link to={`/artists/${album.artist.id}`} className="text-accent-primary hover:underline font-medium">
              {album.artist.name}
            </Link>
          )}
          <div className="text-sm text-text-secondary mt-1">
            {album.year && `${album.year} · `}{album.tracks.length} track{album.tracks.length !== 1 ? 's' : ''}
            {mins > 0 && ` · ${mins} min`}
          </div>
          <button
            onClick={() => playTrackList(album.tracks)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-hover text-accent-text rounded-full text-sm font-medium transition w-fit shadow-lg shadow-accent-primary/20"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Play All
          </button>
        </div>
      </div>

      <TrackList tracks={album.tracks} showAlbum={false} />
    </div>
  );
}
