import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

function adminGuard(request: any, reply: any) {
  if (!request.userIsAdmin) {
    return reply.status(403).send({ error: 'Admin only' });
  }
}

export async function adminRoutes(app: FastifyInstance) {
  // All admin routes require admin
  app.addHook('onRequest', async (request, reply) => {
    if (request.url.startsWith('/api/v1/admin')) {
      adminGuard(request, reply);
    }
  });

  // --- System Stats ---
  app.get('/api/v1/admin/stats', async () => {
    const [tracks, artists, albums, folders, users] = await Promise.all([
      prisma.track.count(),
      prisma.artist.count(),
      prisma.album.count(),
      prisma.folder.count(),
      prisma.user.count(),
    ]);

    // Cover art disk usage
    let coverSize = 0;
    try {
      const coverDir = config.coverPath;
      const files = await fs.readdir(coverDir);
      for (const file of files) {
        try {
          const stat = await fs.stat(path.join(coverDir, file));
          coverSize += stat.size;
        } catch {}
      }
    } catch {}

    return { tracks, artists, albums, folders, users, coverSizeBytes: coverSize };
  });

  // --- User Management ---
  app.get('/api/v1/admin/users', async () => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            playlists: true,
            tags: true,
            queueItems: true,
          },
        },
        folderAccess: {
          select: {
            folderId: true,
            folder: { select: { id: true, name: true } },
          },
        },
      },
    });
    return { users };
  });

  app.delete('/api/v1/admin/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Prevent self-deletion
    if (id === request.userId) {
      return reply.status(400).send({ error: 'Cannot delete yourself' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });
    return { ok: true };
  });

  app.put('/api/v1/admin/users/:id/role', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { isAdmin } = z.object({ isAdmin: z.boolean() }).parse(request.body);

    // Prevent removing own admin
    if (id === request.userId && !isAdmin) {
      return reply.status(400).send({ error: 'Cannot remove your own admin role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isAdmin },
      select: { id: true, username: true, isAdmin: true },
    });
    return user;
  });

  app.put('/api/v1/admin/users/:id/password', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { password } = z.object({ password: z.string().min(6).max(100) }).parse(request.body);

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Invalidate all sessions for this user
    await prisma.session.deleteMany({ where: { userId: id } });

    return { ok: true };
  });

  // --- Server Settings ---
  app.get('/api/v1/admin/settings', async () => {
    const settings = await prisma.serverSettings.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  });

  app.put('/api/v1/admin/settings', async (request) => {
    const body = z.record(z.string(), z.string()).parse(request.body);

    for (const [key, value] of Object.entries(body)) {
      await prisma.serverSettings.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      });
    }

    return { ok: true };
  });

  // --- User Folder Access ---
  app.get('/api/v1/admin/users/:id/folders', async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const access = await prisma.userFolderAccess.findMany({
      where: { userId: id },
      include: { folder: { select: { id: true, name: true, path: true } } },
    });
    return { folderIds: access.map(a => a.folderId), folders: access.map(a => a.folder) };
  });

  app.put('/api/v1/admin/users/:id/folders', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { folderIds } = z.object({ folderIds: z.array(z.string()) }).parse(request.body);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    // Replace all folder access entries for this user
    await prisma.userFolderAccess.deleteMany({ where: { userId: id } });
    if (folderIds.length > 0) {
      await prisma.userFolderAccess.createMany({
        data: folderIds.map(folderId => ({ userId: id, folderId })),
      });
    }

    return { ok: true, folderIds };
  });

  // --- Scanner Control ---
  app.post('/api/v1/admin/scanner/trigger', async () => {
    // Write a flag file that the scanner watches
    const flagPath = path.join(config.coverPath, '.rescan');
    await fs.writeFile(flagPath, new Date().toISOString());
    return { ok: true, message: 'Rescan triggered' };
  });

  app.get('/api/v1/admin/scanner/status', async () => {
    const trackCount = await prisma.track.count();
    const lastTrack = await prisma.track.findFirst({ orderBy: { updatedAt: 'desc' } });
    return {
      trackCount,
      lastIndexed: lastTrack?.updatedAt || null,
    };
  });
}
