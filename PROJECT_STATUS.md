# NEXORA implementation status

Latest launch preparation (November 10, 2026): see [SEVEN_DAY_LAUNCH_PLAN.md](SEVEN_DAY_LAUNCH_PLAN.md) for the release verdict, implemented USD plans/Stripe allowances/account email, financial and tax scenarios, 90-test verification, and remaining operator requirements. The assessment below is historical.

Updated: November 5, 2026.

## Repository assessment before changes

- Next.js 16.3.6 App Router, React 19.2.4, TypeScript, Tailwind, Zustand, local rule-based feedback.
- Business/diagnosis/action/metric records only in browser localStorage.
- No authentication, server DB, payments, actual AI calls, email, or publishing integration.
- Korean UI with restaurant/cafe/lodging questions; unsupported industries could receive restaurant questions.
- Execution records increased diagnosis scores without measured business improvement.
- Reusable date/timezone helpers and Vitest coverage; no production database migration.

## Current implementation

- US-only English public pages, metadata, navigation, auth, workspace, forms, errors, and generated assets.
- A redesigned concern-led landing and anonymous /start experience show an initial investigation before signup. Optional real measurements can refine the direction without writing account records. Explicit, transactional account save preserves answers, prevents duplicate retries, and guards existing profile versions.
- The workspace starts with the next investigation and weekly actions. A persistent desktop sidebar and compact mobile menu replace the horizontal tool list. Assessment details expand on demand; action, draft-use, and measurement entry are separate views.
- /goals provides weekly execution management, /explore provides searchable guides, /metrics provides actual measurement charts, and /demo provides an explicitly fictional example before signup. Remaining old routes forward to relevant English workspace sections; no Korean page mode or language picker.
- One Next.js app, additive SQLite persistence, owner-scoped records/revisions, scrypt credentials, HttpOnly sessions, same-origin JSON mutations, rate limiting.
- Evidence-based deterministic assessments without activity rewards being included in business health.
- Five-step profile guidance with examples and optional unknowns; business type/stage questions, supporting-record prompts, contextual interpretations and action guidance. General questions cover other/not-sure businesses without a restaurant fallback or invented benchmarks.
- Owner-scoped weekly plans link a saved recommendation, calendar deadline/time zone, status, evaluation metric, notes, and optional exact asset versions. Goal completion changes activity only.
- Revenue, costs, counts, and valid conversion rates use saved evidence/results with visible periods, sources, and units; currencies/durations remain separate. No chart is invented for missing data.
- Problem-related execution guides retain context back to the original plan/assessment and link general primary references; no private business records appear in the public explorer.
- Actual Responses API adapter with strict schema/post-response validation, timeout, size limits, account usage limits, saved failures, idempotency payload binding, and token accounting when supplied.
- Zero automatic retries because unknown provider outcomes can otherwise incur duplicate charges.
- Version-bound approval and download; explicit usage recording; results become evidence for immutable reassessments.
- Legacy browser records remain local until explicit archive import, retaining KRW semantics and original text.

## Verification scope

Completed checks: ESLint, TypeScript, 71 unit/integration tests across 11 files, and a production build. Real Chromium checks cover English-only screens under a Korean browser locale, anonymous first direction before signup, answer persistence, explicit account save, optional real numbers without silent account writes, public example and guide search, guided profile/evidence/assessment persistence, zero-valued measurements and missing conversion, real-source charts, weekly completion without changing evidence, guide round trips, earlier goals after reassessment, nonmarketing action completion/results, returning login, redirects, reload, 390px mobile navigation, dark theme, and reduced motion. No browser runtime errors were reported in the final production smoke run. Provider fixtures do not call paid services. No live payment, advertisement, publication, customer message, production deployment, or irreversible migration is part of this work.

## Operational limits

- SQLite needs persistent, single-instance Node hosting; no hosted database service.
- No email verification or password recovery delivery; auth is local email/password.
- No image/video rendering, URL scraping, auto-publishing, payments/credit sales, or analytics connectors.
- US pricing, taxes, company/support details, policies, monitoring and backup operations require configuration before commercial launch.

See README for environment variables and recovery notes. No secret key or customer data is documented here.
See RESTORATION_REPORT.md for acceptance against the six requested restoration items. Checklist guidance does not establish industry expertise, customer value, causal business improvement, or willingness to pay.
See EXPERIENCE_REDESIGN.md for the first-use flow and design changes. Functional checks do not prove better retention or customer satisfaction.
