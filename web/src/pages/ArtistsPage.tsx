import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

interface Artist {
  id: string;
  name: string;
  _count: { albums: number; tracks: number };
}

export function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get<{ artists: Artist[]; total: number }>(`/artists?page=${page}&limit=50`)
      .then(r => { setArtists(r.artists); setTotal(r.total); })
      .catch(() => {});
  }, [page]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Artists</h1>
        {total > 0 && <span className="text-sm text-text-muted">{total.toLocaleString()} artists</span>}
      </div>
      <div className="space-y-0.5">
        {artists.map((a) => (
          <Link
            key={a.id}
            to={`/artists/${a.id}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition-colors group"
          >
            <div className="w-10 h-10 bg-accent-primary/15 rounded-full flex items-center justify-center text-accent-primary font-bold shrink-0 group-hover:bg-accent-primary/25 transition-colors">
              {a.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate group-hover:text-accent-primary transition-colors">{a.name}</div>
              <div className="text-xs text-text-secondary">
                {a._count.albums} album{a._count.albums !== 1 ? 's' : ''} · {a._count.tracks} track{a._count.tracks !== 1 ? 's' : ''}
              </div>
            </div>
            <svg className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm disabled:opacity-30 hover:bg-bg-hover transition"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-sm text-text-secondary">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages}
            className="px-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm disabled:opacity-30 hover:bg-bg-hover transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
