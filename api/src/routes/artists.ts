import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getAllowedFolderIds } from '../services/folderAccess.js';

export async function artistRoutes(app: FastifyInstance) {
  app.get('/api/v1/artists', async (request) => {
    const { page = '1', limit = '50' } = request.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    const trackFilter = allowed ? { tracks: { some: { folderId: { in: [...allowed] } } } } : {};

    const [artists, total] = await Promise.all([
      prisma.artist.findMany({
        where: trackFilter,
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' },
        include: { _count: { select: { albums: true, tracks: true } } },
      }),
      prisma.artist.count({ where: trackFilter }),
    ]);

    return { artists, total, page: parseInt(page), limit: parseInt(limit) };
  });

  app.get('/api/v1/artists/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    const folderFilter = allowed ? { folderId: { in: [...allowed] } } : {};

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        albums: {
          where: allowed ? { tracks: { some: folderFilter } } : {},
          orderBy: { year: 'desc' },
          include: { _count: { select: { tracks: true } } },
        },
        tracks: {
          where: folderFilter,
          orderBy: { title: 'asc' },
          include: { album: true },
        },
      },
    });
    if (!artist) return reply.status(404).send({ error: 'Artist not found' });
    return artist;
  });
}
