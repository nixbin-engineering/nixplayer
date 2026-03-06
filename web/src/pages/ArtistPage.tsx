import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Track } from '../stores/player.store';
import { TrackList } from '../components/shared/TrackList';
import { CoverArt } from '../components/shared/CoverArt';

interface Album {
  id: string;
  name: string;
  year: number | null;
  _count: { tracks: number };
}

interface ArtistDetail {
  id: string;
  name: string;
  albums: Album[];
  tracks: Track[];
}

export function ArtistPage() {
  const { id } = useParams();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);

  useEffect(() => {
    if (id) api.get<ArtistDetail>(`/artists/${id}`).then(setArtist).catch(() => {});
  }, [id]);

  if (!artist) return <div className="text-text-muted">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-accent-primary/15 rounded-full flex items-center justify-center text-accent-primary font-bold text-2xl shrink-0">
          {artist.name[0]?.toUpperCase()}
        </div>
        <div>
          <div className="text-sm text-text-secondary mb-0.5">Artist</div>
          <h1 className="text-2xl font-bold">{artist.name}</h1>
          <div className="text-sm text-text-secondary mt-0.5">
            {artist.albums.length} album{artist.albums.length !== 1 ? 's' : ''} · {artist.tracks.length} track{artist.tracks.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {artist.albums.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {artist.albums.map((album) => (
              <Link key={album.id} to={`/albums/${album.id}`} className="group">
                <div className="relative overflow-hidden rounded-lg">
                  <CoverArt albumId={album.id} size="lg" className="w-full h-auto aspect-square transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
                <div className="mt-2 text-sm font-medium truncate group-hover:text-accent-primary transition-colors">{album.name}</div>
                <div className="text-xs text-text-secondary">{album.year} · {album._count.tracks} tracks</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">All Tracks</h2>
        <TrackList tracks={artist.tracks} showArtist={false} />
      </section>
    </div>
  );
}
