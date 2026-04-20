# Trace

Adaptive deal sourcing intelligence engine for Semperr. FastAPI + Jinja2 + HTMX,
SQLAlchemy 2.0 + Postgres 16, Pydantic v2, Gemini 2.5 Flash, Exa.

This directory is a standalone app. It does **not** import or modify anything
in the parent Semperr static site.

## Local bring-up

```bash
cd trace
cp .env.example .env
# Fill in the values (never commit .env):
#   SECRET_KEY=$(openssl rand -hex 32)
#   INVITE_CODE=your-chosen-code
#   GEMINI_API_KEY=...
#   EXA_API_KEY=...
docker compose up -d --build
docker compose exec api alembic upgrade head
```

Open <http://localhost:8000/register>, register with your `INVITE_CODE`,
then you'll be signed in and routed to `/dashboard`.

### Offline / tests only

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e '.[dev]'
pytest -q
```

The test suite mocks Gemini and Exa — no network calls, no real keys required.

## API surface (JSON)

All JSON API routes are mounted under `/api` so they don't collide with the
HTML dashboard routes at the root. The dashboard HTML pages live at `/login`,
`/register`, `/dashboard`, `/strategies/*`, `/runs/*`, `/companies/*`.

- `POST /api/auth/register` — invite-gated
- `POST /api/auth/login`, `POST /api/auth/logout`
- `GET/POST /api/strategies`, `GET/PATCH/DELETE /api/strategies/{id}`
- `POST /api/strategies/{id}/suggest-signals` — Gemini-assisted
- `POST /api/search` `{strategy_id, query?}` → `{run_id}`
- `GET /api/runs`, `GET /api/runs/{id}`
- `POST /api/analyze` — ad-hoc structured intelligence from raw Exa payload

## Pipeline

Maps 1-to-1 with the V1 spec steps:

1. `POST /search` creates a Run, schedules `pipeline.run(run_id)`.
2. `query_gen.generate(signals)` — one Gemini call.
3. `exa.search(query)` per query, bounded concurrency (`EXA_CONCURRENCY`).
4. `extractor.extract(doc)` — Gemini JSON-mode, one call per doc, capped.
5. `normalizer.normalize(signals)` — rule table first, Gemini fallback for unknowns.
6. `aggregator.group_by_company(signals)`.
7. `scorer.score(company, strategy)` — 0-30 Low / 31-60 Medium / 61-100 High.
8. `synthesizer.summarize(company, signals)` — analyst memo JSON.
9. `recency.snapshot(...)` — delta vs prior same-strategy run.

Pipeline is idempotent per `run_id`: re-running wipes prior results + snapshots
for that run before writing.

## Security posture

- **Secrets**: `.env.example` only; real `.env` is gitignored. No keys in commits.
  Suggested hook: `pre-commit` with `detect-secrets`.
- **Passwords**: Argon2id (`argon2-cffi`), never logged, constant-time verify.
- **Sessions**: `itsdangerous` signed token in `HttpOnly; Secure; SameSite=Lax`
  cookie (Secure is off in `ENV=dev` so you can test over http://localhost).
  8-hour idle expiry, rotated on login.
- **CSRF**: double-submit token — `trace_csrf` cookie must match either the
  `X-CSRF-Token` header (HTMX/JSON) or the `csrf_token` form field (HTML forms).
  Bootstrap exception for first-time register/login when no prior session exists.
  Origin check is also enforced on all state-changing requests.
- **Input validation**: every route uses Pydantic; SQL is via SQLAlchemy ORM.
- **Prompt-injection mitigations**: all untrusted text (Exa snippets, user
  descriptions) is wrapped in `<<<DOC>>>…<<<END>>>` blocks inside a fixed system
  prompt. All LLM responses are parsed as JSON and validated against a Pydantic
  schema before any persistence or render. Free-form model text is never
  executed or rendered unescaped (Jinja autoescape on everywhere).
- **Rate limiting**: in-process sliding-window — 5/min on `/api/auth/*` and
  `/login|/register` POSTs, 10/min on `/api/search`. Single-host by design
  for V1; swap to Redis-backed if horizontally scaled.
- **CORS**: disabled. Dashboard and API share origin.
- **Security headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, strict CSP with only the
  font + HTMX origins whitelisted.
- **Logging**: structlog JSON; allowlist scrubber redacts `authorization`,
  `cookie`, `api_key`, `password`, and raw prompt/response bodies at INFO.
  Full prompt/response logging only at DEBUG (disabled in prod).
- **Containers**: multi-stage Dockerfile, non-root `appuser`, healthcheck, no
  build tools in runtime, `no-new-privileges`, pinned base image.
- **DB**: Postgres role `trace` scoped to the `trace` DB only. No superuser.

### Suggested pre-commit hook

```yaml
# .pre-commit-config.yaml (add at repo root)
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.5.0
    hooks:
      - id: detect-secrets
        args: ["--baseline", ".secrets.baseline"]
```

## Verification checklist

1. `cp trace/.env.example trace/.env` and fill placeholders.
2. `docker compose -f trace/docker-compose.yml up -d --build` → both healthy.
3. `docker compose exec api alembic upgrade head` → schema created.
4. `pytest trace/tests -q` → all green (no network).
5. Register at `/register` with your invite code → dashboard.
6. Create a strategy, add signals (or click "Suggest signals"), save.
7. Click "Run search" → run detail with ranked companies, math, analyst memos.
8. Re-run → delta chips show on changed scores.
9. Ad-hoc: `curl -X POST http://localhost:8000/api/analyze -H 'Content-Type: application/json'
   --cookie "trace_session=...; trace_csrf=..." -H "X-CSRF-Token: ..."
   -d @payload.json`.
10. Security smoke: `/dashboard` without session → 302; 6th rapid
    login attempt → 429; `git check-ignore trace/.env` → confirms ignored.

## Out of scope (V2)

- Weight auto-tuning from outcome feedback
- Alerting (email/webhook) for new high-score companies
- Entity resolution beyond normalized name matching
- Historical backtesting UI
