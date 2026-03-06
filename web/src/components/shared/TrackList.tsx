import { useState } from 'react';
import { Track } from '../../stores/player.store';
import { useQueueStore } from '../../stores/queue.store';
import { CoverArt } from './CoverArt';
import { AddToPlaylistMenu } from './AddToPlaylistMenu';
import { EditTrackModal } from './EditTrackModal';

interface TrackListProps {
  tracks: Track[];
  showAlbum?: boolean;
  showArtist?: boolean;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TrackList({ tracks: initialTracks, showAlbum = true, showArtist = true }: TrackListProps) {
  const { playTrackList, appendTracks } = useQueueStore();
  const [playlistMenuTrackId, setPlaylistMenuTrackId] = useState<string | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState(initialTracks);

  // Sync with parent when initialTracks changes
  if (initialTracks !== tracks && initialTracks.length !== tracks.length) {
    setTracks(initialTracks);
  }

  const handlePlay = (index: number) => {
    playTrackList(tracks, index);
  };

  const handleAppend = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    appendTracks([track]);
  };

  const handlePlaylistClick = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    setPlaylistMenuTrackId(prev => prev === trackId ? null : trackId);
  };

  const handleEditClick = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setEditingTrack(track);
  };

  const handleSaved = (updated: Track) => {
    setTracks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTrack(null);
  };

  return (
    <>
      <div className="space-y-0.5">
        {tracks.map((track, i) => (
          <div
            key={track.id}
            onClick={() => handlePlay(i)}
            className="flex items-center gap-2 md:gap-3 p-2 rounded-lg hover:bg-bg-hover cursor-pointer group"
          >
            <CoverArt trackId={track.id} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{track.title}</div>
              <div className="text-xs text-text-secondary truncate">
                {showArtist && track.artist?.name}
                {showArtist && showAlbum && track.album?.name && ' · '}
                {showAlbum && track.album?.name}
              </div>
            </div>
            <span className="text-xs text-text-muted hidden sm:block">{formatDuration(track.duration)}</span>
            <button
              onClick={(e) => handleEditClick(e, track)}
              className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-accent-primary transition shrink-0"
              title="Edit metadata"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <div className="relative shrink-0">
              <button
                onClick={(e) => handlePlaylistClick(e, track.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-accent-primary transition"
                title="Add to playlist"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10m-10 4h6" />
                </svg>
              </button>
              {playlistMenuTrackId === track.id && (
                <AddToPlaylistMenu
                  trackIds={[track.id]}
                  onClose={() => setPlaylistMenuTrackId(null)}
                />
              )}
            </div>
            <button
              onClick={(e) => handleAppend(e, track)}
              className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-accent-primary transition shrink-0"
              title="Add to queue"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {editingTrack && (
        <EditTrackModal
          track={editingTrack}
          onClose={() => setEditingTrack(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
