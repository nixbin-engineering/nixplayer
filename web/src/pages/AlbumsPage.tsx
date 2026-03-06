import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { CoverArt } from '../components/shared/CoverArt';

interface Album {
  id: string;
  name: string;
  year: number | null;
  artist?: { id: string; name: string } | null;
  _count: { tracks: number };
}

export function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get<{ albums: Album[]; total: number }>(`/albums?page=${page}&limit=48`)
      .then(r => { setAlbums(r.albums); setTotal(r.total); })
      .catch(() => {});
  }, [page]);

  const totalPages = Math.ceil(total / 48);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Albums</h1>
        {total > 0 && <span className="text-sm text-text-muted">{total.toLocaleString()} albums</span>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
        {albums.map((album) => (
          <Link key={album.id} to={`/albums/${album.id}`} className="group">
            <div className="relative overflow-hidden rounded-lg">
              <CoverArt albumId={album.id} size="lg" className="w-full h-auto aspect-square transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center shadow-lg ml-auto">
                  <svg className="w-4 h-4 text-accent-text" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm font-medium truncate group-hover:text-accent-primary transition-colors">{album.name}</div>
            <div className="text-xs text-text-secondary truncate">{album.artist?.name}{album.year ? ` · ${album.year}` : ''}</div>
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
