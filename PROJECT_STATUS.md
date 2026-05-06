# UpStage SaaS Project Status

Last checked: 2026-05-06
Environment checked: Windows PowerShell, Node.js v24.14.0, npm v11.9.0

## 1. Current Summary

This project is a Next.js App Router SaaS-style MVP for startup/business readiness diagnosis and action tracking.

Current status:

- The project installs successfully from `package-lock.json`.
- `next` is available through local `node_modules`.
- `npm.cmd run dev` is configured to use webpack dev mode for Windows stability.
- `npm.cmd run build` passes.
- `npm.cmd run lint` passes with warnings only.
- The main product workflow is implemented locally with Zustand persistence.
- There is no active Supabase SDK or environment-variable integration in the current source tree.

Recommended local startup command on Windows:

```powershell
npm.cmd ci
npm.cmd run dev
```

Then open:

```text
http://localhost:3000
```

## 2. Stack And Dependencies

Core stack:

- Next.js `16.2.4`
- React `19.2.4`
- React DOM `19.2.4`
- TypeScript `5.9.3`
- Tailwind CSS `4`
- Zustand `5.0.12`
- Recharts `3.8.1`
- Framer Motion `12.38.0`
- Lucide React `1.14.0`
- next-themes `0.4.6`

Important scripts:

