# NEXORA mobile repository workflow

The existing Next.js application remains at the repository root. The Expo iOS/Android project is kept under `apps/mobile`. This GitHub repository is the source-of-truth for both products. Use a feature branch and review changes; do not deploy a server migration or change production data merely by copying code.

The mobile preview/native build environment currently uses a separate managed checkout. It is **not** automatically synchronized with GitHub. At the start of work, check out the intended GitHub revision and copy it to the preview environment; after editing there, copy changes back to a review branch. The sync tool uses selected project roots, excludes common `.env`, key, local database, dependency, build-output and Git paths, and rejects several known credential patterns. No file filter or secret scanner is exhaustive: inspect the complete diff and run an appropriate secret scan before sharing. The tool overwrites matching destination files, so preserve and review changes on both sides first; it never deletes files.

```sh
# From the repository root; use the actual absolute preview project path.
node scripts/sync-mobile.mjs --to-preview /absolute/path/to/preview
node scripts/sync-mobile.mjs --check /absolute/path/to/preview

# After editing and validating in preview:
node scripts/sync-mobile.mjs --from-preview /absolute/path/to/preview
node scripts/sync-mobile.mjs --check /absolute/path/to/preview
```

If the check reports files present on only one side, review them individually; the tool never removes files. `--check` compares only its permitted inventory, not excluded files. Commit the intended mobile and backend changes together on the feature branch, and record the exact Git commit used to create a native build. Platform-specific checkpointing/build steps remain separate from a GitHub push. Never include service-role keys, AI credentials, database URLs or token material in mobile code, config, commits or public logs.

**Current release boundary:** The existing web production request path is still SQLite. PostgreSQL adapters, mobile token authentication, owner authorization and end-to-end workflows require verification before the application may be connected to real customer data. Store payment, live purchase links, store submissions and database cutover require separate release review. Existing web entitlement rules remain authoritative.
