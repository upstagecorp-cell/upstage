# NEXORA

Current paid-launch preparation: [SEVEN_DAY_LAUNCH_PLAN.md](SEVEN_DAY_LAUNCH_PLAN.md) includes the launch verdict, $149/$299 plans, financial/tax sensitivity, actual code scope, and dated seven-day plan. Stripe subscriptions and account email integrations are implemented but require operator configuration and live verification; no production deployment or live payment was performed. Run `npm.cmd run launch:preflight` for a read-only configuration check.

November 10, 2026: the product now includes the visual landing and interactive walkthrough, review-focused returning workspace, optional approved-wording references, and resumable first-check steps. See [VISUAL_EXPERIENCE_IMPLEMENTATION.md](VISUAL_EXPERIENCE_IMPLEMENTATION.md) for actual screenshots, source references, verification, and remaining integrations.

NEXORA connects guided business understanding, assessment, marketing text drafts, human approval, weekly execution plans, measured performance, and reassessment. The product interface and generation language are American English for the US launch. Contextual investigation templates cover restaurants, cafes, lodging, physical retail, e-commerce, services, and creator businesses. Other businesses use general questions; no industry performance averages or success thresholds are assumed.

## Run locally

Requires **Node.js 24.14 or later** (the server uses built-in node:sqlite).

```powershell
npm.cmd ci
if (!(Test-Path -LiteralPath .env.local)) { Copy-Item -LiteralPath .env.example -Destination .env.local }
npm.cmd run dev
```

Open http://localhost:3000. Start at /start: choose a concern, business type, and stage to see a first investigation direction before signup. Add measured numbers only if useful. Answers stay in this tab’s sessionStorage until you explicitly save the check to an authenticated account. Registration alone does not upload those business answers. The fictional /demo and public /explore guides remain available.

After saving, /workspace opens on **My next move**, with the current direction and the week ahead. Detailed business settings and the full assessment remain available when needed. Authentication uses a server session cookie and scrypt-hashed passwords. Business records are scoped to the authenticated owner on every API operation.

To generate marketing drafts, connect server-only **OPENAI_API_KEY** and **OPENAI_MODEL** and an active, paid subscription through the configured Stripe integration. Choose an accessible model supporting the Responses API and structured outputs. Free accounts can use checks, plans, and existing work but cannot generate new text. There is no mock success or public grant endpoint. Follow [the billing/email runbook](reviews/2026-11-10/launch/OPERATIONS_RUNBOOK.md); isolated tests seed private fixtures without charging a provider.

## Connected workflow

The primary first-use path is **concern → business type → stage → first direction → optional measurements → account save → weekly action**. The steps below describe the connected workspace tools, not a mandatory eight-stage setup.

1. **Business Profile:** five guided steps with explanations and examples, business type and stage, industry-specific questions, ownership/team, offering, customers, market, goal, channels, tone, currency, time zone, optional URL. Unknown business details may be skipped. Tailored draft generation requires an offering, customer description, and sales channel in the saved assessment snapshot. URLs are references only, not fetched.
2. **Evidence:** measurements with inclusive reporting dates, unit, currency for money, and manually reported source. Unknown measurements remain absent; zero is preserved.
3. **Assessment:** the initial screen prioritizes a useful question and next action. Supporting facts, possible causes, alternatives, missing information, and industry questions can be expanded. Industry and stage change interpretation and investigation guidance; answers are self-reported context, not verified measurements. The overview, first-direction screen, and full report use the saved recommendation ordering. No synthetic business-health score or success probability.
4. **Marketing assets:** eligible actions request configurable hooks, ad copy, short-form video scripts, and CTAs through an actual provider call. Optional reference text is untrusted source material. No reference analysis is claimed when none was provided.
5. **Review:** edit into a new version, approve the exact version, copy or download approved text, explicitly record actual use. Downloads never count as publishing or sales. Regeneration retains older jobs and assets.
6. **Weekly plan (/goals):** turn a saved recommendation into a goal with a deadline, status, exact related asset versions, notes, and evaluation metric. Browse weeks, edit goals, and track activity completion separately from business performance. Guides retain the route back to the original assessment or plan. Completing a goal never creates an asset-use or outcome record.
7. **Results:** choose a business action, approved draft use, or measurement instead of seeing all forms at once. Action recording advances to measurement entry. “Just now” uses the actual save time; earlier times remain available. Record metrics, period, source, currency, advertising spend/currency, price changes, and notes. Results become linked evidence for a new assessment. Earlier assessments/profile snapshots remain unchanged.
8. **Performance (/metrics):** inspect saved measurements by period, unit, currency, and source. Different currencies/durations stay separate; conversion needs matching periods and a positive visitor denominator. An empty dataset produces no graph. Lines between compatible observations require confirmation of comparable definitions and populations; missing values are never filled in.

Text generation is the only AI-provider integration. Finished images/videos, automatic posting, ad spending, and analytics imports are unavailable. Stripe billing and Resend account email are implemented integrations awaiting real operator setup and live verification. USD plans are defined; the legal seller, final tax treatment, hosting, monitoring, and operational release conditions remain to be confirmed.

## Storage and compatibility

The server creates an additive schema migration in .data/nexora.sqlite (ignored by Git). SQLite WAL mode is enabled. Use persistent storage with a single Node.js application instance; ephemeral hosting or separate disks across instances will not preserve a consistent account database.

Existing startup-platform-store browser records are not deleted, rewritten, automatically uploaded, or converted to USD. The workspace offers explicit backup and import into a read-only legacy archive. Historic money stays KRW. Historic scores are not interpreted as validated health or mixed into new assessments. Raw source text stays intact while the interface stays English.

Fresh profiles propose United States, USD, en-US, and the browser IANA time zone. Each monetary record keeps its own currency. Added profile guidance fields are optional for old records. Weekly plans use owner-scoped records in the same database and preserve the assessment time zone for deadlines; no legacy record rewrite is needed.

Before a future migration, stop the app and back up the entire .data directory, including any WAL files, to a protected location. Restore that directory with the app stopped and use the matching app revision. Browser records can also be exported before explicit import. This change performs no production deletion or remote migration. Database backups contain private business data and password hashes.

## Validation

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
```

Vitest uses its native config loader to avoid Windows sandbox ancestor scans. Provider/payment/email fixtures make no live charges or deliveries and do not prove external account connectivity. Current verification: 90 tests in 14 files, TypeScript, Next.js 16.4.6 production build, and Chromium desktop/mobile workflow checks including pricing, disabled unconfigured checkout, billing status, recovery errors, and 320–1440px pricing layouts. Runtime dependency audit: zero known vulnerabilities at this check; development tooling has seven moderate findings. See [launch verification](reviews/2026-11-10/launch/VERIFICATION.md) for results and limits, [SEVEN_DAY_LAUNCH_PLAN.md](SEVEN_DAY_LAUNCH_PLAN.md) for current release conditions, and the older reports for earlier work.

Read current Next.js guides in node_modules/next/dist/docs/ before editing Next code, as AGENTS.md requires.
