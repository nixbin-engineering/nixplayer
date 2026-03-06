import { usePlayerStore } from '../../stores/player.store';

interface SeekBarProps {
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SeekBar({ onSeek }: SeekBarProps) {
  const { currentTime, duration } = usePlayerStore();

  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs text-text-secondary w-10 text-right">{formatTime(currentTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        className="flex-1 h-1"
        step={0.1}
      />
      <span className="text-xs text-text-secondary w-10">{formatTime(duration)}</span>
    </div>
  );
}
