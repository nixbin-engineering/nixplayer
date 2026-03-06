import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

export async function queueRoutes(app: FastifyInstance) {
  // Get user's queue
  app.get('/api/v1/queue', async (request) => {
    const items = await prisma.queueItem.findMany({
      where: { userId: request.userId },
      orderBy: { position: 'asc' },
      include: { track: { include: { artist: true, album: true } } },
    });
    return { items };
  });

  // Replace entire queue
  app.put('/api/v1/queue', async (request) => {
    const { trackIds } = z.object({ trackIds: z.array(z.string()) }).parse(request.body);

    await prisma.$transaction([
      prisma.queueItem.deleteMany({ where: { userId: request.userId } }),
      ...trackIds.map((trackId, i) =>
        prisma.queueItem.create({
          data: { userId: request.userId, trackId, position: i },
        })
      ),
    ]);

    return { ok: true };
  });

  // Append tracks to queue
  app.post('/api/v1/queue/append', async (request) => {
    const { trackIds } = z.object({ trackIds: z.array(z.string()) }).parse(request.body);

    const last = await prisma.queueItem.findFirst({
      where: { userId: request.userId },
      orderBy: { position: 'desc' },
    });

    const startPos = last ? last.position + 1 : 0;

    await prisma.$transaction(
      trackIds.map((trackId, i) =>
        prisma.queueItem.create({
          data: { userId: request.userId, trackId, position: startPos + i },
        })
      )
    );

    return { ok: true };
  });

  // Remove item from queue
  app.delete('/api/v1/queue/:itemId', async (request) => {
    const { itemId } = request.params as { itemId: string };
    await prisma.queueItem.delete({ where: { id: itemId, userId: request.userId } });
    return { ok: true };
  });

  // Clear queue
  app.delete('/api/v1/queue', async (request) => {
    await prisma.queueItem.deleteMany({ where: { userId: request.userId } });
    return { ok: true };
  });

  // Reorder queue
  app.put('/api/v1/queue/reorder', async (request) => {
    const { itemIds } = z.object({ itemIds: z.array(z.string()) }).parse(request.body);

    await prisma.$transaction(
      itemIds.map((id, i) =>
        prisma.queueItem.update({ where: { id }, data: { position: i } })
      )
    );

    return { ok: true };
  });
}
