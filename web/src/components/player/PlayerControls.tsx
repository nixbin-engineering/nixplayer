import { usePlayerStore } from '../../stores/player.store';
import { useQueueStore } from '../../stores/queue.store';

export function PlayerControls() {
  const { isPlaying, togglePlay, shuffle, toggleShuffle, repeat, cycleRepeat, volume, setVolume } = usePlayerStore();
  const { playNext, playPrev } = useQueueStore();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleShuffle}
        className={`p-1 ${shuffle ? 'text-accent-primary' : 'text-gray-400'} hover:text-accent-primary transition`}
        title="Shuffle"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
        </svg>
      </button>

      <button onClick={playPrev} className="p-1 text-gray-300 hover:text-white transition" title="Previous">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
        </svg>
      </button>

      <button
        onClick={togglePlay}
        className="p-2 bg-accent-primary hover:bg-accent-hover rounded-full text-accent-text transition"
        title={isPlaying ? 'Pause' : 'Play'}
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

      <button onClick={playNext} className="p-1 text-gray-300 hover:text-white transition" title="Next">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
        </svg>
      </button>

      <button
        onClick={cycleRepeat}
        className={`p-1 ${repeat !== 'none' ? 'text-accent-primary' : 'text-gray-400'} hover:text-accent-primary transition relative`}
        title={`Repeat: ${repeat}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
        </svg>
        {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span>}
      </button>

      <div className="flex items-center gap-1 ml-2">
        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20 h-1"
        />
      </div>
    </div>
  );
}