```json
{
  "dev": "next dev --webpack",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

Why `dev` uses webpack:

- Next.js 16 uses Turbopack by default.
- On this Windows machine, Turbopack initially inferred the workspace root as `C:\Users\Jongone` because another lockfile exists above the project.
- Dev mode is pinned to webpack to avoid Turbopack-specific local conflicts while developing.

## 3. Windows Local Environment Fixes Applied

These changes were made to make the project portable from Verdent/remote development to local Windows development.

### `package.json`

Changed:

```json
"dev": "next dev --webpack"
```

Reason:

- Avoid Turbopack dev-mode conflicts on Windows.
- Make `npm.cmd run dev` predictable across local PCs.

### `next.config.ts`

Added:

```ts
turbopack: {
  root: process.cwd(),
}
```

Reason:

- Prevent Next/Turbopack from selecting an upper directory as the workspace root.
- Avoid permission errors when Next tries to scan `C:\Users\Jongone`.

### `src/app/layout.tsx` and `src/app/globals.css`

Removed `next/font/google` dependency and added system font fallbacks.

Reason:

- Build failed when Google Fonts could not be fetched.
- System fonts make local/offline development more reliable.

### `.gitignore`

Added:

```gitignore
dev-server*.log
.npm-cache/
```

Reason:

- Local debug logs and temporary npm cache should not be committed.

## 4. Verified Commands

### Dependency install

Status: passed

```powershell
npm.cmd ci --cache .\.npm-cache
```

Installed packages from the lockfile successfully.

### Dependency state

Status: passed

```powershell
npm.cmd ls next react react-dom typescript --depth=0
```

Verified:

- `next@16.2.4`
- `react@19.2.4`
- `react-dom@19.2.4`
- `typescript@5.9.3`

### Lockfile consistency

Status: passed

```powershell
npm.cmd install --package-lock-only --ignore-scripts --cache .\.npm-cache
```

Result:

- Lockfile is consistent with `package.json`.

### Lint

Status: passed with warnings

```powershell
npm.cmd run lint
```

Current warnings:

- `src/app/action/page.tsx`: one `<img>` warning.
- `src/app/history/page.tsx`: two `<img>` warnings.
- `src/lib/ai-feedback.ts`: five unused variable warnings.

No lint errors.

### Production build

Status: passed

```powershell
npm.cmd run build
```

Generated static routes:

- `/`
- `/_not-found`
- `/action`
- `/dashboard`
- `/diagnosis`
- `/diagnosis/result`
- `/explore`
- `/goals`
- `/history`
- `/metrics`
- `/onboarding`
- `/pricing`

Build note:

- Recharts printed a chart-size warning during static generation:
  - `The width(-1) and height(-1) of chart should be greater than 0`
- The build still completed successfully.

### Localhost check

Previously verified:

```text
http://localhost:3000 -> 200 OK
```

At the time of this document update, the dev server was not kept running. Start it again with:

```powershell
npm.cmd run dev
```

## 5. Implemented Product Flow

### Landing

File:

- `src/app/page.tsx`

Implemented:

- Main landing page.
- CTA links to onboarding, dashboard, and pricing.
- Uses public logo/image assets.

### Onboarding

File:

- `src/app/onboarding/page.tsx`

Implemented:

- Industry selection.
- Sub-industry selection when applicable.
- Stage selection.
- Saves selected context into Zustand store.
- Routes user into diagnosis.

### Diagnosis

Files:

- `src/app/diagnosis/page.tsx`
- `src/data/questions.ts`
- `src/lib/scoring.ts`

Implemented:

- Context-aware question selection.
- Question answering flow.
- Score calculation by readiness area.
- Diagnosis completion state.
- Redirect protection when onboarding data is missing.

Diagnosis areas:

- Customer understanding
- Problem validation
- Product competitiveness
- Acquisition structure
- Revenue structure
- Operational sustainability
- Growth potential

### Diagnosis Result

Files:

- `src/app/diagnosis/result/page.tsx`
- `src/lib/ai-feedback.ts`

Implemented:

- Score summary.
- Area-level diagnosis.
- Rule-based feedback generation.
- Route into dashboard.

Note:

- Feedback is local/rule-based, not connected to an external AI API.

### Dashboard

File:

- `src/app/dashboard/page.tsx`

Implemented:

- Total readiness overview.
- Area cards.
- Modal detail views.
- Streak/level style status indicators.
- Stage unlock check through Zustand store.

### Action System

Files:

- `src/app/action/page.tsx`
- `src/data/actions.ts`
- `src/lib/actions.ts`
- `src/lib/scoring.ts`

Implemented:

- Action recommendation engine.
- Context-aware prioritization by score, stage, industry, sub-industry, metric signals, prerequisites, urgency, impact, and difficulty.
- Action completion/partial/skipped records.
- Evidence quality handling.
- Score gain application.
- Local feedback modal after action recording.

Current action pool:

- Customer actions
- Validation actions
- Product actions
- Acquisition actions
- Revenue actions
- Operation actions
- Growth actions

### History

File:

- `src/app/history/page.tsx`

Implemented:

- Score history visualization.
- Action records grouped by date.
- Sample history fallback before real data exists.
- Action status counts.
- Evidence display support.

### Goals

File:

- `src/app/goals/page.tsx`

Implemented:

- Weekly goal creation.
- Target area selection.
- Goal progress calculation.
- Weekly insights generated from local action and score history.
- Monthly report state exists in store.

### Metrics

File:

- `src/app/metrics/page.tsx`

Implemented:

- Business metric entry form.
- Local metric history.
- Recharts line chart visualization.
- Metric entries can nudge scores when diagnosis is complete.

Tracked metric fields include:

- Revenue
- Customers
- Visitors
- Reservations
- Conversion rate
- Reviews
- Return visitors
- Inquiries

### Explore

Files:

- `src/app/explore/page.tsx`
- `src/data/strategies.ts`

Implemented:

- Area-sorted strategy exploration.
- Strategy tab.
- Resource tab.
- Sample/fallback score display when diagnosis is not complete.

### Pricing

File:

- `src/app/pricing/page.tsx`

Implemented:

- Pricing plan UI.
- Monthly/annual toggle.
- Feature comparison section.
- FAQ accordion.

Not implemented:

- Real payment integration.
- Stripe Checkout.
- Subscription backend.
- Auth-gated plan management.

## 6. State Management

File:

- `src/lib/store.ts`

State library:

- Zustand
- Zustand persist middleware
- Browser `localStorage`

Persisted store key:

```text
startup-platform-store
```

Persisted data includes:

- Selected industry/stage/sub-industry
- Diagnosis answers
- Scores
- Diagnosis completion flag
- Today action IDs
- Action records
- Score history
- Weekly goal
- Business metrics
- Streak
- Loop phase
- Monthly reports

Important limitation:

- This is currently single-browser local state only.
- No server persistence is implemented.
- Data will not sync between PCs or browsers.

## 7. Data Model

File:

- `src/data/types.ts`

Main domain types:

- `IndustryId`
- `StageId`
- `AreaId`
- `SubIndustryId`
- `Question`
- `ActionItem`
- `ActionRecord`
- `ScoreSnapshot`
- `WeeklyGoal`
- `BusinessMetricEntry`
- `MonthlyReport`
- `StageUnlockStatus`

## 8. Supabase Status

Current source status:

- No `@supabase/supabase-js` dependency is installed.
- No `NEXT_PUBLIC_SUPABASE_URL` usage was found.
- No Supabase client file was found.
- No `.env.local` template currently exists.

Implication:

- The product currently behaves as a local-only MVP.
- If Supabase is required, the next implementation phase should add:
  - Supabase dependency
  - Supabase client module
  - `.env.example`
  - Auth/session handling
  - Database schema
  - Server actions or route handlers for persistence

## 9. Known Risks And Issues

### 1. Korean text encoding is corrupted in several source files

Observed in:

- `src/data/constants.ts`
- `src/lib/store.ts`
- `src/lib/scoring.ts`
- `src/lib/ai-feedback.ts`
- Parts of other data/UI files may also be affected.

Impact:

- Some UI labels, descriptions, feedback messages, and report messages may render as unreadable text.
- This is currently the highest-priority product quality issue.

Recommended next step:

- Restore Korean copy from the original Verdent source or rewrite affected copy in UTF-8.
- After restoring text, run lint/build again.

### 2. Lint warnings remain

Current warnings:

- `<img>` usage in action/history pages should be migrated to `next/image` or intentionally suppressed.
- Unused variables in `src/lib/ai-feedback.ts` should be removed or wired into the feedback logic.

Impact:

- Not blocking build.
- Should be cleaned before production polish.

### 3. Recharts static generation warning

Build warning:

```text
The width(-1) and height(-1) of chart should be greater than 0
```

Impact:

- Build succeeds.
- Some chart containers may need explicit min width/height or SSR-safe rendering improvements.

Recommended next step:

- Audit `ResponsiveContainer` usage in `history` and `metrics`.
- Ensure chart parents have stable dimensions.

### 4. No backend persistence

Current behavior:

- User progress is stored in local browser storage only.

Impact:

- Data disappears if local storage is cleared.
- Data does not follow the user across devices.
- No team/admin analytics possible yet.

Recommended next step:

- Implement Supabase auth and tables for profiles, diagnoses, actions, metrics, and goals.

### 5. Pricing page is UI-only

Current behavior:

- Pricing page shows plans and CTAs.
- No payment flow is connected.

Recommended next step:

- Add Stripe Checkout or another payment flow when monetization is ready.

### 6. Repository metadata may need confirmation

In this working directory, the active tool environment did not expose a `.git` directory during checks.

Recommended next step:

- In your real VSCode terminal, verify:

```powershell
git status
git remote -v
```

Then commit only source/config/docs changes, not generated folders.

## 10. What Should Be Committed

Commit these files if the changes look correct:

- `package.json`
- `package-lock.json`
- `next.config.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `.gitignore`
- `PROJECT_STATUS.md`

