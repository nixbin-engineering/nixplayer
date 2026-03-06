export const config = {
  port: parseInt(process.env.API_PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'change-me-to-a-random-secret',
  musicPath: process.env.MUSIC_PATH || '/music',
  coverPath: process.env.COVER_PATH || '/data/covers',
  sessionExpiryHours: 24 * 30, // 30 days
};
