# Deploying on Coolify (HTTP)

## 1. Source

Push this repository to GitHub (private is fine) and connect it in Coolify:
**Projects → your project → New Resource → Public/Private Repository (GitHub App)**.

- Branch: `main`
- Build pack: **Dockerfile** (the repo root has one)
- Port: `3000`

## 2. Environment variables

| Name | Value |
|------|-------|
| `SCALEWAY_API_KEY` | your Scaleway Generative APIs key |
| `SCALEWAY_MODEL` | `llama-3.3-70b-instruct` (or another Scaleway model) |
| `ADMIN_PASSWORD` | password for `/admin` |
| `PUBLIC_BASE_URL` | the URL phones will open, e.g. `http://startup.example.com` |
| `ORIGIN` | same value as `PUBLIC_BASE_URL` |

`SCALEWAY_BASE_URL`, `DATABASE_PATH`, `CONTENT_DIR`, `MIGRATIONS_DIR` and `MAX_TEAMS`
have defaults in the image and only need setting to override.

## 3. Persistent storage

Add a **volume** mounted at `/data`. The SQLite database and the station QR tokens
live there; without it every redeploy would invalidate printed QR codes.

## 4. Domain

Set the domain in Coolify as `http://…` (not `https://`), so Traefik serves plain
HTTP. `PUBLIC_BASE_URL` and `ORIGIN` must match it exactly. If you want to try
without a domain, Coolify's generated `sslip.io` address works too — put that in
both variables.

## 5. Health check

Coolify can use `GET /healthz` (port 3000). The Dockerfile already declares it.

## 6. After the first deploy

1. Open `http://<domain>/admin` with the admin password and print the QR sheet.
2. Open `http://<domain>/present` on the projector.
3. If the join QR shows the wrong URL, `PUBLIC_BASE_URL` is wrong.
