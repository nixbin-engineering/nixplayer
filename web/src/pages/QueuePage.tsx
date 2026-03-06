import { useEffect } from 'react';
import { useQueueStore } from '../stores/queue.store';
import { usePlayerStore } from '../stores/player.store';
import { CoverArt } from '../components/shared/CoverArt';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function QueuePage() {
  const { items, currentIndex, fetchQueue, removeItem, clearQueue, setIndex } = useQueueStore();
  const { currentTrack } = usePlayerStore();

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Queue</h1>
        {items.length > 0 && (
          <button onClick={clearQueue} className="text-sm text-text-secondary hover:text-red-400 transition">
            Clear Queue
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-text-muted">Queue is empty. Browse your library and start playing!</div>
      ) : (
        <div className="space-y-0.5">
          {items.map((item, i) => (
            <div
              key={item.id}
              onClick={() => setIndex(i)}
              className={`flex items-center gap-2 md:gap-3 p-2 rounded-lg cursor-pointer group transition ${
                i === currentIndex && currentTrack?.id === item.track.id
                  ? 'bg-accent-primary/20'
                  : 'hover:bg-bg-hover'
              }`}
            >
              <span className="text-xs text-text-muted w-6 text-right shrink-0">{i + 1}</span>
              <CoverArt trackId={item.track.id} size="sm" className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.track.title}</div>
                <div className="text-xs text-text-secondary truncate">
                  {item.track.artist?.name || 'Unknown'}
                  {item.track.album?.name && ` · ${item.track.album.name}`}
                </div>
              </div>
              <span className="text-xs text-text-muted hidden sm:block">{formatDuration(item.track.duration)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-red-400 transition shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
