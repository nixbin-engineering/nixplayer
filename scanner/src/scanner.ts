import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import pLimit from 'p-limit';
import { extractMetadata, isAudioFile } from './metadata.js';
import { ensureCoverDir, saveCover, findFolderCover } from './cover-extractor.js';
import { ensureFolder } from './folder-indexer.js';

async function computeFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

const musicPath = process.env.MUSIC_PATH || '/music';
const BATCH_SIZE = 500;
const CONCURRENCY = 6;

interface FileEntry {
  filePath: string;
  fileSize: bigint;
  mtime: Date;
}

export async function fullScan(prisma: PrismaClient): Promise<void> {
  console.log('Starting full scan of', musicPath);
  await ensureCoverDir();

  const startTime = Date.now();
  const files = await walkDirectory(musicPath);
  console.log(`Found ${files.length} audio files in ${Date.now() - startTime}ms`);

  // Get existing tracks for fingerprint comparison
  const existing = await prisma.track.findMany({
    select: { filePath: true, fileSize: true, mtime: true },
  });
  const existingMap = new Map(existing.map(t => [t.filePath, t]));

  // Filter to new or modified files
  const toProcess = files.filter(f => {
    const ex = existingMap.get(f.filePath);
    if (!ex) return true;
    return ex.fileSize !== f.fileSize || ex.mtime.getTime() !== f.mtime.getTime();
  });

  console.log(`${toProcess.length} files need processing (${files.length - toProcess.length} unchanged)`);

  // Process in batches with parallel metadata extraction
  const limit = pLimit(CONCURRENCY);
  const seenPaths = new Set(files.map(f => f.filePath));

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)}`);

    const results = await Promise.all(
      batch.map(file => limit(async () => {
        const meta = await extractMetadata(file.filePath);
        const fileHash = await computeFileHash(file.filePath);
        return { file, meta, fileHash };
      }))
    );

    // Batch upsert
    for (const { file, meta, fileHash } of results) {
      try {
        const folderId = await ensureFolder(prisma, path.dirname(file.filePath));

        // Upsert artist
        let artistId: string | null = null;
        if (meta.artist) {
          const artist = await prisma.artist.upsert({
            where: { name: meta.artist },
            create: { name: meta.artist },
            update: {},
          });
          artistId = artist.id;
        }

        // Upsert album
        let albumId: string | null = null;
        if (meta.album) {
          const album = await prisma.album.upsert({
            where: { name_artistId: { name: meta.album, artistId: artistId || '' } },
            create: {
              name: meta.album,
              artistId,
              year: meta.year,
            },
            update: { year: meta.year || undefined },
          });
          albumId = album.id;
        }

        // Extract cover art
        let coverFilePath: string | null = null;
        if (meta.picture) {
          coverFilePath = await saveCover(meta.picture.data, meta.picture.format, file.filePath);
          // Update album cover if not set
          if (albumId) {
            await prisma.album.update({
              where: { id: albumId },
              data: { coverPath: coverFilePath },
            });
          }
        } else {
          // Try folder cover
          coverFilePath = await findFolderCover(path.dirname(file.filePath));
        }

        // Upsert track
        await prisma.track.upsert({
          where: { filePath: file.filePath },
          create: {
            filePath: file.filePath,
            fileName: path.basename(file.filePath),
            fileHash,
            title: meta.title,
            trackNo: meta.trackNo,
            discNo: meta.discNo,
            duration: meta.duration,
            bitrate: meta.bitrate,
            sampleRate: meta.sampleRate,
            format: meta.format,
            fileSize: file.fileSize,
            mtime: file.mtime,
            folderId,
            artistId,
            albumId,
            coverPath: coverFilePath,
          },
          update: {
            fileName: path.basename(file.filePath),
            fileHash,
            title: meta.title,
            trackNo: meta.trackNo,
            discNo: meta.discNo,
            duration: meta.duration,
            bitrate: meta.bitrate,
            sampleRate: meta.sampleRate,
            format: meta.format,
            fileSize: file.fileSize,
            mtime: file.mtime,
            folderId,
            artistId,
            albumId,
            coverPath: coverFilePath,
          },
        });
      } catch (err) {
        console.error(`Error processing ${file.filePath}:`, err);
      }
    }
  }

  // Cleanup: remove tracks that no longer exist on disk
  const deletedResult = await prisma.track.deleteMany({
    where: { filePath: { notIn: [...seenPaths] } },
  });
  if (deletedResult.count > 0) {
    console.log(`Removed ${deletedResult.count} tracks no longer on disk`);
  }

  // Clean up empty artists and albums
  await prisma.album.deleteMany({ where: { tracks: { none: {} } } });
  await prisma.artist.deleteMany({ where: { tracks: { none: {} }, albums: { none: {} } } });

  // Clean up empty folders
  await cleanEmptyFolders(prisma);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const totalTracks = await prisma.track.count();
  console.log(`Scan complete: ${totalTracks} tracks indexed in ${elapsed}s`);
}

async function cleanEmptyFolders(prisma: PrismaClient) {
  // Iteratively delete leaf folders with no tracks and no children
  let deleted = 1;
  while (deleted > 0) {
    const result = await prisma.folder.deleteMany({
      where: {
        tracks: { none: {} },
        children: { none: {} },
      },
    });
    deleted = result.count;
  }
}

async function walkDirectory(dir: string): Promise<FileEntry[]> {
  const results: FileEntry[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip hidden directories
      if (entry.name.startsWith('.')) continue;
      const subResults = await walkDirectory(fullPath);
      results.push(...subResults);
    } else if (entry.isFile() && isAudioFile(entry.name)) {
      const stat = await fs.stat(fullPath);
      results.push({
        filePath: fullPath,
        fileSize: BigInt(stat.size),
        mtime: stat.mtime,
      });
    }
  }

  return results;
}
