import Fastify from 'fastify';
import cors from '@fastify/cors';
import fstatic from '@fastify/static';
import { config } from './config.js';
import { prisma } from './prisma.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { streamRoutes } from './routes/stream.js';
import { trackRoutes } from './routes/tracks.js';
import { folderRoutes } from './routes/folders.js';
import { artistRoutes } from './routes/artists.js';
import { albumRoutes } from './routes/albums.js';
import { coverRoutes } from './routes/cover.js';
import { searchRoutes } from './routes/search.js';
import { queueRoutes } from './routes/queue.js';
import { playbackRoutes } from './routes/playback.js';
import { tagRoutes } from './routes/tags.js';
import { playlistRoutes } from './routes/playlists.js';
import { smartPlaylistRoutes } from './routes/smart-playlists.js';
import { scannerRoutes } from './routes/scanner.js';
import { adminRoutes } from './routes/admin.js';

const app = Fastify({ logger: true });

// Fix BigInt serialization globally — Prisma returns BigInt for large int columns
app.addHook('preSerialization', async (_request, _reply, payload) => {
  return JSON.parse(JSON.stringify(payload, (_key, value) =>
    typeof value === 'bigint' ? Number(value) : value
  ));
});

await app.register(cors, { origin: true, credentials: true });

await app.register(fstatic, {
  root: config.coverPath,
  prefix: '/covers/',
  decorateReply: false,
});

await app.register(authPlugin);

// Health check
app.get('/health', async () => ({ status: 'ok' }));

// Register routes
await app.register(authRoutes);
await app.register(streamRoutes);
await app.register(trackRoutes);
await app.register(folderRoutes);
await app.register(artistRoutes);
await app.register(albumRoutes);
await app.register(coverRoutes);
await app.register(searchRoutes);
await app.register(queueRoutes);
await app.register(playbackRoutes);
await app.register(tagRoutes);
await app.register(playlistRoutes);
await app.register(smartPlaylistRoutes);
await app.register(scannerRoutes);
await app.register(adminRoutes);

// Error handler for Zod validation
app.setErrorHandler((error: any, request, reply) => {
  if (error.name === 'ZodError') {
    return reply.status(400).send({ error: 'Validation error', details: error.issues });
  }
  app.log.error(error);
  return reply.status(error.statusCode || 500).send({ error: error.message });
});

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`API server running on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// Graceful shutdown
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    await prisma.$disconnect();
    await app.close();
    process.exit(0);
  });
}
