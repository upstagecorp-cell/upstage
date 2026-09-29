# Launch Readiness

Last updated: 2026-09-29

This file tracks the concrete work needed before a worldwide production launch.

## Completed in this pass

- Updated Next.js and `eslint-config-next` to `16.3.6`.
- Resolved all currently reported npm dependency vulnerabilities.
- Removed production `unsafe-eval` and unused external origins from the CSP.
- Added versioned and validated Zustand persistence with migration support.
- Replaced page-local counters with collision-resistant IDs.
- Added browser-time-zone date handling while retaining UTC audit timestamps.
- Added recurrence-aware action recommendations.
- Fixed weekly goal deletion and date-scoped progress.
- Added financial, metric, and local upload validation.
- Clarified that selected evidence files are not uploaded without server storage.
- Added Vitest coverage for date boundaries, streaks, scoring, recurrence, finance parsing, and persisted-state validation.
- Limited search indexing to public routes and disabled indexing when the production URL is not configured.
- Hardened GitHub Actions with read-only permissions, type checks, and unit tests.

## Current verification status

- `npm.cmd run lint`: passing.
- `npm.cmd run typecheck`: passing.
- `npm.cmd run test:run`: 14 tests passing.
- `npm.cmd run build`: passing on Next.js `16.3.6`.
- `npm.cmd audit`: 0 vulnerabilities.

## Worldwide behavior status

- UTC timestamps are stored for chronological audit data.
- User-facing calendar dates, streaks, and weekly windows use the browser's IANA time zone.
- The time zone and browser locale at record creation are retained with new records.
- The current UI is Korean only.
- Locale-prefixed routing, `Accept-Language` negotiation, translation dictionaries, localized metadata, and a language switcher are not implemented yet.

## Still blocking a real worldwide paid launch

- Authentication and account recovery are not implemented.
- Server database persistence is not implemented.
- Supabase migrations, RLS policies, and private file storage are not implemented.
- Stripe Checkout, Billing, and webhook verification are not implemented.
- Legal pages need real company, jurisdiction, privacy, cookie, refund, and support details.
- End-to-end tests are not implemented.
- Error monitoring, backups, restore drills, incident response, and support operations are not connected.
- A stricter nonce- or hash-based CSP requires a deliberate rendering and caching decision.

## Production environment checklist

- Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS origin; indexing remains disabled without it.
- Configure the production database, Auth providers, RLS, backups, and key rotation.
- Configure private evidence storage with server-side type and size validation and signed URLs.
- Configure Stripe live products, prices, customer portal, and webhook endpoint.
- Configure Sentry or equivalent monitoring for client and server errors.
- Implement locale routes and translated legal/product content for each supported market.
- Run `npm.cmd run check` before every release.
