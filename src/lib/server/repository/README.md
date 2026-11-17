# Server repository foundation

This is an **unwired**, server-side, asynchronous contract for owner-scoped records and user/session lookup. The SQLite adapter uses a supplied existing `DatabaseSync`; the PostgreSQL adapter accepts an already configured `pg` Pool/Client and defaults to `public`. Neither adapter creates a schema, opens or closes a connection, authenticates a request, or selects a backend. The caller must authenticate and authorize the owner before using an owner ID. A service-role connection bypasses RLS. Never send stored password hashes or token hashes to a client.

`saveRecord` serializes like the current SQLite implementation, and an upsert replaces only the payload, retaining the original creation time. Reads return parsed JSON; a missing record and a stored JSON `null` both return `null`, as in the current implementation. Session lookup takes a **token hash**, not a raw cookie, and active sessions require `expires_at > asOf`. UTC ISO timestamps are returned for users and sessions. Email matching is exact and does not normalize input.

## Ordering compatibility limitation

Both adapters sort by `created_at` ascending and then binary `id` order for equal creation timestamps. The existing `database.ts` sorts ties by SQLite `rowid` (insertion order), and the existing PostgreSQL schema/import does not preserve that rowid. Consequently, records that have the same creation timestamp **can appear in a different order** when this new contract is used, including on SQLite. Neither this contract nor the migration can reconstruct legacy insertion order in PostgreSQL. Do not switch existing request paths where tie ordering matters until a migration/order strategy is approved. Existing SQLite-generated timestamps are canonical UTC ISO strings; other timestamp formats may order differently between SQLite text and PostgreSQL `timestamptz`.

PostgreSQL `jsonb` cannot store some strings SQLite JSON can, such as U+0000 or unpaired Unicode surrogates. This foundation does not migrate or repair such preexisting payloads; audit data before migration. JSON serialization retains JavaScript's normal behavior, including rejecting cyclic values and BigInts.

## Tests

Run with Node >=24.14 and installed dependencies:

```sh
npm run test:run -- src/lib/server/repository
```

The shared suite always tests SQLite in memory. PostgreSQL is tested only when `NEXORA_REPOSITORY_TEST_POSTGRES_URL` is explicitly set to `postgresql://postgres@127.0.0.1:55432/nexora_test`, using an already provisioned **disposable isolated test instance**. Other values fail closed; there is no fallback to application secrets. The suite uses a single connection, temporary tables and `pg_temp`-qualified queries; no existing public tables are modified. Without that URL the PostgreSQL suite explicitly skips. The URL check cannot detect a tunnel or a reused instance: never point this port at real data, and use a separate network namespace and a newly initialized instance for tests.

This does not implement transaction composition, race-safe generation, usage/money accounting, billing/webhook atomicity, session creation/deletion, rate limits, rollout flags, data import, or request-path integration. In particular, the two adapters' passing primitive tests would not establish production migration readiness.
