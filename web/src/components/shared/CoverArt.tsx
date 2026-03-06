import { useState } from 'react';
import { coverUrl, albumCoverUrl } from '../../api/client';

interface CoverArtProps {
  trackId?: string;
  albumId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

export function CoverArt({ trackId, albumId, size = 'md', className = '' }: CoverArtProps) {
  const [error, setError] = useState(false);
  const src = trackId ? coverUrl(trackId) : albumId ? albumCoverUrl(albumId) : null;

  if (!src || error) {
    return (
      <div className={`${sizes[size]} bg-bg-tertiary rounded flex items-center justify-center text-text-muted flex-shrink-0 ${className}`}>
        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Cover"
      className={`${sizes[size]} rounded object-cover flex-shrink-0 ${className}`}
      onError={() => setError(true)}
    />
  );
}
