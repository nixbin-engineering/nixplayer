import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getAllowedFolderIds } from '../services/folderAccess.js';

export async function albumRoutes(app: FastifyInstance) {
  app.get('/api/v1/albums', async (request) => {
    const { page = '1', limit = '50' } = request.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    const trackFilter = allowed ? { tracks: { some: { folderId: { in: [...allowed] } } } } : {};

    const [albums, total] = await Promise.all([
      prisma.album.findMany({
        where: trackFilter,
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' },
        include: {
          artist: true,
          _count: { select: { tracks: true } },
        },
      }),
      prisma.album.count({ where: trackFilter }),
    ]);

    return { albums, total, page: parseInt(page), limit: parseInt(limit) };
  });

  app.get('/api/v1/albums/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    const folderFilter = allowed ? { folderId: { in: [...allowed] } } : {};

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        artist: true,
        tracks: {
          where: folderFilter,
          orderBy: [{ discNo: 'asc' }, { trackNo: 'asc' }],
          include: { artist: true },
        },
      },
    });
    if (!album) return reply.status(404).send({ error: 'Album not found' });
    return album;
  });
}
