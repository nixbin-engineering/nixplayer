import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../stores/player.store';
import { useQueueStore } from '../stores/queue.store';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { CoverArt } from '../components/shared/CoverArt';
import { SeekBar } from '../components/player/SeekBar';
import { AddToPlaylistMenu } from '../components/shared/AddToPlaylistMenu';
import { EditTrackModal } from '../components/shared/EditTrackModal';

export function NowPlayingPage() {
  const { currentTrack, isPlaying, togglePlay, shuffle, toggleShuffle, repeat, cycleRepeat, volume, setVolume } = usePlayerStore();
  const { playNext, playPrev } = useQueueStore();
  const { seek } = useAudioPlayer();
  const navigate = useNavigate();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-text-muted">
        Nothing playing
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex items-center justify-between w-full max-w-sm mb-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          {/* Edit metadata */}
          <button
            onClick={() => setShowEditModal(true)}
            className="p-2 text-text-secondary hover:text-accent-primary transition"
            title="Edit metadata"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {/* Add to playlist */}
          <div className="relative">
            <button
              onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
              className="p-2 text-text-secondary hover:text-accent-primary transition"
              title="Add to playlist"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10m-10 4h6" />
              </svg>
            </button>
            {showPlaylistMenu && (
              <AddToPlaylistMenu
                trackIds={[currentTrack.id]}
                onClose={() => setShowPlaylistMenu(false)}
              />
            )}
          </div>
        </div>
      </div>

      <CoverArt trackId={currentTrack.id} size="xl" className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl shadow-2xl mb-8" />

      <div className="text-center mb-6 w-full max-w-sm">
        <h2 className="text-xl font-bold truncate">{currentTrack.title}</h2>
        <p className="text-text-secondary truncate">{currentTrack.artist?.name || 'Unknown Artist'}</p>
        <p className="text-text-muted text-sm truncate">{currentTrack.album?.name || ''}</p>
      </div>

      <div className="w-full max-w-sm mb-6">
        <SeekBar onSeek={seek} />
      </div>

      <div className="flex items-center gap-6">
        <button onClick={toggleShuffle} className={`p-2 ${shuffle ? 'text-accent-primary' : 'text-text-secondary'}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
          </svg>
        </button>

        <button onClick={playPrev} className="p-2 text-text-secondary hover:text-white">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button onClick={togglePlay} className="p-4 bg-accent-primary hover:bg-accent-hover rounded-full text-accent-text">
          {isPlaying ? (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button onClick={playNext} className="p-2 text-text-secondary hover:text-white">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        <button onClick={cycleRepeat} className={`p-2 relative ${repeat !== 'none' ? 'text-accent-primary' : 'text-text-secondary'}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
          {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
        </button>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-32 h-1" />
      </div>

      {showEditModal && (
        <EditTrackModal
          track={currentTrack}
          onClose={() => setShowEditModal(false)}
          onSaved={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
