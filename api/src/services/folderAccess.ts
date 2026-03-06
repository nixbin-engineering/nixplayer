import { prisma } from '../prisma.js';

/**
 * Returns the set of folder IDs a user is allowed to access.
 * Returns null if the user has unrestricted access (admin or no restrictions set).
 * When non-null, the returned set includes the assigned folders and ALL their descendants.
 */
export async function getAllowedFolderIds(userId: string, isAdmin: boolean): Promise<Set<string> | null> {
  if (isAdmin) return null;

  const access = await prisma.userFolderAccess.findMany({
    where: { userId },
    select: { folderId: true },
  });

  // No restrictions set — user can see everything
  if (access.length === 0) return null;

  // Walk tree from each allowed root to collect all descendant folder IDs
  const allowedIds = new Set<string>();
  const queue = access.map(a => a.folderId);

  for (const id of queue) {
    allowedIds.add(id);
  }

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const children = await prisma.folder.findMany({
      where: { parentId },
      select: { id: true },
    });
    for (const child of children) {
      if (!allowedIds.has(child.id)) {
        allowedIds.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return allowedIds;
}
