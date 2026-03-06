import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Track } from '../stores/player.store';
import { TrackList } from '../components/shared/TrackList';
import { CoverArt } from '../components/shared/CoverArt';

interface Album {
  id: string;
  name: string;
  year: number | null;
  artist?: { name: string } | null;
  _count: { tracks: number };
}

interface Stats {
  tracks: number;
  artists: number;
  albums: number;
}

export function HomePage() {
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [stats, setStats] = useState<Stats>({ tracks: 0, artists: 0, albums: 0 });

  useEffect(() => {
    api.get<{ tracks: Track[]; total: number }>('/tracks?limit=10&sort=createdAt&order=desc')
      .then(r => setRecentTracks(r.tracks))
      .catch(() => {});

    api.get<{ albums: Album[]; total: number }>('/albums?limit=12')
      .then(r => {
        setAlbums(r.albums);
        setStats(s => ({ ...s, albums: r.total }));
      })
      .catch(() => {});

    api.get<{ artists: any[]; total: number }>('/artists?limit=1')
      .then(r => setStats(s => ({ ...s, artists: r.total })))
      .catch(() => {});

    api.get<{ tracks: any[]; total: number }>('/tracks?limit=1')
      .then(r => setStats(s => ({ ...s, tracks: r.total })))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'Tracks', value: stats.tracks, icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z' },
          { label: 'Artists', value: stats.artists, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { label: 'Albums', value: stats.albums, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
        ].map(s => (
          <div key={s.label} className="bg-bg-secondary rounded-xl p-3 md:p-4 border border-border hover:border-accent-primary/30 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-accent-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} />
              </svg>
              <span className="text-xs text-text-secondary">{s.label}</span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-accent-primary">{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {albums.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Albums</h2>
            <Link to="/albums" className="text-sm text-accent-primary hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {albums.map((album) => (
              <Link key={album.id} to={`/albums/${album.id}`} className="group">
                <div className="relative overflow-hidden rounded-lg">
                  <CoverArt albumId={album.id} size="lg" className="w-full h-auto aspect-square transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                </div>
                <div className="mt-2 text-sm font-medium truncate group-hover:text-accent-primary transition-colors">{album.name}</div>
                <div className="text-xs text-text-secondary truncate">{album.artist?.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recentTracks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Recently Added</h2>
          <TrackList tracks={recentTracks} />
        </section>
      )}
    </div>
  );
}
