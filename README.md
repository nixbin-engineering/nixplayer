# NixPlayer – Self-Hosted Music Streaming Server

NixPlayer is a self-hosted music streaming server inspired by Navidrome, designed for **folder-based organization** and high-performance music playback. It supports multi-user access, persistent queues, smart playlists, and is fully **Dockerized** for easy deployment.

---

## Features

- Web-based music player
- Mobile-friendly UI
- Multi-user support
- Persistent playback queue
- Folder-based browsing with database hierarchy
- Tag system and playlists
- Smart playlists (query-based)
- Streaming via HTTP range requests

---

## Architecture

NixPlayer uses a **4-component architecture**:

1. **API Server** – Handles authentication, streaming, metadata, and playlists.
2. **Music Scanner/Indexer** – Scans filesystem, extracts metadata, and updates the database.
3. **Web Client** – React-based frontend for browsing, playback, and administration.
4. **PostgreSQL Database** – Stores all music metadata, users, queues, and playlists.

---

## Technology Stack

### Backend (API)

- Node.js
- Fastify
- Prisma ORM
- PostgreSQL
- JWT authentication

### Music Scanner

- Node.js service
- [music-metadata](https://www.npmjs.com/package/music-metadata) for reading tags
- [chokidar](https://www.npmjs.com/package/chokidar) for filesystem watching
- Incremental scanning using file size + mtime fingerprinting
- Parallel metadata parsing for large libraries

### Frontend (Web Client)

- React
- Vite
- Tailwind CSS
- Zustand for player state management

### Streaming

- API supports **HTTP range requests**
- Endpoint: `/stream/:trackId`

---

## Database Entities

- Users
- Sessions
- Tracks
- Folders
- Artists
- Albums
- Tags
- TrackTags
- Playlists
- PlaylistTracks
- QueueItems
- PlaybackState

---

## Folder-Based Browsing

Example library structure:

```
/music/Rock/Pink Floyd/Time.flac
```


- Folder hierarchy is **stored in the database**
- Supports browsing by folder, artist, album, or tags

---

## Playback Queue & State

- **Server-side queue** persists across sessions
- Supports **reorder, remove, append**
- Playback state includes:
  - Current track
  - Playback position
  - Play/pause state
- Stored per user

---

## Scanner Behavior

- Initial full scan on startup
- Incremental updates
- Filesystem watching for new, modified, or deleted tracks
- Cover art extraction
- Efficient for libraries of up to **100k tracks**

---

## Frontend Pages

- Home
- Folders
- Artists
- Albums
- Tags
- Playlists
- Queue
- Search

### Player UI

- Persistent bottom player
- Seek bar, shuffle, repeat
- Next/previous track controls
- Queue panel

---

## Docker Setup

`docker-compose.yml` includes:

- `api` – Backend server
- `scanner` – Music scanner
- `web` – Frontend client
- `postgres` – Database

Music files should be mounted as a Docker volume for persistent storage.

---

## Performance Goals

- Fast scanning and incremental updates
- Indexed database queries for large libraries
- Streaming with minimal latency

---

## Project Structure
nixplayer/
├── api/
│ ├── src/
│ │ ├── controllers/
│ │ ├── routes/
│ │ └── services/
│ ├── prisma/
│ │ └── schema.prisma
│ └── Dockerfile
├── scanner/
│ ├── src/
│ │ ├── scanner.ts
│ │ └── metadata-parser.ts
│ └── Dockerfile
├── web/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── store/
│ │ └── App.jsx
│ └── Dockerfile
├── docker-compose.yml
└── README.md

--- 

## Prisma Schema (Example)

```prisma
model User {
  id       Int      @id @default(autoincrement())
  username String   @unique
  password String
  sessions Session[]
  queue    QueueItem[]
}

model Track {
  id        Int       @id @default(autoincrement())
  title     String
  path      String
  folder    Folder?   @relation(fields: [folderId], references: [id])
  folderId  Int?
  artist    Artist?   @relation(fields: [artistId], references: [id])
  artistId  Int?
  album     Album?    @relation(fields: [albumId], references: [id])
  albumId   Int?
  tags      TrackTag[]
}

model Folder {
  id     Int     @id @default(autoincrement())
  name   String
  parent Folder? @relation("FolderHierarchy", fields: [parentId], references: [id])
  parentId Int?
  tracks Track[]
}

model Playlist {
  id    Int    @id @default(autoincrement())
  name  String
  tracks PlaylistTrack[]
}
API Routes (Example)
Method	Route	Description
GET	/tracks	List all tracks
GET	/tracks/:id	Get track metadata
GET	/stream/:trackId	Stream track with range support
POST	/playlists	Create a new playlist
GET	/playlists/:id	Get playlist details
POST	/queue	Add track to queue
GET	/queue	Get user queue
POST	/auth/login	User login
POST	/auth/register	User registration
Scanner Implementation Outline

Initial full scan of /music folder

Extract metadata using music-metadata

Store track info and folder hierarchy in the database

Detect incremental changes:

New files → add to DB

Deleted files → remove from DB

Modified files → update DB

Watch filesystem using chokidar for real-time updates

Extract cover art and associate with tracks/albums

Frontend Architecture

React + Vite for fast development

Tailwind for styling

Zustand for global player state

Pages: Home, Folders, Artists, Albums, Tags, Playlists, Queue, Search

Persistent player at bottom of the viewport

Components:

TrackList

FolderBrowser

PlayerControls

QueuePanel

Dockerfiles (Example)
API
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "src/server.js"]
Scanner
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "src/scanner.js"]
Web
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
docker-compose.yml (Example)
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ntmusic
      POSTGRES_PASSWORD: ntmusic
      POSTGRES_DB: ntmusic
    volumes:
      - pgdata:/var/lib/postgresql/data

  api:
    build: ./api
    image: ghcr.io/nixbin-engineering/nixplayer-api:latest
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://ntmusic:ntmusic@postgres:5432/ntmusic
    ports:
      - "3000:3000"
    volumes:
      - ./music:/music:ro

  scanner:
    build: ./scanner
    image: ghcr.io/nixbin-engineering/nixplayer-scanner:latest
    depends_on:
      - api
      - postgres
    volumes:
      - ./music:/music:ro

  web:
    build: ./web
    image: ghcr.io/nixbin-engineering/nixplayer-web:latest
    depends_on:
      - api
    ports:
      - "8085:80"

volumes:
  pgdata:
Getting Started
# Clone repository
git clone <repo-url>
cd nixplayer

# Start all services
docker-compose up --build

Access the web client at: http://localhost:8085

API available at: http://localhost:3000

Performance Targets

Scalable to 100k tracks

Fast incremental scanning

Indexed DB queries

Low-latency streaming
