import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { createReadStream, statSync } from 'fs';
import path from 'path';
import { getAllowedFolderIds } from '../services/folderAccess.js';

const MIME_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/opus',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.wav': 'audio/wav',
  '.wma': 'audio/x-ms-wma',
  '.aif': 'audio/aiff',
  '.aiff': 'audio/aiff',
};

export async function streamRoutes(app: FastifyInstance) {
  app.get('/api/v1/stream/:trackId', async (request, reply) => {
    const { trackId } = request.params as { trackId: string };

    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      return reply.status(404).send({ error: 'Track not found' });
    }

    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    if (allowed && !allowed.has(track.folderId)) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const filePath = track.filePath;
    let stat;
    try {
      stat = statSync(filePath);
    } catch {
      return reply.status(404).send({ error: 'File not found on disk' });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const fileSize = stat.size;

    const range = request.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      reply.raw.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      });

      const stream = createReadStream(filePath, { start, end });
      stream.pipe(reply.raw);
      return reply.hijack();
    }

    reply.raw.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    });

    const stream = createReadStream(filePath);
    stream.pipe(reply.raw);
    return reply.hijack();
  });
}
