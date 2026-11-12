# Local image files, worker, and recovery

This adds uploaded-photo ad layouts and private image exports. It does not implement AI image generation, AI motion, voice synthesis, or MP4 rendering. Prices, monthly allowances, add-on choices, renewal behavior, and release switches are unchanged. The image worker never calls a paid provider.

## Runtime

Use Node.js 24.14 or later and a single application instance with durable storage. `sharp` is now an explicit dependency pinned to the already installed/locked 0.35.5 version. There was no native-library upgrade.

- `NEXORA_DB_PATH`: existing absolute SQLite path on durable storage.
- `NEXORA_MEDIA_PATH`: optional absolute private directory; defaults to `media/` next to the database, or `.data/media` with the default database. It must stay outside `public/`. Do not put it in an ephemeral release directory.
- `NEXORA_WORKER_TOKEN`: a server-only operator-provided secret, at least 32 characters, shared by the local app and image worker. No production secret has been created or populated.
- `NEXORA_WORKER_ORIGIN`: loopback URL for the same local app, such as `http://127.0.0.1:3000`. The worker refuses external hosts and redirects.

Start the normal app, then start `npm run media:worker` as a separate process under the same service manager/environment. `npm run media:worker -- --once` processes at most one queued local image and exits. The worker records a heartbeat. The interface displays export availability and does not claim a queued export has completed.

## User flow

Open `/workspace#media`: upload a product photo or logo, save a design, review the exact saved version, approve, and request PNG/JPG at 1:1, 4:5, or 9:16. Export uses the approved saved snapshot. A new edit creates an unapproved version and retains earlier approvals. This workflow does not publish ads or create performance records.

Uploads accept actual still PNG/JPEG/WebP bytes, at most 8 MB, 16 megapixels, and 6000 pixels per side. The server re-encodes them as PNG and strips input metadata. Request-body limits and owner/global rate limits apply. Filenames and supplied URLs never become filesystem paths; uploads and downloads require authentication and owner matching. Private objects have immutable random names and checksums.

New designs reserve one image in the confirmed creative billing period, using the unchanged catalog limit. Free and legacy text accounts do not gain creative allowances. Multiple sizes or manual edits of a previously rendered design do not use another design allowance. No campaign, video, or AI-motion usage is implied by this image ledger. Those pipelines remain pending.

Queued requests have persistent IDs and duplicate-request protection. A worker restart can reconcile a saved result or mark a stale local job interrupted; it does not retry any paid generation. Confirmed local failures release the reservation when no sibling export remains pending. The app must be kept running for the loopback worker.

## Backup and isolated restore

Do not copy only a live SQLite main file while ignoring WAL. The new backup command uses the SQLite online backup API, opening the source read-only. It copies exactly the immutable private objects referenced by that snapshot and verifies their checksums.

```powershell
npm.cmd run ops:backup -- --database "<absolute database path>" --media "<absolute private media directory>" --destination "<new private backup directory>"
npm.cmd run ops:verify-backup -- --backup "<backup directory>"
npm.cmd run ops:verify-backup -- --backup "<backup directory>" --restore-to "<new isolated restore directory>"
```

Existing destinations are refused. Restore writes `nexora.sqlite` and `media/` into a new directory; it never replaces the running app database. Check restored accounts, records, approved versions, and files with the matching app revision before the operator chooses a production cutover. Keep the original data and prior release. This work did not perform a production restore or rollback.

Backups contain private records and password hashes. Their directory must be protected and stored outside the public website and repository. The operator still needs to configure backup scheduling, an independent/off-site copy, retention, and actual storage permissions. No remote backup account has been accessed.

## Monitoring

- `GET /api/health`: public liveness only; exposes no accounts, secrets, filesystem paths, or billing state.
- `GET /api/internal/readiness`: requires the worker Bearer token; checks database access, private-file read/write access, and a recent image-worker heartbeat. Returns 503 when not ready.
- Worker events report local processing or connection failures without printing the token or customer content.

The operator still needs a real monitor, alert destination, incident owner, and live provider/Stripe/email verification. A local health check does not certify those services. Never switch paid launch or delivery readiness on merely because these local checks pass.
