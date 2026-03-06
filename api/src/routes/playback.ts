import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';

export async function playbackRoutes(app: FastifyInstance) {
  app.get('/api/v1/playback', async (request) => {
    const state = await prisma.playbackState.findUnique({
      where: { userId: request.userId },
    });
    return state || { currentTrackId: null, position: 0, isPlaying: false };
  });

  app.put('/api/v1/playback', async (request) => {
    const body = z.object({
      currentTrackId: z.string().nullable().optional(),
      position: z.number().optional(),
      isPlaying: z.boolean().optional(),
    }).parse(request.body);

    const state = await prisma.playbackState.upsert({
      where: { userId: request.userId },
      create: { userId: request.userId, ...body },
      update: body,
    });

    return state;
  });
}
