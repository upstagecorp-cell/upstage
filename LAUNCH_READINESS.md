# Launch Readiness

Last updated: 2026-06-29

This file tracks the concrete work needed before a worldwide production launch.

## Completed in this pass

- Updated Next.js from `16.2.4` to a patched `16.2.9` line.
- Added baseline security headers in `next.config.ts`.
- Added `robots.ts` and `sitemap.ts` for production indexing.
- Added `.env.example` for production app URL, Supabase, Stripe, and monitoring secrets.
- Removed the current lint warning from the question data.
- Added `npm run check` and `npm run audit:high` release verification scripts.
- Added GitHub Actions CI for install, lint, build, and high-severity audit checks.

## Current verification status

- `npm.cmd run lint`: passing.
- `npm.cmd run build`: passing.
- `npm.cmd audit --audit-level=high`: passing after the Next.js patch.
- `npm.cmd audit`: still reports 2 moderate findings from `next` bundling `postcss@8.4.31`.

The latest stable `next` version available from npm on 2026-06-29 is `16.2.9`. An attempted npm override for Next's nested `postcss` made the install tree invalid, so it was not kept. Do not run `npm audit fix --force` blindly here; npm currently proposes a breaking downgrade path.

## Still blocking a real worldwide paid launch

- Auth is not implemented.
- Server database persistence is not implemented.
- Supabase RLS policies and migrations are not implemented.
- Stripe Checkout/Billing and webhooks are not implemented.
- Legal pages need real company, jurisdiction, support, refund, and privacy details.
- Automated unit and E2E tests are not implemented.
- Error monitoring is not connected.
- Backup, restore, incident response, and support processes are not operational.

## Production environment checklist

- Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain.
- Configure production Supabase project and rotate service role keys outside source control.
- Configure Stripe live mode products, prices, customer portal, and webhook endpoint.
- Configure Sentry or equivalent monitoring for client and server errors.
- Verify security headers with the deployed domain.
- Run `npm.cmd run lint`, `npm.cmd run build`, and `npm.cmd audit --audit-level=high` before every release.
- Prefer `npm.cmd run check` locally and in CI once production network access is available.
- Complete privacy policy, terms, cookie policy, and refund policy review with legal counsel.
