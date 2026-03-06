import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { config } from '../config.js';

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/v1/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    const existing = await prisma.user.findUnique({ where: { username: body.username } });
    if (existing) {
      return reply.status(409).send({ error: 'Username already taken' });
    }

    // First user is admin, skip registration check for first user
    const userCount = await prisma.user.count();

    // Check if registration is enabled (skip for first user)
    if (userCount > 0) {
      const setting = await prisma.serverSettings.findUnique({ where: { key: 'registrationEnabled' } });
      if (setting?.value === 'false') {
        return reply.status(403).send({ error: 'Registration is disabled' });
      }
    }
    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        username: body.username,
        passwordHash,
        isAdmin: userCount === 0,
      },
    });

    const token = app.jwt.sign(
      { sub: user.id, username: user.username, isAdmin: user.isAdmin },
      { expiresIn: `${config.sessionExpiryHours}h` }
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + config.sessionExpiryHours * 3600000),
      },
    });

    // Create empty playback state
    await prisma.playbackState.create({
      data: { userId: user.id },
    });

    return { token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } };
  });

  app.post('/api/v1/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { username: body.username } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = app.jwt.sign(
      { sub: user.id, username: user.username, isAdmin: user.isAdmin },
      { expiresIn: `${config.sessionExpiryHours}h` }
    );

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + config.sessionExpiryHours * 3600000),
      },
    });

    return { token, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } };
  });

  app.post('/api/v1/auth/refresh', async (request, reply) => {
    const token = app.jwt.sign(
      { sub: request.userId, username: (request as any).user?.username, isAdmin: request.userIsAdmin },
      { expiresIn: `${config.sessionExpiryHours}h` }
    );

    return { token };
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      await prisma.session.deleteMany({ where: { token } });
    }
    return { ok: true };
  });

  app.get('/api/v1/auth/me', async (request) => {
    const user = await prisma.user.findUnique({
      where: { id: request.userId },
      select: { id: true, username: true, isAdmin: true, createdAt: true },
    });
    return user;
  });

  app.put('/api/v1/auth/password', async (request, reply) => {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6).max(100),
    });
    const body = schema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { id: request.userId } });
    if (!user || !(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
      return reply.status(401).send({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.user.update({
      where: { id: request.userId },
      data: { passwordHash },
    });

    return { ok: true };
  });
}
