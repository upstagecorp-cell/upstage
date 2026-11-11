# US launch readiness

Current execution plan (2026-11-11): [Launch checklist PDF](NEXORA_LAUNCH_CHECKLIST_2026-11-11.pdf). Customer feedback, price acceptance, and retention learning will happen after launch. Prelaunch work covers promised media delivery, accounts, billing, storage, deployment, and minimum operational checks. The November 10 text-plan details below are historical; the current creative offer is in [AD_CREATIVE_PRICING_PLAN.md](AD_CREATIVE_PRICING_PLAN.md).

Updated: November 10, 2026.

The current release candidate includes the visual walkthrough, resumable first check, review-focused workspace, USD $149/$299 monthly plan definitions, server-enforced generation allowances, Stripe-hosted Checkout/portal/webhook integration, and Resend-based verification/recovery integration. Billing and email require actual operator accounts and live validation. New paid purchases remain disabled without required configuration and launch attestations. See [SEVEN_DAY_LAUNCH_PLAN.md](SEVEN_DAY_LAUNCH_PLAN.md) and its operations runbook for the current scope, tax scenarios, and release conditions; the earlier visual report documents the preceding stage.

The local app connects guided English business profiles, contextual assessments, marketing text generation, approval, weekly execution planning, actual-use records, measured charts, results, and reassessment. Public guides and a labeled fictional example are available before signup. This is not a production deployment or commercial launch approval.

The anonymous /start flow now provides a first investigation direction before signup. Business answers remain in tab-scoped storage until explicit account save; account creation alone does not upload them. Existing profiles require a version-matched confirmation before applying a check. Review EXPERIENCE_REDESIGN.md for the updated journey.

## Required operator configuration

- Node.js 24.14+ and protected persistent NEXORA_DB_PATH on one application instance.
- HTTPS and canonical APP_ORIGIN; configure trusted reverse-proxy forwarding deliberately. Production session cookies are Secure.
- Server-only OPENAI_API_KEY and accessible structured-output-capable OPENAI_MODEL. Review provider budget and usage limits. Fixture tests incur no live provider charge.
- Configure Resend and a verified sender, then test actual account verification and password recovery. Recovery uses expiring, single-use hashed tokens and revokes existing sessions.
- Configure actual Stripe seller, monthly USD prices, Tax, dedicated portal, and signed webhooks. Validate payments, failures, renewals, cancellation, refunds, and account separation. Planned prices do not prove customer willingness to pay.
- Fill the legal seller identity, address, support contact, review draft terms/privacy/refunds, and confirm US/Korean tax treatment for the actual entity and founder.
- Protect database backups and rehearse restoration with the app stopped. Set retention/access policies for business records.
- Configure monitoring and incident response; local provider fixtures do not prove live integration success.

## Unavailable integrations

Finished image/video generation, URL scraping, auto-posting, ad-account spending, and analytics imports are unavailable. Payments and account email are implemented integrations pending external setup and validation, not live connected services. Automatic refunds, billing disputes, team seats, and multiple business workspaces are not implemented. Generated scripts are text. Download is never recorded as publishing or revenue.

## Data safety

- Fresh profiles: United States / USD / en-US, browser IANA time zone; settings are independent.
- Historic browser records remain unchanged. Archive import is explicit and money remains KRW.
- Evidence/results store period, unit, source, currency. Different currencies or periods are not directly compared or summed.
- Preserve profile snapshots, assessments, asset versions, version-bound approvals, linked outcomes.
- Weekly-plan status is self-reported activity. It does not improve a business score, record asset use, or create a measured result. Deadlines keep their saved assessment time zone.
- Business-type templates provide context and records to investigate, without unverified US industry benchmarks. Validate usefulness with actual businesses before making performance claims.
- The fictional /demo dataset stays separate from account data; signup never imports sample results.
- API record lookup always includes the authenticated owner.

No production deployment, outbound customer message, public posting, paid advertising, or production deletion is part of these local changes.
