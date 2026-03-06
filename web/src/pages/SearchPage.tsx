import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Track } from '../stores/player.store';
import { TrackList } from '../components/shared/TrackList';

interface SearchResults {
  tracks: Track[];
  artists: { id: string; name: string }[];
  albums: { id: string; name: string; artist?: { name: string } | null }[];
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResults>({ tracks: [], artists: [], albums: [] });

  useEffect(() => {
    if (q) {
      api.get<SearchResults>(`/search?q=${encodeURIComponent(q)}`).then(setResults).catch(() => {});
    }
  }, [q]);

  if (!q) return <div className="text-text-muted">Enter a search query above.</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Results for "{q}"</h1>

      {results.artists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Artists</h2>
          <div className="flex flex-wrap gap-2">
            {results.artists.map((a) => (
              <Link key={a.id} to={`/artists/${a.id}`} className="px-4 py-2 bg-bg-secondary rounded-full hover:bg-bg-hover transition text-sm">
                {a.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.albums.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Albums</h2>
          <div className="flex flex-wrap gap-2">
            {results.albums.map((a) => (
              <Link key={a.id} to={`/albums/${a.id}`} className="px-4 py-2 bg-bg-secondary rounded-full hover:bg-bg-hover transition text-sm">
                {a.name}{a.artist ? ` - ${a.artist.name}` : ''}
              </Link>
            ))}
          </div>
        </section>
      )}

      {results.tracks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Tracks</h2>
          <TrackList tracks={results.tracks} />
        </section>
      )}

      {!results.tracks.length && !results.artists.length && !results.albums.length && (
        <div className="text-text-muted">No results found.</div>
      )}
    </div>
  );
}
