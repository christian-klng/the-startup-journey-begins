# The Startup Journey Begins

Interactive classroom game: students found a startup on their phones, scan QR
stations around the room and take AI-assisted decisions. See [PLAN.md](PLAN.md).

## Develop

```bash
cp .env.example .env
npm install
npm run dev
```

Content lives in `content/*.yaml` (slides, stations, topics, UI strings). It is
validated on start; errors name the file and field.

## Database

SQLite at `DATABASE_PATH` (default `./data/game.sqlite`). Migrations in
`drizzle/` run automatically on start. After changing
`src/lib/server/db/schema.ts` run `npm run db:generate`.

## Deploy (Coolify, HTTP)

Build from the `Dockerfile` or use `docker-compose.yml`. Mount a volume at
`/data`, expose port 3000, set the variables from `.env.example`
(`PUBLIC_BASE_URL` and `ORIGIN` must be the URL phones will use). Health check:
`GET /healthz`.
