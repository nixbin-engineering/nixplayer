FROM node:20-alpine

WORKDIR /app

# Copy prisma schema
COPY prisma/schema.prisma ./prisma/schema.prisma

# Copy scanner package and install deps
COPY scanner/package.json ./
RUN npm install

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy scanner source
COPY scanner/tsconfig.json ./
COPY scanner/src ./src

# Build TypeScript
RUN npx tsc

CMD ["node", "dist/index.js"]
