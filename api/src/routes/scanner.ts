import { FastifyInstance } from 'fastify';

export async function scannerRoutes(app: FastifyInstance) {
  app.post('/api/v1/scanner/trigger', async (request, reply) => {
    if (!request.userIsAdmin) {
      return reply.status(403).send({ error: 'Admin only' });
    }
    // Scanner runs as a separate service - this is a placeholder for future IPC
    return { message: 'Scanner runs as a separate service. Restart the scanner container to re-scan.' };
  });
}
