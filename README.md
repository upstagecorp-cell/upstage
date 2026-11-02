# NEXORA

NEXORA connects guided business understanding, assessment, marketing text drafts, human approval, weekly execution plans, measured performance, and reassessment. The product interface and generation language are American English for the US launch. Contextual investigation templates cover restaurants, cafes, lodging, physical retail, e-commerce, services, and creator businesses. Other businesses use general questions; no industry performance averages or success thresholds are assumed.

## Run locally

Requires **Node.js 24.14 or later** (the server uses built-in node:sqlite).

```powershell
npm.cmd ci
if (!(Test-Path -LiteralPath .env.local)) { Copy-Item -LiteralPath .env.example -Destination .env.local }
npm.cmd run dev
```

Open http://localhost:3000. Explore the explicitly fictional example at /demo and the public guides at /explore before signup. Create an account, save a Business Profile with step-by-step help, optionally add evidence, and run an assessment. No external account is needed for these steps. Authentication uses a server session cookie and scrypt-hashed passwords. Business records are scoped to the authenticated owner on every API operation.

To generate marketing drafts, set server-only **OPENAI_API_KEY** and **OPENAI_MODEL** in .env.local and restart the server. Choose an accessible model supporting the Responses API and structured outputs. No model or price is assumed. Without these settings, generation reports an explicit configuration error, never a mock success.

## Connected workflow

1. **Business Profile:** five guided steps with explanations and examples, business type and stage, industry-specific questions, ownership/team, offering, customers, market, goal, channels, tone, currency, time zone, optional URL. Unknown business details may be skipped. Tailored draft generation requires an offering, customer description, and sales channel in the saved assessment snapshot. URLs are references only, not fetched.
2. **Evidence:** measurements with inclusive reporting dates, unit, currency for money, and manually reported source. Unknown measurements remain absent; zero is preserved.
3. **Assessment:** deterministic calculations separate observed facts, opportunities, possible causes, alternatives, missing information, recommended actions, and evaluation metrics. Industry and stage change interpretation and investigation guidance; answers are self-reported context, not verified measurements. No synthetic business-health score or success probability.
4. **Marketing assets:** eligible actions request configurable hooks, ad copy, short-form video scripts, and CTAs through an actual provider call. Optional reference text is untrusted source material. No reference analysis is claimed when none was provided.
5. **Review:** edit into a new version, approve the exact version, copy or download approved text, explicitly record actual use. Downloads never count as publishing or sales. Regeneration retains older jobs and assets.
6. **Weekly plan (/goals):** turn a saved recommendation into a goal with a deadline, status, exact related asset versions, notes, and evaluation metric. Browse weeks, edit goals, and track activity completion separately from business performance. Guides retain the route back to the original assessment or plan. Completing a goal never creates an asset-use or outcome record.
7. **Results:** record metrics, period, source, currency, advertising spend/currency, price changes, and notes. Results become linked evidence for a new assessment. Earlier assessments/profile snapshots remain unchanged.
8. **Performance (/metrics):** inspect saved measurements by period, unit, currency, and source. Different currencies/durations stay separate; conversion needs matching periods and a positive visitor denominator. An empty dataset produces no graph. Lines between compatible observations require confirmation of comparable definitions and populations; missing values are never filled in.

Text generation is the only AI-provider integration. Finished images/videos, automatic posting, advertising budgets, payments, email delivery, and analytics connectors are unavailable. US sales pricing and operational/legal conditions remain unconfigured.

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

Vitest uses its native config loader to avoid Windows sandbox ancestor scans. Provider fixtures simulate responses without charges; they are not proof that a live provider account is connected. Current verification: 63 tests across 10 files, type checking, lint, production build, and real Chromium desktop/mobile workflow checks. See RESTORATION_REPORT.md for the restoration acceptance criteria, PROJECT_STATUS.md for scope, and LAUNCH_READINESS.md for operations.

Read current Next.js guides in node_modules/next/dist/docs/ before editing Next code, as AGENTS.md requires.
