import { PrismaClient } from '@prisma/client';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs/promises';
import { extractMetadata, isAudioFile } from './metadata.js';
import { ensureFolder } from './folder-indexer.js';
import { saveCover, findFolderCover } from './cover-extractor.js';

const musicPath = process.env.MUSIC_PATH || '/music';

export function startWatcher(prisma: PrismaClient): void {
  console.log('Starting filesystem watcher on', musicPath);

  const watcher = chokidar.watch(musicPath, {
    ignored: /(^|[\/\\])\../, // ignore hidden files
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 200,
    },
  });

  // Debounce map for rapid changes
  const pending = new Map<string, NodeJS.Timeout>();

  function debounce(filePath: string, fn: () => Promise<void>) {
    const existing = pending.get(filePath);
    if (existing) clearTimeout(existing);
    pending.set(filePath, setTimeout(async () => {
      pending.delete(filePath);
      try {
        await fn();
      } catch (err) {
        console.error(`Watcher error for ${filePath}:`, err);
      }
    }, 300));
  }

  watcher.on('add', (filePath: string) => {
    if (!isAudioFile(filePath)) return;
    debounce(filePath, () => handleAddOrChange(prisma, filePath));
  });

  watcher.on('change', (filePath: string) => {
    if (!isAudioFile(filePath)) return;
    debounce(filePath, () => handleAddOrChange(prisma, filePath));
  });

  watcher.on('unlink', (filePath: string) => {
    if (!isAudioFile(filePath)) return;
    debounce(filePath, () => handleRemove(prisma, filePath));
  });

  watcher.on('error', (error: unknown) => {
    console.error('Watcher error:', error);
  });

  console.log('Filesystem watcher started');
}

async function handleAddOrChange(prisma: PrismaClient, filePath: string): Promise<void> {
  console.log('Processing file change:', filePath);

  const stat = await fs.stat(filePath);
  const meta = await extractMetadata(filePath);
  const folderId = await ensureFolder(prisma, path.dirname(filePath));

  let artistId: string | null = null;
  if (meta.artist) {
    const artist = await prisma.artist.upsert({
      where: { name: meta.artist },
      create: { name: meta.artist },
      update: {},
    });
    artistId = artist.id;
  }

  let albumId: string | null = null;
  if (meta.album) {
    const album = await prisma.album.upsert({
      where: { name_artistId: { name: meta.album, artistId: artistId || '' } },
      create: { name: meta.album, artistId, year: meta.year },
      update: { year: meta.year || undefined },
    });
    albumId = album.id;
  }

  let coverFilePath: string | null = null;
  if (meta.picture) {
    coverFilePath = await saveCover(meta.picture.data, meta.picture.format, filePath);
    if (albumId) {
      await prisma.album.update({
        where: { id: albumId },
        data: { coverPath: coverFilePath },
      });
    }
  } else {
    coverFilePath = await findFolderCover(path.dirname(filePath));
  }

  await prisma.track.upsert({
    where: { filePath },
    create: {
      filePath,
      fileName: path.basename(filePath),
      title: meta.title,
      trackNo: meta.trackNo,
      discNo: meta.discNo,
      duration: meta.duration,
      bitrate: meta.bitrate,
      sampleRate: meta.sampleRate,
      format: meta.format,
      fileSize: BigInt(stat.size),
      mtime: stat.mtime,
      folderId,
      artistId,
      albumId,
      coverPath: coverFilePath,
    },
    update: {
      fileName: path.basename(filePath),
      title: meta.title,
      trackNo: meta.trackNo,
      discNo: meta.discNo,
      duration: meta.duration,
      bitrate: meta.bitrate,
      sampleRate: meta.sampleRate,
      format: meta.format,
      fileSize: BigInt(stat.size),
      mtime: stat.mtime,
      folderId,
      artistId,
      albumId,
      coverPath: coverFilePath,
    },
  });

  console.log('Indexed:', filePath);
}

async function handleRemove(prisma: PrismaClient, filePath: string): Promise<void> {
  console.log('Removing track:', filePath);
  await prisma.track.deleteMany({ where: { filePath } });
}
