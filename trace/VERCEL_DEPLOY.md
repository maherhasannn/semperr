# Trace — Deploy to Vercel + Neon

End-to-end setup for Vercel **Hobby** (60s serverless budget) with **Neon** Postgres.

## Architecture

- **Vercel**: serves the FastAPI app via the Python framework preset. Vercel
  auto-detects `app/main.py` (which exports `app = create_app()`) and deploys
  the whole app as a single Vercel Function. Routing is handled inside FastAPI.
- **Neon**: Postgres with `sslmode=require`. Use the **pooled** connection
  string (host contains `-pooler`) — critical for serverless, which opens
  connections on every cold start.
- **Pipeline**: runs synchronously inside the HTTP request. Set
  **Project Settings → Functions → Max Duration = 60s** (Hobby ceiling).
  If your strategy needs deeper retrieval, move to Vercel Pro (300s) or
  switch to a queue (see "Scaling beyond Hobby" below).

Hard limits on Hobby that drove these decisions:

- No persistent background workers → `BackgroundTasks` / `asyncio.create_task`
  die when the response is sent. Everything must finish inline.
- No file-system persistence → SQLite is unusable. Must use external DB.
- Memory ceiling 1024 MB → small connection pool + bounded concurrency.

## 1. Create the Neon project

1. Sign in at https://console.neon.tech.
2. **Create project** → name it `trace`, pick a region close to your Vercel
   region (usually `us-east-1` / `iad1` for Vercel Hobby).
3. In the project's **Dashboard** → **Connection Details**:
   - Change the dropdown to **Pooled connection** (host ends in
     `-pooler.<region>.aws.neon.tech`).
   - Copy the `postgresql://…` URL. It will look like:
     ```
     postgresql://neondb_owner:PASSWORD@ep-cool-name-a1b2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
     ```
4. Trace will auto-rewrite the scheme to `postgresql+psycopg://…` and ensure
   `sslmode=require` is present.

## 2. Run migrations against Neon (from your laptop)

Vercel builds don't run arbitrary commands, so apply schema migrations once
from your machine, then again whenever you add a revision.

```bash
cd trace
python3.11 -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'

# Use the Neon URL. Alembic needs the SQLAlchemy-style scheme.
export DATABASE_URL='postgresql+psycopg://neondb_owner:PASSWORD@ep-...-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require'
export SECRET_KEY=$(openssl rand -hex 32)      # any 32+ chars — not used by alembic, just required by config
export INVITE_CODE=placeholder                 # same

alembic upgrade head
```

You should see `Running upgrade  -> 0001_initial`. Confirm in Neon's **SQL
Editor**: `\dt` (or the tables pane) shows `users`, `strategies`,
`signal_defs`, `runs`, `company_results`, `signal_findings`,
`score_snapshots`, `alembic_version`.

## 3. Configure the Vercel project

From the `trace/` directory:

```bash
npm i -g vercel          # once
vercel login
vercel link              # create a new project when prompted; link to `trace`
```

### Environment variables

**Project Settings → Environment Variables**, set for **Production** *and*
**Preview**:

| Name | Value |
|---|---|
| `SECRET_KEY` | `openssl rand -hex 32` output |
| `INVITE_CODE` | any secret string you'll share with invited operators |
| `DATABASE_URL` | Neon pooled URL from step 1 |
| `GEMINI_API_KEY` | from Google AI Studio |
| `EXA_API_KEY` | from https://dashboard.exa.ai |
| `ENV` | `prod` |
| `LOG_LEVEL` | `INFO` |
| `EXA_CONCURRENCY` | `3` |
| `MAX_DOCS_PER_QUERY` | `3` |

Do **not** prefix any of these with `VERCEL_` or `NEXT_PUBLIC_` — they are
server-only.

### Python runtime + function limits

Vercel auto-detects Python from `requirements.txt` and activates the FastAPI
framework preset on `app/main.py`. Framework presets don't accept per-file
`functions` config in `vercel.json`, so configure limits via the dashboard:

- **Project Settings → General → Root Directory**: `trace`
- **Project Settings → Functions → Max Duration**: `60` (Hobby ceiling)
- **Runtime**: `python3.12` (Vercel default; Trace requires `>=3.11`).
- **Memory**: `1024` MB (Hobby default).

## 4. Deploy

```bash
vercel --prod
```

First deploy takes ~90s (cold-builds the wheel for `psycopg[binary]`,
`argon2-cffi`, etc.). Subsequent deploys reuse the build cache.

