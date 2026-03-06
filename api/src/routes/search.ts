import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getAllowedFolderIds } from '../services/folderAccess.js';

export async function searchRoutes(app: FastifyInstance) {
  app.get('/api/v1/search', async (request) => {
    const { q = '', limit = '20' } = request.query as Record<string, string>;
    if (!q.trim()) return { tracks: [], artists: [], albums: [] };

    const take = parseInt(limit);
    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    const folderFilter = allowed ? { folderId: { in: [...allowed] } } : {};

    const [tracks, artists, albums] = await Promise.all([
      prisma.track.findMany({
        where: { title: { contains: q, mode: 'insensitive' }, ...folderFilter },
        take,
        include: { artist: true, album: true },
      }),
      prisma.artist.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          ...(allowed ? { tracks: { some: folderFilter } } : {}),
        },
        take,
      }),
      prisma.album.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          ...(allowed ? { tracks: { some: folderFilter } } : {}),
        },
        take,
        include: { artist: true },
      }),
    ]);

    return { tracks, artists, albums };
  });
}
