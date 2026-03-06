import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { existsSync, createReadStream, statSync } from 'fs';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const DEFAULT_COVER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" fill="#1e1e2e"/>
  <circle cx="100" cy="100" r="60" fill="none" stroke="#6c7086" stroke-width="3"/>
  <circle cx="100" cy="100" r="20" fill="#6c7086"/>
  <circle cx="100" cy="100" r="5" fill="#1e1e2e"/>
  <path d="M 100 40 A 60 60 0 0 1 160 100" fill="none" stroke="#a6adc8" stroke-width="2" opacity="0.4"/>
</svg>`;

function serveCover(filePath: string, reply: any) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'image/jpeg';
  const stat = statSync(filePath);

  reply.raw.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stat.size,
    'Cache-Control': 'public, max-age=31536000, immutable',
  });
  createReadStream(filePath).pipe(reply.raw);
  return reply.hijack();
}

function serveDefaultCover(reply: any) {
  const buf = Buffer.from(DEFAULT_COVER_SVG, 'utf-8');
  reply.raw.writeHead(200, {
    'Content-Type': 'image/svg+xml',
    'Content-Length': buf.length,
    'Cache-Control': 'public, max-age=86400',
  });
  reply.raw.end(buf);
  return reply.hijack();
}

export async function coverRoutes(app: FastifyInstance) {
  app.get('/api/v1/cover/:trackId', async (request, reply) => {
    const { trackId } = request.params as { trackId: string };
    const track = await prisma.track.findUnique({ where: { id: trackId } });

    if (!track?.coverPath || !existsSync(track.coverPath)) {
      return serveDefaultCover(reply);
    }

    return serveCover(track.coverPath, reply);
  });

  app.get('/api/v1/cover/album/:albumId', async (request, reply) => {
    const { albumId } = request.params as { albumId: string };
    const album = await prisma.album.findUnique({ where: { id: albumId } });

    if (!album?.coverPath || !existsSync(album.coverPath)) {
      const track = await prisma.track.findFirst({
        where: { albumId, coverPath: { not: null } },
      });
      if (!track?.coverPath || !existsSync(track.coverPath)) {
        return serveDefaultCover(reply);
      }
      return serveCover(track.coverPath, reply);
    }

    return serveCover(album.coverPath, reply);
  });
}
