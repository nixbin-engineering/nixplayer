FROM node:20-alpine

WORKDIR /app

# Copy prisma schema and migrations
COPY prisma ./prisma

# Copy api package and install deps
COPY api/package.json ./
RUN npm install

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy api source
COPY api/tsconfig.json ./
COPY api/src ./src

# Build TypeScript
RUN npx tsc

# Sync schema and start
CMD npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss && node dist/index.js
