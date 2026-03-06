import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

export async function tagRoutes(app: FastifyInstance) {
  app.get('/api/v1/tags', async (request) => {
    const tags = await prisma.tag.findMany({
      where: { userId: request.userId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { trackTags: true } } },
    });
    return { tags };
  });

  app.post('/api/v1/tags', async (request) => {
    const { name } = z.object({ name: z.string().min(1).max(100) }).parse(request.body);
    const tag = await prisma.tag.create({
      data: { name, userId: request.userId },
    });
    return tag;
  });

  app.delete('/api/v1/tags/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.tag.delete({ where: { id, userId: request.userId } });
    return { ok: true };
  });

  // Tag a track
  app.post('/api/v1/tracks/:trackId/tags', async (request) => {
    const { trackId } = request.params as { trackId: string };
    const { tagId } = z.object({ tagId: z.string() }).parse(request.body);
    const trackTag = await prisma.trackTag.create({
      data: { trackId, tagId },
    });
    return trackTag;
  });

  // Untag a track
  app.delete('/api/v1/tracks/:trackId/tags/:tagId', async (request) => {
    const { trackId, tagId } = request.params as { trackId: string; tagId: string };
    await prisma.trackTag.deleteMany({ where: { trackId, tagId } });
    return { ok: true };
  });

  // Get tracks by tag
  app.get('/api/v1/tags/:id/tracks', async (request) => {
    const { id } = request.params as { id: string };
    const trackTags = await prisma.trackTag.findMany({
      where: { tagId: id },
      include: { track: { include: { artist: true, album: true } } },
    });
    return { tracks: trackTags.map(tt => tt.track) };
  });
}
