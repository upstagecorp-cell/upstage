# Customer creative offer and automatic renewal · 2026-11-12

The offer now separates a small first purchase, a recurring campaign routine, and optional newly generated AI footage. The public site, estimate widget, terms draft, and workspace billing link use the same versioned catalog. Personal financial targets, tax scenarios, and founder cash-flow calculations are maintained outside this project; existing original records remain in place at the user's request.

| Offer | Price before tax | Planned delivery |
|---|---|---|
| Explore | Free | Existing business checks, planning, saved records, text walkthrough |
| First campaign | $19 once | 1 campaign, 4 image designs, 2 photo-based videos, 30-day validity |
| Focus | $79/month | 4 campaign kits, 40 image designs, 12 photo-based videos |
| Growth | $149/month | 8 campaign kits, 80 image designs, 24 photo-based videos |
| Optional motion | $15 for 1 scene / $59 for 5 | Each scene is 8 seconds; choose monthly recurring quantities or one-time packs |

Videos are edited MP4s up to 30 seconds; newly generated moving footage is purchased separately. The image and video totals are shared across campaign kits. Resizing one design does not create three designs. The quote widget selects the cheapest combination covering the requested scene count, discloses any extra purchased scenes, and separates the first-payment estimate from monthly renewal. It does not charge, reserve allowance, or call a provider.

The customer value proposition is consistent product context and branding across briefs, copy, images, and edits, with explicit version review and export. No fabricated testimonials, customer outcomes, time savings, or return-on-ad-spend claims were added. The current demo remains visibly a fictional text walkthrough; it is not evidence of media quality.

## Release status

Implemented: automatic monthly creative Checkout, optional monthly scene items, next-period quantity changes via subscription schedules, direct period-end cancellation, account one-time top-up Checkout, verified-payment grants, full-refund revocation, and current/pending quantities in Plan & billing. Initial subscription Checkout contains monthly items; one-time extras are purchased separately in the account afterward. Photo-based image composition, saved designs, exact-version approval, private PNG/JPG exports, a local image worker, and image usage reservations are now implemented (see LAUNCH_ACTIONS_2026-11-12.md). Exports require eligible creative rights and an available worker. Still pending: AI image and finished video delivery, full campaign/video/motion usage accounting, standalone First campaign Checkout, and verification against the operator’s real Stripe configuration. All creative purchases remain closed. Both `status: available` and delivery/billing readiness must be explicitly satisfied before the public preview gate can open; launch environment flags alone cannot open the current preview.

Existing text contracts keep their confirmed prices, package limits, billing portal, and entitlement behavior. The creative estimate cannot grant an old text plan or change an existing subscription. The launch preflight uses the same release-readiness requirements.

Customer reaction, repeat use, and pricing acceptance are to be learned after launch. This change does not add a prelaunch customer survey requirement or claim that demand has been established.

## Validation

- TypeScript and 110 unit tests passed, including minimum-price scene combinations, renewal separation, malformed quantities, preview closure, and retained text rights.
- Chrome passed 18 checks, including monthly auto-renewal totals, one-time separation, account configuration, and 320/390/768/1280px layouts, lowest-price motion selection, one-time pricing, no forced motion, disabled purchases, consistent home/terms copy, and no runtime exceptions. Screenshots are saved under the ignored `.qa/recurring-billing-v3/` directory.
- Production build passed. The launch preflight correctly continues to block the unfinished media offer and missing local operator configuration.
- Targeted ESLint has no errors; the BillingPanel refresh callback and effect dependencies are now explicit. No dependency versions were changed.

The customer catalog is `src/lib/marketing/creative-plans.json`; personal cost assumptions are not bundled with the site.

## Recurring billing contract

- Focus $79/month and Growth $149/month renew automatically until the customer cancels. Selected monthly scene packs are recurring subscription items on the same monthly invoice.
- Quantity changes retain the current paid phase, use `proration_behavior: none`, and start at the confirmed next billing date. The schedule uses `end_behavior: release`, so the selected subscription continues renewing after the scheduled phase; it is not automatically canceled.
- Zero recurring extras means the base subscription continues. A later quantity request replaces the prior scheduled selection. Caller-generated request IDs, persisted commands, Stripe idempotency, and an account lock prevent duplicate processing and conflicting concurrent changes.
- Cancellation releases a managed pending schedule and sets `cancel_at_period_end: true`, retaining current paid access. Existing text contracts and their portal remain separate.
- One-time account top-ups use `mode: payment`, leave recurring items unchanged, and grant usage only after current Stripe payment state is verified. Replayed events do not multiply grants or reset their 30-day expiry; full refunds revoke grants, including refund-before-grant ordering.
- Failed payments do not grant new usage. Automatic renewal is not a revenue or payment-success guarantee. No live payment, provider call, or deployment was performed.
- New creative Price IDs are separate from legacy text Price IDs; see `.env.example`. The webhook must receive subscription/invoice changes, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `charge.refunded`.

Stripe references: [subscription schedules](https://docs.stripe.com/billing/subscriptions/subscription-schedules), [next-period price changes](https://docs.stripe.com/billing/subscriptions/change-price).
