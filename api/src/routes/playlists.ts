import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

export async function playlistRoutes(app: FastifyInstance) {
  app.get('/api/v1/playlists', async (request) => {
    const playlists = await prisma.playlist.findMany({
      where: { userId: request.userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { tracks: true } } },
    });
    return { playlists };
  });

  app.post('/api/v1/playlists', async (request) => {
    const { name } = z.object({ name: z.string().min(1).max(200) }).parse(request.body);
    const playlist = await prisma.playlist.create({
      data: { name, userId: request.userId },
    });
    return playlist;
  });

  app.get('/api/v1/playlists/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const playlist = await prisma.playlist.findUnique({
      where: { id, userId: request.userId },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
          include: { track: { include: { artist: true, album: true } } },
        },
      },
    });
    if (!playlist) return reply.status(404).send({ error: 'Playlist not found' });
    return playlist;
  });

  app.put('/api/v1/playlists/:id', async (request) => {
    const { id } = request.params as { id: string };
    const { name } = z.object({ name: z.string().min(1).max(200) }).parse(request.body);
    const playlist = await prisma.playlist.update({
      where: { id, userId: request.userId },
      data: { name },
    });
    return playlist;
  });

  app.delete('/api/v1/playlists/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.playlist.delete({ where: { id, userId: request.userId } });
    return { ok: true };
  });

  // Add tracks to playlist
  app.post('/api/v1/playlists/:id/tracks', async (request) => {
    const { id } = request.params as { id: string };
    const { trackIds } = z.object({ trackIds: z.array(z.string()) }).parse(request.body);

    const last = await prisma.playlistTrack.findFirst({
      where: { playlistId: id },
      orderBy: { position: 'desc' },
    });
    const startPos = last ? last.position + 1 : 0;

    await prisma.$transaction(
      trackIds.map((trackId, i) =>
        prisma.playlistTrack.create({
          data: { playlistId: id, trackId, position: startPos + i },
        })
      )
    );

    return { ok: true };
  });

  // Remove track from playlist
  app.delete('/api/v1/playlists/:id/tracks/:trackItemId', async (request) => {
    const { trackItemId } = request.params as { trackItemId: string };
    await prisma.playlistTrack.delete({ where: { id: trackItemId } });
    return { ok: true };
  });

  // Reorder playlist tracks
  app.put('/api/v1/playlists/:id/reorder', async (request) => {
    const { id } = request.params as { id: string };
    const { itemIds } = z.object({ itemIds: z.array(z.string()) }).parse(request.body);

    await prisma.$transaction(
      itemIds.map((itemId, i) =>
        prisma.playlistTrack.update({ where: { id: itemId }, data: { position: i } })
      )
    );

    return { ok: true };
  });
}
