-- Independent server-only mobile bearer sessions. Never store token plaintext.
-- Apply after 20261116000000_initial_nexora.sql, with a migration owner.
create table if not exists public.mobile_auth_sessions (
  id uuid primary key,
  owner_id text not null references public.users(id) on delete cascade,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (expires_at > created_at)
);
create index if not exists mobile_auth_sessions_owner_idx on public.mobile_auth_sessions(owner_id);

create table if not exists public.mobile_auth_refresh_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  session_id uuid not null references public.mobile_auth_sessions(id) on delete cascade,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  check (expires_at > created_at)
);
create index if not exists mobile_auth_refresh_session_idx on public.mobile_auth_refresh_tokens(session_id);
-- One unconsumed refresh token per family; consumed rows are replay evidence.
create unique index if not exists mobile_auth_one_current_refresh_idx
  on public.mobile_auth_refresh_tokens(session_id) where consumed_at is null;

create table if not exists public.mobile_auth_access_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  session_id uuid not null references public.mobile_auth_sessions(id) on delete cascade,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  check (expires_at > created_at)
);
create index if not exists mobile_auth_access_session_idx on public.mobile_auth_access_tokens(session_id);

-- No policies for browser/anon clients. The trusted backend must use a tightly
-- scoped server role with BYPASSRLS and perform owner checks itself.
alter table public.mobile_auth_sessions enable row level security;
alter table public.mobile_auth_refresh_tokens enable row level security;
alter table public.mobile_auth_access_tokens enable row level security;
revoke all on table public.mobile_auth_sessions, public.mobile_auth_refresh_tokens,
  public.mobile_auth_access_tokens from public, anon, authenticated;
grant all on table public.mobile_auth_sessions, public.mobile_auth_refresh_tokens,
  public.mobile_auth_access_tokens to service_role;
