# Focused online-shop workflow

The first focused flow helps a physical-goods online shop distinguish a measurement gap, product-selection concern, checkout obstacle, shipping-cost surprise, or contribution problem. It asks the next relevant question and finishes a worksheet or specific revision before planning a review. The broader assessment and marketing tools remain available.

## Try it

Use Node.js 24.14 or later, run `npm ci`, then `npm run dev` and open `http://localhost:3000/focus-demo`. The fictional example needs no account, makes no provider calls, sends no product events, and resets on reload. It includes a separate fictional completed-review preview.

For a saved case, create an account, save an **E-commerce** Business Profile, and open **Your next move** (`/workspace#focus`). Select one product, channel, source, and inclusive reporting period. Record unique people at each funnel step. Leave unknown counts blank. Confirm matching definitions and populations only when the counts form the same nested funnel.

1. The next question narrows shipping timing, payment errors, product selection, tracking, acquisition, or costs. Choosing an unknown answer can lead to a measurement task instead of an invented cause.
2. The workbench can build a draft from known business details. Review the actual revision before marking it complete. Shipping notices use a recorded charge; no delivery-time promise is invented.
3. The cost worksheet needs every variable cost, including confirmed zeros, before showing order contribution. It calculates with currency minor units and recalculates payment fees for the free-shipping scenario. Contribution is not profit: taxes, returns, discounts, fixed overhead, and customer acquisition costs are outside this worksheet.
4. Finish a concrete revision or worksheet. Download the cost CSV or saved experiment Markdown. The Markdown retains the diagnostic rationale, baseline, sources, answers, decision rule, guardrail, and review date.
5. Save a review date and experiment criteria. The baseline, costs, and criteria become immutable. This records a plan, not deployment or actual use. Follow-up observations must start after the baseline and on or after the plan-start date.
6. Return to the case to see the saved change, review date, and next action. Matching periods and confirmed definitions allow a descriptive checkout-completion comparison. Small counts and concurrent changes remain visible. A completed review is preserved; create a new case for the next experiment.

## Storage and API

Uses the existing owner-scoped SQLite `records` table with new `investigation`, `product_event`, and `focused_feedback` kinds. No production schema migration or existing record rewrite is required. Each case stores its own immutable profile snapshot and revision. Updates from a stale tab return 409; the editor retains its original revision and offers an explicit reload rather than overwriting another tab.

- `POST /api/investigations`, `PUT /api/investigations/:id`: `{input, intent, revision?}`; account workspace returned.
- `GET /api/product-events`: current account's bounded event and feedback history.
- `POST /api/product-events`: only `flow_opened` and `return_visit` are client-reportable. The server records successful completion and changed follow-up answers.
- `POST /api/feedback`: usefulness rating and optional explanation tied to an owned case.

Authentication, same-origin JSON checks, rate limits, owner lookups, request limits, and generic error handling reuse the existing server. Server events are deduplicated. A return event represents a later-day revisit; it is not subscription retention. Plan saved is not an actual-use event. The demo contributes none of these records.

## Product validation still needed

Automated tests establish software behavior, not customer value. Recruit 5–10 owners of physical-goods online shops with existing sales and access to funnel records for an initial exploratory study. Agree on the task and evaluation criteria before observing outcomes.

Ask each owner to use one real product and complete a direction plus usable work product without coaching. Observe where they hesitate, whether the follow-up changes the selected task, whether they can explain the reason in their own words, completion time including data gathering, and whether the output is usable without substantial correction. Record assistance separately from independent completion. Collect the in-product usefulness rating and ask what the diagnosis missed.

Invite owners back on their actual review date. Record later-day return, actual use of the change (interview-confirmed; plan save alone does not count), whether they can recover the prior context, and whether they make a next decision. Measure willingness to pay separately; this flow has no billing integration. Use the current-account product feedback export (up to 500 recent events and feedback entries) and qualitative notes to identify drop-off and invalid recommendations; do not interpret this small sample as a causal sales effect or a population retention estimate.

## Verification limits

Unit, route-integration, currency, revision, and server-rendered component tests cover the new flow; run the repository's complete `npm run check` before merging. Browser interaction and actual-user validation remain separate work. In the current managed environment the required Sites browser-control tool is unavailable, so browser interaction/screenshots were not claimed. The existing browser smoke script has been adjusted for the new profile-to-focused-flow navigation and should be run in a suitable browser environment.

The app still requires persistent single-instance Node hosting with its existing SQLite database. No production deployment, paid provider call, payment, advertisement, or customer-facing publication is part of this source change.