## 5. Custom domain (`trace.semperr.com`)

Two Vercel projects, two hostnames off the same root domain:

| Vercel project | Hostname | What it serves |
|---|---|---|
| `semperr` (marketing) | `semperr.com`, `www.semperr.com` | Static site |
| `trace` (this project) | `trace.semperr.com` | Trace FastAPI app |

Steps:

1. Vercel → **semperr** project → **Settings → Domains** → add
   `semperr.com` + `www.semperr.com`. Vercel shows the DNS records to add.
2. Vercel → **trace** project → **Settings → Domains** → add
   `trace.semperr.com`.
3. At your domain registrar's DNS panel, add the records Vercel shows:
   - Apex `semperr.com` → **A** record → `76.76.21.21`
   - `www` → **CNAME** → `cname.vercel-dns.com`
   - `trace` → **CNAME** → `cname.vercel-dns.com`
4. Wait ~5 min for DNS propagation. Vercel auto-provisions SSL certificates
   once each record resolves (Let's Encrypt, renewed automatically).
5. The marketing site's sign-in links point at
   `https://trace.semperr.com/invite` — no further code change needed
   once DNS is live. The Trace dashboard footer has a back-link to
   `https://semperr.com`. The subdomain identifies the product, so routes
   inside the app are un-prefixed: `/invite`, `/auth/callback`, `/dashboard`,
   `/strategies/*`, `/runs/*`, `/companies/*`. The JSON API is under `/api/*`.

## 6. Smoke test

```bash
# Once DNS is live:
export BASE=https://trace.semperr.com

# Or on the raw Vercel hostname while DNS propagates:
# export BASE=https://<trace-project>.vercel.app

# 1. Dashboard loads and redirects to the invite gate.
curl -sI "$BASE/dashboard" | head -1    # 302 to /invite

# 2. Request access via the invite page (in a browser — easier, handles CSRF).
open "$BASE/invite"
# Enter your email + INVITE_CODE; you'll be redirected to Neon Auth's hosted
# sign-in page. Complete the magic link to land on /dashboard.

# 3. Create a strategy, add signals (e.g. covenant_breach w=2, missed_payment w=1.5),
# click "Run search". The request will hang up to 60s; the results page renders
# ranked companies when the pipeline finishes.
```

## 7. Monitoring

- **Vercel → Logs** streams stdout from the function. Trace emits JSON
  structured logs (`app.logging`), so filter by `event` or `level`.
- **Neon → Monitoring** shows connection count and query latency.
- A run that hits the 60s ceiling is visible in logs as
  `Vercel Function Execution Timeout`. Reduce `MAX_DOCS_PER_QUERY` or
  strategy signal count, or move to Pro.

## Scaling beyond Hobby

When you outgrow 60s (e.g. 8+ signals × 3 docs × LLM extraction > budget):

1. **Vercel Pro** — bump **Max Duration** to `300` in Project Settings and
   raise `MAX_DOCS_PER_QUERY` / `EXA_CONCURRENCY`. Simplest upgrade.
2. **Queue-based pipeline** — introduce Upstash QStash (or Inngest):
   `/search` enqueues a job and returns `run_id` immediately; a separate
   `/api/worker` route receives the webhook and runs the pipeline. The
   dashboard already polls `/runs/{id}/status` — that poller will
   continue to work unchanged. This is the V2 upgrade path.

## Security reminders (unchanged from local)

- `ENV=prod` forces `Secure` session cookies. Ensure your custom domain is
  HTTPS-only (Vercel does this by default).
- CSP in `app.main` already allows only `fonts.googleapis.com` +
  `fonts.gstatic.com` + `unpkg.com` (htmx). If you move htmx to your own
  bundle, tighten `script-src` to `'self'`.
- Rotate `SECRET_KEY` by redeploying with a new value — this invalidates all
  active sessions (users must re-authenticate via Neon Auth).
- Rotate `INVITE_CODE` after the invited cohort has signed up.
- `NEON_AUTH_PROJECT_ID` and `NEON_AUTH_SECRET_SERVER_KEY` live in Vercel env
  vars. The JWKS URL is derived from the project id.

## Local dev (unchanged)

You can still run the docker-compose stack locally. Nothing on Vercel
interferes with it:

```bash
cp .env.example .env && $EDITOR .env
docker compose up -d --build
docker compose exec api alembic upgrade head
open http://localhost:8000/invite
```
