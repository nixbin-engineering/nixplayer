import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Track } from '../stores/player.store';
import { TrackList } from '../components/shared/TrackList';

interface Tag {
  id: string;
  name: string;
  _count: { trackTags: number };
}

export function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newName, setNewName] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagTracks, setTagTracks] = useState<Track[]>([]);

  const loadTags = () => {
    api.get<{ tags: Tag[] }>('/tags').then(r => setTags(r.tags)).catch(() => {});
  };

  useEffect(loadTags, []);

  useEffect(() => {
    if (selectedTag) {
      api.get<{ tracks: Track[] }>(`/tags/${selectedTag}/tracks`)
        .then(r => setTagTracks(r.tracks))
        .catch(() => {});
    }
  }, [selectedTag]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.post('/tags', { name: newName.trim() });
    setNewName('');
    loadTags();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/tags/${id}`);
    if (selectedTag === id) setSelectedTag(null);
    loadTags();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tags</h1>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New tag name..."
          className="flex-1 px-4 py-2 bg-bg-tertiary rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
        />
        <button type="submit" className="px-4 py-2 bg-accent-primary hover:bg-accent-hover text-accent-text rounded-lg text-sm font-medium transition">
          Create
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1">
            <button
              onClick={() => setSelectedTag(tag.id === selectedTag ? null : tag.id)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                selectedTag === tag.id ? 'bg-accent-primary text-accent-text' : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
              }`}
            >
              {tag.name} ({tag._count.trackTags})
            </button>
            <button onClick={() => handleDelete(tag.id)} className="text-text-muted hover:text-red-400 text-xs">
              x
            </button>
          </div>
        ))}
        {tags.length === 0 && <div className="text-text-muted">No tags yet.</div>}
      </div>

      {selectedTag && tagTracks.length > 0 && <TrackList tracks={tagTracks} />}
      {selectedTag && tagTracks.length === 0 && <div className="text-text-muted">No tracks with this tag.</div>}
    </div>
  );
}
