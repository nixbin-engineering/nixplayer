You are a senior full-stack engineer.

Design and implement a self-hosted music streaming server similar to Navidrome but with stronger folder-based organization.

Requirements:

Core goals:

* Web-based music player
* Mobile-friendly UI
* Self-hosted
* Dockerized
* Multi-user support
* Persistent playback queue
* Folder-based browsing
* Tag system
* Playlists
* Smart playlists (query-based)

Architecture:
Use a 4-component architecture:

1. API server
2. Music scanner/indexer
3. Web client
4. PostgreSQL database

Technology choices:

Backend:

* Node.js
* Fastify
* Prisma ORM
* PostgreSQL
* JWT authentication

Scanner:

* Node.js service
* music-metadata for reading tags
* chokidar for filesystem watching
* incremental scanning using file size + mtime fingerprinting
* parallel metadata parsing

Frontend:

* React
* Vite
* Tailwind
* Zustand for player state

Streaming:

* API must support HTTP range requests
* endpoint: /stream/:trackId

Database entities:

Users
Sessions
Tracks
Folders
Artists
Albums
Tags
TrackTags
Playlists
PlaylistTracks
QueueItems
PlaybackState

Features:

Folder structure browsing
Example:
/music/Rock/Pink Floyd/Time.flac

Folder hierarchy must be stored in database.

Playback queue:

* stored server-side
* persists across sessions
* supports reorder, remove, append

Playback state:

* current track
* playback position
* play/pause state
* stored per user

Scanner behavior:

* initial full scan
* incremental updates
* filesystem watching
* cover art extraction
* detect new, deleted, and modified files

Frontend UI pages:

Home
Folders
Artists
Albums
Tags
Playlists
Queue
Search

Player UI:

bottom persistent player
seek bar
shuffle
repeat
next/previous
queue panel

Docker requirements:

Provide a docker-compose setup with services:

* api
* scanner
* web
* postgres

Music files must be mounted as a volume.

Performance targets:

Library size:
100k tracks

Goals:

* fast scans
* indexed database queries
* streaming with minimal latency

Output:

1. full project folder structure
2. Prisma schema
3. API route definitions
4. scanner implementation outline
5. React frontend architecture
6. Dockerfiles and docker-compose
7. example code for core components

