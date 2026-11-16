# Supabase migration status

Updated 2026-11-16.

## Completed

- Supabase URL, publishable key, server secret key, and PostgreSQL Session pooler URI are stored as managed server secrets.
- `/api/health/supabase` reaches the Supabase REST gateway without exposing credentials.
- PostgreSQL connection authentication succeeds with the Session pooler URI.
- The initial NEXORA PostgreSQL schema is applied to `public`.
- RLS is enabled on all NEXORA application tables. Browser roles have no table grants; the server uses the secret key only after its own account authorization.
- The private `nexora-private` Storage bucket exists with image/video MIME and size limits.
- `npm run supabase:import-sqlite` is idempotent and imports users, sessions, records, generation keys, rate limits, billing customers, billing events, and account tokens when a SQLite database exists. The current workspace had no `.data/nexora.sqlite`, so zero customer rows were imported.

## Important boundary

The existing request handlers still call the synchronous `node:sqlite` repository. The PostgreSQL schema is therefore prepared, but it is not yet the live application repository. This is intentional: replacing that synchronous repository without converting the authentication, billing, generation, workspace, and media call sites to asynchronous operations could lose sessions or billing state.

The remaining production migration is to introduce an async repository interface, run SQLite and PostgreSQL parity tests, switch the server request path behind a feature flag, verify Stripe webhook idempotency and AI usage accounting, and only then remove the SQLite dependency. Until that work is complete, keep a persistent SQLite volume and treat Supabase as prepared infrastructure rather than a claim that customer records are already there.

## Commands

```sh
npm run supabase:migrate
npm run supabase:storage
npm run supabase:import-sqlite
```

The commands require the server-only `SUPABASE_DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` environment variables. Never place these values in browser code, Git, or `.env.example`.
