import { useState } from 'react';
import { api } from '../../api/client';
import { Track } from '../../stores/player.store';

interface EditTrackModalProps {
  track: Track;
  onClose: () => void;
  onSaved: (updated: Track) => void;
}

export function EditTrackModal({ track, onClose, onSaved }: EditTrackModalProps) {
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist?.name || '');
  const [album, setAlbum] = useState(track.album?.name || '');
  const [trackNo, setTrackNo] = useState(track.trackNo?.toString() || '');
  const [discNo, setDiscNo] = useState(track.discNo?.toString() || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await api.put<Track>(`/tracks/${track.id}`, {
        title: title.trim(),
        artist: artist.trim() || null,
        album: album.trim() || null,
        trackNo: trackNo ? parseInt(trackNo) : null,
        discNo: discNo ? parseInt(discNo) : null,
      });
      onSaved(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-secondary rounded-xl p-5 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-lg">Edit Track</h3>
        <div className="text-xs text-text-muted truncate">{track.fileName}</div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-secondary block mb-1">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Artist</label>
            <input
              value={artist}
              onChange={e => setArtist(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="Unknown"
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary block mb-1">Album</label>
            <input
              value={album}
              onChange={e => setAlbum(e.target.value)}
              className="w-full px-3 py-2 bg-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="None"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-text-secondary block mb-1">Track #</label>
              <input
                type="number"
                min={0}
                value={trackNo}
                onChange={e => setTrackNo(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-text-secondary block mb-1">Disc #</label>
              <input
                type="number"
                min={0}
                value={discNo}
                onChange={e => setDiscNo(e.target.value)}
                className="w-full px-3 py-2 bg-bg-tertiary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
          </div>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <div className="flex gap-2 justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-text-secondary hover:text-white transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-accent-text disabled:opacity-50 rounded-lg text-sm font-medium transition"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
