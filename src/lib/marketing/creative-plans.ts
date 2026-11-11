import catalog from './creative-plans.json'

// Public offer preview. Existing paid text entitlements live in billing/plans.ts.
// Release requires media delivery, a versioned billing catalog, and live verification.
export const CREATIVE_PLANS = catalog.plans
export const MAX_CREATIVE_VIDEO_SECONDS = catalog.maxVideoSeconds
export function creativeOfferIsPreview(): boolean { return catalog.status === 'preview' }
