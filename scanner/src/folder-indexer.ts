import { PrismaClient } from '@prisma/client';
import path from 'path';

const musicPath = process.env.MUSIC_PATH || '/music';

export async function ensureFolder(prisma: PrismaClient, folderPath: string): Promise<string> {
  // Normalize relative to music root
  const relative = path.relative(musicPath, folderPath);
  if (relative === '' || relative === '.') {
    // Root music folder
    const folder = await prisma.folder.upsert({
      where: { path: musicPath },
      create: { path: musicPath, name: path.basename(musicPath) },
      update: {},
    });
    return folder.id;
  }

  // Ensure parent exists first
  const parentPath = path.dirname(folderPath);
  const parentId = await ensureFolder(prisma, parentPath);

  const folder = await prisma.folder.upsert({
    where: { path: folderPath },
    create: {
      path: folderPath,
      name: path.basename(folderPath),
      parentId,
    },
    update: {},
  });

  return folder.id;
}
