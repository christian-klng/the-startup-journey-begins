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

## Running a class

1. Open `/admin` (basic auth, password from `ADMIN_PASSWORD`), print the QR sheet.
2. Show `/present` on the projector; arrow keys move, `F` is fullscreen.
3. Students scan the join code, then the stations around the room.
4. Afterwards export the CSV from `/admin`, and start a new game for the next class.

## Database

SQLite at `DATABASE_PATH` (default `./data/game.sqlite`). Migrations in
`drizzle/` run automatically on start. After changing
`src/lib/server/db/schema.ts` run `npm run db:generate`.

## Deploy (Coolify, HTTP)

Build from the `Dockerfile` or use `docker-compose.yml`. Mount a volume at
`/data`, expose port 3000, set the variables from `.env.example`
(`PUBLIC_BASE_URL` must be the URL phones will use). Health check:
`GET /healthz`.
