import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { Prisma } from '@prisma/client';

const ruleSchema = z.object({
  field: z.enum(['title', 'artist', 'album', 'genre', 'year', 'format']),
  operator: z.enum(['contains', 'equals', 'startsWith', 'endsWith', 'gt', 'lt', 'gte', 'lte']),
  value: z.string(),
});

const smartPlaylistSchema = z.object({
  name: z.string().min(1).max(200),
  rules: z.array(ruleSchema),
  match: z.enum(['all', 'any']).default('all'),
  limit: z.number().int().min(1).max(1000).default(100),
});

function buildWhere(rules: z.infer<typeof ruleSchema>[], match: string): Prisma.TrackWhereInput {
  const conditions = rules.map(rule => {
    const { field, operator, value } = rule;

    if (field === 'artist') {
      return { artist: { name: buildStringFilter(operator, value) } };
    }
    if (field === 'album') {
      return { album: { name: buildStringFilter(operator, value) } };
    }
    if (field === 'year') {
      return { album: { year: buildNumberFilter(operator, value) } };
    }

    return { [field]: buildStringFilter(operator, value) };
  });

  return match === 'all' ? { AND: conditions } : { OR: conditions };
}

function buildStringFilter(operator: string, value: string) {
  switch (operator) {
    case 'contains': return { contains: value, mode: 'insensitive' as const };
    case 'equals': return { equals: value, mode: 'insensitive' as const };
    case 'startsWith': return { startsWith: value, mode: 'insensitive' as const };
    case 'endsWith': return { endsWith: value, mode: 'insensitive' as const };
    default: return { contains: value, mode: 'insensitive' as const };
  }
}

function buildNumberFilter(operator: string, value: string) {
  const num = parseInt(value);
  switch (operator) {
    case 'equals': return { equals: num };
    case 'gt': return { gt: num };
    case 'lt': return { lt: num };
    case 'gte': return { gte: num };
    case 'lte': return { lte: num };
    default: return { equals: num };
  }
}

export async function smartPlaylistRoutes(app: FastifyInstance) {
  app.get('/api/v1/smart-playlists', async (request) => {
    const playlists = await prisma.smartPlaylist.findMany({
      where: { userId: request.userId },
      orderBy: { updatedAt: 'desc' },
    });
    return { playlists };
  });

  app.post('/api/v1/smart-playlists', async (request) => {
    const body = smartPlaylistSchema.parse(request.body);
    const playlist = await prisma.smartPlaylist.create({
      data: {
        name: body.name,
        userId: request.userId,
        rules: { rules: body.rules, match: body.match, limit: body.limit } as any,
      },
    });
    return playlist;
  });

  app.get('/api/v1/smart-playlists/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const playlist = await prisma.smartPlaylist.findUnique({
      where: { id, userId: request.userId },
    });
    if (!playlist) return reply.status(404).send({ error: 'Not found' });

    const rulesData = playlist.rules as any;
    const where = buildWhere(rulesData.rules || [], rulesData.match || 'all');

    const tracks = await prisma.track.findMany({
      where,
      take: rulesData.limit || 100,
      include: { artist: true, album: true },
      orderBy: { title: 'asc' },
    });

    return { ...playlist, tracks };
  });

  app.put('/api/v1/smart-playlists/:id', async (request) => {
    const { id } = request.params as { id: string };
    const body = smartPlaylistSchema.parse(request.body);
    const playlist = await prisma.smartPlaylist.update({
      where: { id, userId: request.userId },
      data: {
        name: body.name,
        rules: { rules: body.rules, match: body.match, limit: body.limit } as any,
      },
    });
    return playlist;
  });

  app.delete('/api/v1/smart-playlists/:id', async (request) => {
    const { id } = request.params as { id: string };
    await prisma.smartPlaylist.delete({ where: { id, userId: request.userId } });
    return { ok: true };
  });
}
