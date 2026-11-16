-- NEXORA PostgreSQL foundation.
-- The application currently uses a server-owned session model, so no table is
-- directly exposed to anon/authenticated clients. The server uses service_role
-- after its own owner authorization checks.

create table if not exists public.schema_migrations (
  version integer primary key,
  applied_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.users (
  id text primary key,
  email text not null unique,
  password_hash text not null,
  locale text not null,
  created_at timestamptz not null
);

create table if not exists public.sessions (
  token_hash text primary key,
  user_id text not null references public.users(id) on delete cascade,
  expires_at timestamptz not null
);
create index if not exists sessions_user_idx on public.sessions(user_id);

create table if not exists public.records (
  owner_id text not null references public.users(id) on delete cascade,
  kind text not null,
  id text not null,
  payload jsonb not null,
  created_at timestamptz not null,
  primary key (owner_id, kind, id)
);
create index if not exists records_owner_kind_created_idx
  on public.records(owner_id, kind, created_at, id);

create table if not exists public.generation_keys (
  owner_id text not null references public.users(id) on delete cascade,
  key text not null,
  payload_hash text not null,
  job_id text not null,
  primary key (owner_id, key)
);

create table if not exists public.rate_limits (
  key text primary key,
  count integer not null,
  resets_at bigint not null
);

create table if not exists public.billing_customers (
  owner_id text primary key references public.users(id) on delete cascade,
  customer_id text not null unique,
  revision integer not null default 0,
  applied_revision integer not null default 0,
  checkout_key text,
  checkout_plan text,
  checkout_expires bigint
);

create table if not exists public.billing_events (
  id text primary key,
  processed_at timestamptz not null
);

create table if not exists public.account_tokens (
  token_hash text primary key,
  owner_id text not null references public.users(id) on delete cascade,
  purpose text not null,
  expires_at bigint not null,
  created_at bigint not null
);
create index if not exists account_tokens_owner_purpose_idx
  on public.account_tokens(owner_id, purpose);

-- Protect every application table. The NEXORA server performs authorization
-- before using the server-only secret key. No browser policy is granted here.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'schema_migrations', 'users', 'sessions', 'records', 'generation_keys',
    'rate_limits', 'billing_customers', 'billing_events', 'account_tokens'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end $$;

insert into public.schema_migrations(version)
values (1)
on conflict (version) do nothing;
