import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Track } from '../stores/player.store';
import { useQueueStore } from '../stores/queue.store';
import { TrackList } from '../components/shared/TrackList';
import { AddToPlaylistMenu } from '../components/shared/AddToPlaylistMenu';

interface Folder {
  id: string;
  name: string;
  _count: { children: number; tracks: number };
}

interface FolderDetail {
  id: string;
  name: string;
  parent?: { id: string; name: string } | null;
  children: Folder[];
  tracks: Track[];
}

interface Breadcrumb {
  id: string;
  name: string;
}

export function FoldersPage() {
  const { id } = useParams();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [detail, setDetail] = useState<FolderDetail | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Breadcrumb[]>([]);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [allTrackIds, setAllTrackIds] = useState<string[]>([]);
  const { playTrackList, appendTracks } = useQueueStore();

  const fetchRecursiveTracks = async () => {
    if (!id) return [];
    const res = await api.get<{ tracks: Track[] }>(`/folders/${id}/tracks`);
    return res.tracks;
  };

  const handlePlayAll = async () => {
    const tracks = await fetchRecursiveTracks();
    if (tracks.length > 0) playTrackList(tracks);
  };

  const handleAddToQueue = async () => {
    const tracks = await fetchRecursiveTracks();
    if (tracks.length > 0) appendTracks(tracks);
  };

  const handleAddToPlaylist = async () => {
    const tracks = await fetchRecursiveTracks();
    setAllTrackIds(tracks.map(t => t.id));
    setShowPlaylistMenu(true);
  };

  useEffect(() => {
    if (id) {
      api.get<FolderDetail>(`/folders/${id}`).then(setDetail).catch(() => {});
      api.get<{ breadcrumb: Breadcrumb[] }>(`/folders/${id}/breadcrumb`)
        .then(r => setBreadcrumb(r.breadcrumb))
        .catch(() => {});
    } else {
      api.get<{ folders: Folder[] }>('/folders').then(r => setFolders(r.folders)).catch(() => {});
      setDetail(null);
      setBreadcrumb([]);
    }
  }, [id]);

  if (!id) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Folders</h1>
        <div className="space-y-0.5">
          {folders.map((f) => (
            <Link
              key={f.id}
              to={`/folders/${f.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition"
            >
              <svg className="w-5 h-5 text-accent-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="flex-1 font-medium truncate">{f.name}</span>
              <span className="text-xs text-text-muted shrink-0">
                {f._count.children > 0 && `${f._count.children} folders`}
                {f._count.children > 0 && f._count.tracks > 0 && ', '}
                {f._count.tracks > 0 && `${f._count.tracks} tracks`}
              </span>
            </Link>
          ))}
          {folders.length === 0 && <div className="text-text-muted">No folders found. Make sure the scanner has run.</div>}
        </div>
      </div>
    );
  }

  if (!detail) return <div className="text-text-muted">Loading...</div>;

  return (
    <div>
      <nav className="flex items-center gap-1 text-sm text-text-secondary mb-4 flex-wrap">
        <Link to="/folders" className="hover:text-white">Folders</Link>
        {breadcrumb.map((b) => (
          <span key={b.id} className="flex items-center gap-1">
            <span>/</span>
            <Link to={`/folders/${b.id}`} className="hover:text-white">{b.name}</Link>
          </span>
        ))}
      </nav>

      <h1 className="text-2xl font-bold mb-4">{detail.name}</h1>

      <div className="flex flex-wrap items-center gap-2 mb-6 relative">
        <button
          onClick={handlePlayAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-accent-primary text-accent-text rounded-lg hover:opacity-80 transition"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play All
        </button>
        <button
          onClick={handleAddToQueue}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-lg hover:bg-bg-hover transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add to Queue
        </button>
        <div className="relative">
          <button
            onClick={handleAddToPlaylist}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-bg-secondary border border-border rounded-lg hover:bg-bg-hover transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10m-10 4h6" />
            </svg>
            Add to Playlist
          </button>
          {showPlaylistMenu && (
            <AddToPlaylistMenu
              trackIds={allTrackIds}
              onClose={() => setShowPlaylistMenu(false)}
            />
          )}
        </div>
      </div>

      {detail.children.length > 0 && (
        <div className="space-y-0.5 mb-6">
          {detail.children.map((f) => (
            <Link
              key={f.id}
              to={`/folders/${f.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-hover transition"
            >
              <svg className="w-5 h-5 text-accent-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="flex-1 font-medium truncate">{f.name}</span>
              <span className="text-xs text-text-muted shrink-0">
                {f._count.children > 0 && `${f._count.children} folders`}
                {f._count.children > 0 && f._count.tracks > 0 && ', '}
                {f._count.tracks > 0 && `${f._count.tracks} tracks`}
              </span>
            </Link>
          ))}
        </div>
      )}

      {detail.tracks.length > 0 && <TrackList tracks={detail.tracks} />}
    </div>
  );
}
