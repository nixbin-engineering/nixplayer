import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const COVER_FILES = ['cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'album.jpg', 'album.png', 'front.jpg', 'front.png'];
const coverPath = process.env.COVER_PATH || '/data/covers';

export async function ensureCoverDir() {
  await fs.mkdir(coverPath, { recursive: true });
}

export async function saveCover(
  data: Buffer,
  format: string,
  identifier: string
): Promise<string> {
  const hash = crypto.createHash('md5').update(data).digest('hex');
  const ext = format.includes('png') ? '.png' : '.jpg';
  const filename = `${hash}${ext}`;
  const dest = path.join(coverPath, filename);

  try {
    await fs.access(dest);
  } catch {
    await fs.writeFile(dest, data);
  }

  return dest;
}

export async function findFolderCover(dirPath: string): Promise<string | null> {
  for (const name of COVER_FILES) {
    const candidate = path.join(dirPath, name);
    try {
      await fs.access(candidate);
      const data = await fs.readFile(candidate);
      return saveCover(data, name.endsWith('.png') ? 'image/png' : 'image/jpeg', dirPath);
    } catch {
      continue;
    }
  }
  return null;
}
