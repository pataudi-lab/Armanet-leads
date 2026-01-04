# Armanet Ad Poacher

An end-to-end MVP for crawling publisher sources, detecting ad placements, aggregating advertisers into leads, and reviewing evidence in an admin UI.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma + PostgreSQL
- Redis + BullMQ worker
- Cheerio for static parsing; Playwright for dynamic rendering/screenshots
- Pino logging; zod validation
- Authentication via NextAuth Credentials (email + admin password)

## Run the web app locally
1) Copy and edit environment
```bash
cp .env.example .env
# set DATABASE_URL / DIRECT_DATABASE_URL for Postgres, REDIS_URL for Redis,
# NEXTAUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
```

2) Install dependencies
```bash
npm install
# If your environment injects proxies that return 403s, try:
npm run install:clean
```

3) Apply database schema and seed demo data
```bash
npm run migrate
npm run seed
```

4) Start the Next.js admin UI
```bash
npm run dev
# UI: http://localhost:3000 (sign in with ADMIN_EMAIL / ADMIN_PASSWORD)
```

5) Start the worker in a second terminal to enable crawling/aggregation
```bash
npm run worker
```

## Run with Docker (web + worker + Postgres + Redis)
```bash
docker compose up --build
# web available at http://localhost:3000 (use ADMIN_EMAIL / ADMIN_PASSWORD)
# db exposed on 5432, redis on 6379
```
To re-seed after a clean start, exec into the web container:
```bash
docker compose exec web npm run migrate
docker compose exec web npm run seed
```

## What you can do in the UI
- Sources: add/edit, run-now, JSON import/export.
- Dashboard: quick stats for leads/observations/job runs.
- Leads: scored advertisers with evidence and CSV export.
- Lead detail: score breakdown, status/notes, recent observations.
- Observations: latest detections with confidence/snippets/screenshots (if captured).
- Logs: crawl logs and job runs.

## Getting Started
1. Copy environment
```bash
cp .env.example .env
```
Update `DATABASE_URL`, `DIRECT_DATABASE_URL`, `REDIS_URL`, `NEXTAUTH_SECRET`, and admin credentials.

2. Install dependencies
```bash
npm install
```

3. Database setup
```bash
npm run migrate
npm run seed
```

4. Run services
- Web app: `npm run dev`
- Worker: `npm run worker`

Ensure PostgreSQL and Redis are running locally. Default URLs point to localhost.

## Scripts
- `npm run dev` – start Next.js dev server
- `npm run worker` – run BullMQ worker and queues
- `npm run migrate` – apply production migrations
- `npm run migrate:dev` – develop migrations
- `npm run seed` – load demo sources and observations

## Project Structure
- `src/app` – Next.js App Router pages & API routes
- `src/components` – shared UI components
- `src/lib` – utilities (prisma, redis, logging, crawling, scoring)
- `worker` – BullMQ queue definitions and job processors
- `prisma` – schema and seed data

## Development Notes
- Crawling is polite: per-domain concurrency of 2, jittered delays, robots.txt awareness, and graceful handling of 403/429.
- Observations include HTML snippets and evidence URLs; screenshots are optional when Playwright is available.
- Lead scoring is explainable and stored alongside evidence for transparency in the UI.
- Sources can be imported/exported as JSON for quick configuration.
