import { parseFile } from 'music-metadata';
import path from 'path';

export interface TrackMetadata {
  title: string;
  artist: string | null;
  album: string | null;
  trackNo: number | null;
  discNo: number | null;
  year: number | null;
  duration: number | null;
  bitrate: number | null;
  sampleRate: number | null;
  format: string | null;
  picture: { data: Buffer; format: string } | null;
}

const AUDIO_EXTENSIONS = new Set([
  '.mp3', '.flac', '.ogg', '.opus', '.m4a', '.aac',
  '.wav', '.wma', '.aif', '.aiff', '.alac', '.ape',
  '.wv', '.mpc', '.dsf', '.dff',
]);

export function isAudioFile(filePath: string): boolean {
  return AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

export async function extractMetadata(filePath: string): Promise<TrackMetadata> {
  try {
    const metadata = await parseFile(filePath, { duration: true });
    const { common, format: fmt } = metadata;

    let picture: { data: Buffer; format: string } | null = null;
    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      picture = { data: Buffer.from(pic.data), format: pic.format };
    }

    return {
      title: common.title || path.basename(filePath, path.extname(filePath)),
      artist: common.artist || null,
      album: common.album || null,
      trackNo: common.track?.no ?? null,
      discNo: common.disk?.no ?? null,
      year: common.year ?? null,
      duration: fmt.duration ?? null,
      bitrate: fmt.bitrate ? Math.round(fmt.bitrate / 1000) : null,
      sampleRate: fmt.sampleRate ?? null,
      format: fmt.container ?? path.extname(filePath).slice(1),
      picture,
    };
  } catch (err) {
    console.error(`Failed to parse metadata for ${filePath}:`, err);
    return {
      title: path.basename(filePath, path.extname(filePath)),
      artist: null,
      album: null,
      trackNo: null,
      discNo: null,
      year: null,
      duration: null,
      bitrate: null,
      sampleRate: null,
      format: path.extname(filePath).slice(1),
      picture: null,
    };
  }
}
