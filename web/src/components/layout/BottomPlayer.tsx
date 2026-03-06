import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../../stores/player.store';
import { useQueueStore } from '../../stores/queue.store';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useMediaSession } from '../../hooks/useMediaSession';
import { SeekBar } from '../player/SeekBar';
import { CoverArt } from '../shared/CoverArt';
import { AddToPlaylistMenu } from '../shared/AddToPlaylistMenu';

export function BottomPlayer() {
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { playNext, playPrev } = useQueueStore();
  const { seek } = useAudioPlayer();
  useMediaSession(seek);
  const navigate = useNavigate();
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border z-50">
      <div className="px-2 pt-1">
        <SeekBar onSeek={seek} />
      </div>
      {/* Mobile: compact layout */}
      <div className="flex items-center gap-2 px-3 pb-2 pt-1 md:hidden">
        <div
          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
          onClick={() => navigate('/now-playing')}
        >
          <CoverArt trackId={currentTrack.id} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{currentTrack.title}</div>
            <div className="text-xs text-text-secondary truncate">{currentTrack.artist?.name || 'Unknown'}</div>
          </div>
        </div>
        <button onClick={playPrev} className="p-1.5 text-text-secondary hover:text-white transition shrink-0">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>
        <button
          onClick={togglePlay}
          className="p-2 bg-accent-primary hover:bg-accent-hover rounded-full text-accent-text transition shrink-0"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button onClick={playNext} className="p-1.5 text-text-secondary hover:text-white transition shrink-0">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>
      {/* Desktop: full controls with playlist action */}
      <div className="hidden md:flex items-center gap-3 px-4 pb-3 pt-1">
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
          onClick={() => navigate('/now-playing')}
        >
          <CoverArt trackId={currentTrack.id} size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{currentTrack.title}</div>
            <div className="text-xs text-text-secondary truncate">{currentTrack.artist?.name || 'Unknown'}</div>
          </div>
        </div>
        {/* Add to playlist button */}
        <div className="relative">
          <button
            onClick={() => setShowPlaylistMenu(!showPlaylistMenu)}
            className="p-1.5 text-text-secondary hover:text-accent-primary transition"
            title="Add to playlist"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10m-10 4h6" />
            </svg>
          </button>
          {showPlaylistMenu && (
            <div className="absolute bottom-full mb-2 right-0">
              <AddToPlaylistMenu
                trackIds={[currentTrack.id]}
                onClose={() => setShowPlaylistMenu(false)}
              />
            </div>
          )}
        </div>
        <PlayerControlsDesktop />
      </div>
    </div>
  );
}

function PlayerControlsDesktop() {
  const { isPlaying, togglePlay, shuffle, toggleShuffle, repeat, cycleRepeat, volume, setVolume } = usePlayerStore();
  const { playNext, playPrev } = useQueueStore();

  return (
    <div className="flex items-center gap-3">
      <button onClick={toggleShuffle} className={`p-1 ${shuffle ? 'text-accent-primary' : 'text-text-secondary'} hover:text-accent-primary transition`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
        </svg>
      </button>
      <button onClick={playPrev} className="p-1 text-text-secondary hover:text-white transition">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>
      <button onClick={togglePlay} className="p-2 bg-accent-primary hover:bg-accent-hover rounded-full text-accent-text transition">
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <button onClick={playNext} className="p-1 text-text-secondary hover:text-white transition">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>
      <button onClick={cycleRepeat} className={`p-1 ${repeat !== 'none' ? 'text-accent-primary' : 'text-text-secondary'} hover:text-accent-primary transition relative`}>
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
        </svg>
        {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
      </button>
      <div className="flex items-center gap-1 ml-2">
        <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
        <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-20 h-1" />
      </div>
    </div>
  );
}
