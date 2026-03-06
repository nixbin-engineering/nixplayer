import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma.js';
import { getAllowedFolderIds } from '../services/folderAccess.js';

export async function folderRoutes(app: FastifyInstance) {
  // Get root folders
  app.get('/api/v1/folders', async (request) => {
    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    const folders = await prisma.folder.findMany({
      where: {
        parentId: null,
        ...(allowed ? { id: { in: [...allowed] } } : {}),
      },
      orderBy: { name: 'asc' },
      include: { _count: { select: { children: true, tracks: true } } },
    });
    return { folders };
  });

  // Get folder by id with children and tracks
  app.get('/api/v1/folders/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    if (allowed && !allowed.has(id)) {
      return reply.status(403).send({ error: 'Access denied to this folder' });
    }
    const folder = await prisma.folder.findUnique({
      where: { id },
      include: {
        children: {
          where: allowed ? { id: { in: [...allowed] } } : {},
          orderBy: { name: 'asc' },
          include: { _count: { select: { children: true, tracks: true } } },
        },
        tracks: {
          orderBy: [{ discNo: 'asc' }, { trackNo: 'asc' }, { title: 'asc' }],
          include: { artist: true, album: true },
        },
        parent: true,
      },
    });
    if (!folder) return reply.status(404).send({ error: 'Folder not found' });
    return folder;
  });

  // Get all tracks recursively from a folder and its subfolders
  app.get('/api/v1/folders/:id/tracks', async (request, reply) => {
    const { id } = request.params as { id: string };
    const allowed = await getAllowedFolderIds(request.userId, request.userIsAdmin);
    if (allowed && !allowed.has(id)) {
      return reply.status(403).send({ error: 'Access denied to this folder' });
    }

    const root = await prisma.folder.findUnique({ where: { id } });
    if (!root) return reply.status(404).send({ error: 'Folder not found' });

    // Walk tree iteratively to collect all folder IDs
    const folderIds: string[] = [id];
    const queue = [id];
    while (queue.length > 0) {
      const parentId = queue.shift()!;
      const children = await prisma.folder.findMany({
        where: { parentId },
        select: { id: true },
      });
      for (const child of children) {
        folderIds.push(child.id);
        queue.push(child.id);
      }
    }

    const tracks = await prisma.track.findMany({
      where: { folderId: { in: folderIds } },
      include: { artist: true, album: true, folder: true },
      orderBy: [
        { folder: { path: 'asc' } },
        { discNo: 'asc' },
        { trackNo: 'asc' },
        { title: 'asc' },
      ],
    });

    return { tracks };
  });

  // Get folder breadcrumb path
  app.get('/api/v1/folders/:id/breadcrumb', async (request, reply) => {
    const { id } = request.params as { id: string };
    const breadcrumb: { id: string; name: string }[] = [];
    let current = await prisma.folder.findUnique({ where: { id } });

    while (current) {
      breadcrumb.unshift({ id: current.id, name: current.name });
      if (current.parentId) {
        current = await prisma.folder.findUnique({ where: { id: current.parentId } });
      } else {
        break;
      }
    }

    return { breadcrumb };
  });
}
