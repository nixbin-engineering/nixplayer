import { PrismaClient } from '@prisma/client';
import { fullScan } from './scanner.js';
import { startWatcher } from './watcher.js';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const coverPath = process.env.COVER_PATH || '/data/covers';
const RESCAN_FLAG = path.join(coverPath, '.rescan');

async function checkRescanFlag() {
  try {
    await fs.access(RESCAN_FLAG);
    console.log('Rescan flag detected, starting full scan...');
    await fs.unlink(RESCAN_FLAG);
    await fullScan(prisma);
  } catch {
    // Flag doesn't exist, nothing to do
  }
}

async function main() {
  console.log('nt-music scanner starting...');

  // Wait for database to be ready
  let retries = 10;
  while (retries > 0) {
    try {
      await prisma.$connect();
      break;
    } catch {
      retries--;
      console.log(`Waiting for database... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (retries === 0) {
    console.error('Could not connect to database');
    process.exit(1);
  }

  // Run full scan
  await fullScan(prisma);

  // Start filesystem watcher
  startWatcher(prisma);

  // Poll for rescan flag every 5 seconds
  setInterval(checkRescanFlag, 5000);

  console.log('Scanner running. Watching for changes...');
}

main().catch(err => {
  console.error('Scanner fatal error:', err);
  process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
