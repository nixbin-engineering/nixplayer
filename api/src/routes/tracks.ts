import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { getAllowedFolderIds } from '../services/folderAccess.js';

export async function trackRoutes(app: FastifyInstance) {
  app.get('/api/v1/tracks', async (request) => {
    const { page = '1', limit = '50', sort = 'title', order = 'asc' } = request.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    const folderFilter = allowed ? { folderId: { in: [...allowed] } } : {};

    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where: folderFilter,
        skip,
        take: parseInt(limit),
        orderBy: { [sort]: order },
        include: { artist: true, album: true },
      }),
      prisma.track.count({ where: folderFilter }),
    ]);

    return { tracks, total, page: parseInt(page), limit: parseInt(limit) };
  });

  app.get('/api/v1/tracks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const track = await prisma.track.findUnique({
      where: { id },
      include: { artist: true, album: true, folder: true, trackTags: { include: { tag: true } } },
    });
    if (!track) return reply.status(404).send({ error: 'Track not found' });

    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    if (allowed && !allowed.has(track.folderId)) {
      return reply.status(403).send({ error: 'Access denied' });
    }
    return track;
  });

  // Update track metadata (DB only)
  app.put('/api/v1/tracks/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      title: z.string().min(1).max(500).optional(),
      artist: z.string().max(500).nullable().optional(),
      album: z.string().max(500).nullable().optional(),
      trackNo: z.number().int().min(0).nullable().optional(),
      discNo: z.number().int().min(0).nullable().optional(),
      year: z.number().int().min(0).max(9999).nullable().optional(),
    });

    const data = schema.parse(request.body);

    const existing = await prisma.track.findUnique({
      where: { id },
      include: { artist: true, album: true },
    });
    if (!existing) return reply.status(404).send({ error: 'Track not found' });

    const updates: Record<string, unknown> = {};

    if (data.title !== undefined) updates.title = data.title;
    if (data.trackNo !== undefined) updates.trackNo = data.trackNo;
    if (data.discNo !== undefined) updates.discNo = data.discNo;

    // Handle artist change
    if (data.artist !== undefined) {
      if (data.artist) {
        const artist = await prisma.artist.upsert({
          where: { name: data.artist },
          create: { name: data.artist },
          update: {},
        });
        updates.artistId = artist.id;
      } else {
        updates.artistId = null;
      }
    }

    // Handle album change
    if (data.album !== undefined) {
      const artistId = (updates.artistId as string | null | undefined) ?? existing.artistId;
      if (data.album) {
        const album = await prisma.album.upsert({
          where: { name_artistId: { name: data.album, artistId: artistId || '' } },
          create: { name: data.album, artistId, year: data.year },
          update: data.year !== undefined ? { year: data.year } : {},
        });
        updates.albumId = album.id;
      } else {
        updates.albumId = null;
      }
    } else if (data.year !== undefined && existing.albumId) {
      // Update year on existing album
      await prisma.album.update({
        where: { id: existing.albumId },
        data: { year: data.year },
      });
    }

    const track = await prisma.track.update({
      where: { id },
      data: updates,
      include: { artist: true, album: true },
    });

    // Clean up orphaned artists/albums
    if (existing.artistId && existing.artistId !== track.artistId) {
      const count = await prisma.track.count({ where: { artistId: existing.artistId } });
      if (count === 0) {
        await prisma.album.deleteMany({ where: { artistId: existing.artistId, tracks: { none: {} } } });
        await prisma.artist.delete({ where: { id: existing.artistId } }).catch(() => {});
      }
    }
    if (existing.albumId && existing.albumId !== track.albumId) {
      const count = await prisma.track.count({ where: { albumId: existing.albumId } });
      if (count === 0) {
        await prisma.album.delete({ where: { id: existing.albumId } }).catch(() => {});
      }
    }

    return track;
  });
}
