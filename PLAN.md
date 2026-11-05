# The Startup Journey Begins — Implementation Plan

An interactive classroom game. Students scan QR codes around the room, found a
(fictional) startup or NGO and take LLM-assisted decisions station by station.
Learning goals: (a) critically evaluate AI output, (b) experience how fast AI can
help shape a business idea.

Two faces of one app:

| View | Who | Where | Purpose |
|------|-----|-------|---------|
| Presenter | educator | TV / projector | slides, join QR, live team board, conclusion |
| Game | students | their phones | found a startup, visit stations, decide |

---

## 1. Decisions taken (change if you disagree)

| Topic | Decision | Why |
|-------|----------|-----|
| Runtime | Node 22+ (LTS), TypeScript | one language front and back, trivial Docker image |
| Framework | **SvelteKit** (adapter-node) | server routes + reactive UI in one project; small bundles for phones; SSR so slow classroom WiFi still works |
| Database | **SQLite** via `better-sqlite3` + Drizzle ORM, file on a Coolify volume | one class = a few dozen rows; zero ops; survives restarts |
| Live updates | **Server-Sent Events** (SSE) to the presenter board | one-way push is all we need; works over plain HTTP, no websocket upgrade issues behind proxies |
| LLM | Scaleway Generative APIs, OpenAI-compatible endpoint `https://api.scaleway.ai/v1`, called through the `openai` npm client with a custom `baseURL` | no vendor SDK; model is a config value (e.g. `llama-3.3-70b-instruct` or `mistral-nemo-instruct-2407`) |
| Student identity | anonymous **cookie** (`sj_team`, httpOnly, 1 day) set when a team is founded; no logins | zero friction for phones; a team = a phone |
| Content (slides, stations, topics) | **YAML files** in `content/`, loaded at start | you author slides/stations as text; no admin UI needed for v1 |
| Station access control | each station URL carries a **secret token** that only exists in the printed QR code (`/s/<token>`) | students cannot type or guess station URLs; the phone shows only "3 of 7 stations done" |
| Transport | HTTP only, port 3000, Coolify handles routing | as requested |
| Language | UI strings in one `content/strings.yaml` (default German, English possible) | you decide the classroom language |

---

## 2. Game flow

```
Presenter                          Student phone
---------                          -------------
Slides 1..n (concepts)
Slide "Join": WiFi + QR  ───────►  GET /join
                                   enter team name(s), pick topic
                                   POST /join  → team created, cookie set
                                   /me  : "Your startup: ... 0 / 7 stations"
Slide "Live board" (SSE)  ◄──────  (team appears)
                                   scan station QR → GET /s/<token>
                                   LLM generates options (incl. 1 absurd one)
                                   pick an option or type own → POST
                                   /me : "1 / 7 stations", next hint
Slide "Live board" updates ◄─────  (progress bar moves, choice logged)
                                   ... all stations ...
                                   /me : "Journey complete" + pitch summary
Slide "Conclusion"
  - per team: topic, path taken, how many absurd options were picked
  - LLM one-line pitch per team (optional)
```

Stations can be visited in **any order** (free roaming in the room). The LLM
always receives the full history of the team's previous decisions, so later
stations build on earlier ones regardless of order. A team cannot revisit a
completed station (shows their recorded choice instead).

---

## 3. The "absurd option" mechanic (learning goal a)

For every station the server asks the LLM for `N` serious options **plus one
deliberately absurd / wrong / dangerous option**, returned as structured JSON:

```json
{ "options": [
    {"title": "...", "text": "...", "absurd": false},
    {"title": "...", "text": "...", "absurd": true}
]}
```

- The server **shuffles** the options and stores which one was the trap.
- The phone never reveals which option is the trap at decision time.
- Immediately after choosing, the student gets a short reveal
  ("That one was the trap. Did you notice why?") — configurable per station
  (`reveal: immediate | end | never`).
- The presenter board and conclusion slide show "traps taken" per team and for
  the whole class — the educator's debrief material.
- A free-text "our own idea" field is always present; own ideas are recorded as
  `kind: own`.

Each station YAML can tune the trap's flavour (e.g. "illegal", "ethically
wrong", "financially ruinous", "technically impossible").

---

## 4. Content authoring (your part)

```
content/
  slides.yaml      presenter deck
  stations.yaml    the QR stations
  topics.yaml      selectable problem spaces (loneliness, bad education, ...)
  strings.yaml     UI texts
```

`slides.yaml` example:

```yaml
- type: title
  title: The Startup Journey Begins
  subtitle: An experiment with AI as your co-founder
- type: markdown
  title: What is a business model?
  body: |
    - Who has the problem?
    - ...
- type: join            # renders WiFi box + QR to /join
  wifi: { ssid: "Classroom", password: "..." }
- type: board           # live team progress (SSE)
- type: conclusion      # per-team summary, trap statistics
```

`stations.yaml` example:

```yaml
- id: attention
  title: Promoting your idea
  question: Where is the underpriced attention?
  hint: Think about where your target group spends time and nobody competes for it yet.
  options: 4            # serious options generated by the LLM
  trap: absurd          # absurd | illegal | unethical | ruinous
  reveal: immediate
```