Do not commit:

- `node_modules/`
- `.next/`
- `.npm-cache/`
- `dev-server*.log`

## 11. Fresh PC Setup Guide

On another Windows PC:

```powershell
git clone <repository-url>
cd upstage-main
node -v
npm.cmd -v
npm.cmd ci
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

Requirements:

- Node.js `20.9.0` or newer.
- npm available through `npm.cmd` on PowerShell.
- If PowerShell blocks `npm`, use `npm.cmd` instead of `npm`.

## 12. Recommended Next Work Order

1. Restore corrupted Korean text encoding.
2. Add `.env.example` if Supabase or external services will be used.
3. Decide whether the MVP remains local-only or moves to Supabase persistence.
4. Fix lint warnings.
5. Fix Recharts container warning.
6. Add basic tests for scoring, action recommendation, and store transitions.
7. Replace placeholder/sample states with real empty states.
8. Connect pricing page to a real payment flow only after auth and persistence are ready.

## 13. Current Overall Readiness

Development readiness:

- Good for local MVP development.

Build readiness:

- Build passes.

Production readiness:

- Not production-ready yet.

Primary blockers for production:

- Corrupted Korean copy.
- No backend persistence/auth.
- No real payment integration.
- Remaining lint/chart warnings.
- No automated tests.
