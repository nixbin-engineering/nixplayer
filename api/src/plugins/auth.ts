import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fjwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import { config } from '../config.js';

interface JwtPayload {
  sub: string;
  username: string;
  isAdmin: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    userId: string;
    userIsAdmin: boolean;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export const authPlugin = fp(async function authPlugin(app: FastifyInstance) {
  app.register(fjwt, { secret: config.jwtSecret });

  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    // Check query token fallback (for <audio> elements)
    const queryToken = (request.query as Record<string, string>)?.token;
    if (queryToken) {
      try {
        const decoded = app.jwt.verify<JwtPayload>(queryToken);
        request.userId = decoded.sub;
        request.userIsAdmin = decoded.isAdmin;
        return;
      } catch {
        return reply.status(401).send({ error: 'Invalid token' });
      }
    }

    try {
      const decoded = await request.jwtVerify<JwtPayload>();
      request.userId = decoded.sub;
      request.userIsAdmin = decoded.isAdmin;
    } catch {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Add preHandler hook for authenticated routes
  app.addHook('onRequest', async (request, reply) => {
    const url = request.url;
    // Skip auth for public routes
    if (url.startsWith('/api/v1/auth/login') ||
        url.startsWith('/api/v1/auth/register') ||
        url === '/health') {
      return;
    }
    if (url.startsWith('/api/')) {
      await (app as any).authenticate(request, reply);
    }
  });
});
