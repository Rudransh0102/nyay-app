# NyayAPP — Indian Legal Tech Platform

> **Zero fluff. Production-ready.** A full-stack Indian legal tech platform providing access to the Indian Constitution, legal document search, and a grievance complaint system.

---

## Architecture

```
nyay-app/
├── backend/                    # Go (Gin) — Modular Monolith / Clean Architecture
│   ├── cmd/api/main.go         # Entry point
│   ├── internal/
│   │   ├── auth/               # Auth module (register, login, JWT)
│   │   ├── legal/              # Legal Explorer module
│   │   ├── complaint/          # Complaint System module
│   │   └── user/               # User & Bookmark module
│   ├── infrastructure/
│   │   ├── postgres/           # PostgreSQL connection pool
│   │   ├── redis/              # Redis caching client
│   │   └── meilisearch/        # Full-text search client
│   ├── pkg/
│   │   ├── config/             # Env-based config
│   │   ├── middleware/         # JWT auth, RBAC, request logger
│   │   ├── response/           # Standardised API responses
│   │   └── logger/             # Structured slog logger
│   ├── migrations/             # SQL migrations (auto-applied by Docker)
│   ├── seeds/                  # Indian Constitution sample data
│   ├── docker-compose.yml      # Postgres, Redis, Meilisearch, API
│   ├── Dockerfile              # Multi-stage Go → distroless
│   └── go.mod
│
└── mobile/                     # React Native (Expo) — Feature-based Architecture
    ├── src/
    │   ├── api/                # Axios client + typed endpoints
    │   ├── features/
    │   │   ├── onboarding/     # Onboarding carousel + Auth screen
    │   │   ├── explorer/       # Legal document list + Article detail
    │   │   ├── complaints/     # File complaint + List complaints
    │   │   └── profile/        # Profile + settings
    │   ├── store/              # Zustand stores (auth, legal, complaint)
    │   ├── theme/              # Design tokens (pastel palette, typography)
    │   ├── navigation/         # Root navigator + Bottom tab bar
    │   └── shared/             # Reusable UI atoms (Button, Card, Input, Badge)
    ├── App.tsx
    └── app.json
```

## Tech Stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Mobile        | React Native (Expo), TypeScript         |
| State         | Zustand                                 |
| API Client    | Axios + interceptors                    |
| Backend       | Go 1.22, Gin framework                  |
| Database      | PostgreSQL 16 (full-text search, UUID)  |
| Cache         | Redis 7 (LRU eviction)                  |
| Search        | Meilisearch v1.7                        |
| Auth          | JWT (HS256) + bcrypt + RBAC             |
| Container     | Docker + distroless                     |

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
docker compose up -d
# API available at http://localhost:8080
```

Local PostgreSQL only (no API container):

```bash
cd backend
docker compose up -d postgres
```

Swap local Postgres → Supabase later: update just `DATABASE_URL` in `backend/.env` to your Supabase Postgres connection string.

### Mobile

```bash
cd mobile
npm install
npm start     # Expo dev server
# Scan QR with Expo Go app on your device
```

## API Endpoints

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout        [auth]
GET  /api/v1/auth/me            [auth]

GET  /api/v1/legal/constitution  ?part=&page=&limit=
GET  /api/v1/legal/search        ?q=&type=&page=&limit=
GET  /api/v1/legal/featured
GET  /api/v1/legal/:id

POST /api/v1/complaints          [auth]
GET  /api/v1/complaints          [auth]
GET  /api/v1/complaints/:id      [auth]
GET  /api/v1/complaints/track/:tid
```

## Roles

| Role    | Permissions                                      |
|---------|--------------------------------------------------|
| citizen | Read legal docs, file complaints, bookmarks      |
| lawyer  | All citizen + view all complaints (future)       |
| admin   | Full access, status updates (future)             |

## Environment

See `backend/.env.example` for all required environment variables.

---

Made in India 🇮🇳 · NyayAPP v1.0.0