Tokens for station QR codes are generated once (`npm run tokens`) and stored in
`content/station-tokens.json`; `/admin/qr` renders a printable sheet of all
station QR codes (A4, one per page) plus the join QR.

---

## 5. Routes

| Route | View | Notes |
|-------|------|-------|
| `/present` | presenter | keyboard ← → to move between slides; `?slide=n` deep link; `F` fullscreen |
| `/present/board` | presenter | standalone live board (also embedded as a slide) |
| `/join` | game | form: team name(s), topic; creates team + cookie |
| `/me` | game | dashboard: startup name, topic, progress `done/total`, past decisions |
| `/s/<token>` | game | station page; 404 for unknown token; redirect to `/join` without cookie |
| `/admin` | educator | basic-auth (env `ADMIN_PASSWORD`); reset game, export CSV, QR sheet |
| `/admin/qr` | educator | printable QR codes |
| `/api/events` | SSE | team/progress events for the board |
| `/api/station/<token>/options` | JSON | generates (and caches) options for the current team |
| `/api/station/<token>/decide` | JSON | records the decision |
| `/healthz` | | for Coolify health check |

---

## 6. Data model (SQLite)

```
teams        id, name, members, topic_id, created_at, completed_at
stations     id (slug), token, position           -- synced from YAML at start
generations  id, team_id, station_id, model, prompt_hash, options_json, trap_index, created_at
decisions    id, team_id, station_id, generation_id, option_index | NULL, own_text | NULL,
             was_trap (bool), created_at
sessions     id (single row), started_at, reset_at   -- one "game" per deployment; reset wipes teams
```

---

## 7. LLM integration

- Client: `openai` npm package, `baseURL: https://api.scaleway.ai/v1`, `apiKey: SCALEWAY_API_KEY`.
- JSON mode / schema-constrained output where the model supports it; otherwise
  a strict system prompt + server-side JSON validation with `zod` and one retry.
- Prompt = system (game rules, tone, "exactly one absurd option, mark it") +
  station question + hint + team topic + ordered list of previous decisions.
- **Generation is cached per (team, station)**: refreshing the page never burns
  another call or shows different options.
- Timeout 20 s; on failure the phone shows a retry button, and the educator sees
  a red marker on the board.
- Temperature ~0.8 for variety between teams.
- Cost/latency guard: `MAX_TEAMS` env (default 40).

---

## 8. Project layout

```
.
├── content/                 YAML authored by the educator
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db/          drizzle schema + migrations
│   │   │   ├── content.ts   load + validate YAML
│   │   │   ├── llm.ts       Scaleway client, prompt builder, option generation
│   │   │   ├── events.ts    in-process event bus → SSE
│   │   │   └── auth.ts      team cookie, admin basic-auth
│   │   └── components/      Slide types, Board, OptionCard, ProgressRing, QR
│   └── routes/              (see §5)
├── Dockerfile
├── docker-compose.yml       for Coolify (volume for /data)
├── .env.example
└── PLAN.md
```

---

## 9. Deployment on Coolify (HTTP)

- Single Dockerfile (multi-stage: build → `node:22-alpine` runtime).
- Persistent volume mounted at `/data` for `game.sqlite`.
- Env vars: `SCALEWAY_API_KEY`, `SCALEWAY_MODEL`, `ADMIN_PASSWORD`,
  `PUBLIC_BASE_URL` (used to render QR codes), `ORIGIN` (SvelteKit CSRF),
  `DATABASE_PATH=/data/game.sqlite`.
- Coolify: "Docker Compose" or "Dockerfile" app, port 3000, HTTPS disabled, health
  check `/healthz`.
- Phones must reach `PUBLIC_BASE_URL` from the classroom WiFi; the join slide
  prints exactly that URL under the QR as a fallback.

---

## 10. Milestones

1. **Skeleton** — SvelteKit + Drizzle + SQLite, content loader, Dockerfile, `/healthz`. Deploy to Coolify once, early.
2. **Join + dashboard** — `/join`, cookie, `/me`, topics from YAML.
3. **Stations** — token QR sheet, `/s/<token>`, LLM options with trap, decision recording, caching.
4. **Presenter** — slide deck from YAML, join slide with QR + WiFi, live board via SSE.
5. **Conclusion + admin** — summary slide, trap statistics, CSV export, reset.
6. **Polish** — phone UX offline/slow-WiFi resilience, error states, print styles, German strings.
7. **Dry run** — simulate 30 teams with a script, check LLM latency and cost.

---

## 11. Open questions for you

1. Classroom language: German, English or switchable?
2. Should teams see each other's progress on their phones, or only the TV?
3. Trap reveal: immediately after the choice, only at the end, or never (debrief by you)?
4. Should the LLM also generate a startup **name** after join (fun, one extra call)?
5. One game per deployment with a reset button, or named sessions (e.g. per class) kept in history?
6. Which Scaleway model do you prefer? Default proposal: `llama-3.3-70b-instruct`.
