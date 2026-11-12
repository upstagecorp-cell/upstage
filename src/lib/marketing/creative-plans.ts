import catalog from './creative-plans.json'

// Public offer preview. Existing paid text entitlements live in billing/plans.ts.
// Release requires media delivery, a versioned billing catalog, and live verification.
export const CREATIVE_PLANS = catalog.plans
export const MAX_CREATIVE_VIDEO_SECONDS = catalog.maxVideoSeconds
export const CREATIVE_CATALOG_VERSION = catalog.version
export const FIRST_CAMPAIGN = catalog.entryOffer
export const MOTION_PACKS = catalog.motionPacks
export const MOTION_SCENE_SECONDS = catalog.motionSceneSeconds
export type CreativeOfferId = 'first-campaign' | 'focus' | 'growth'
export type MotionBilling = 'monthly' | 'one_time'

// Fail closed for unknown release states as well as unfinished delivery/billing.
// Existing text entitlements remain in billing/plans.ts; this catalog cannot grant them.
export function creativeOfferIsPreview(): boolean {
  return String(catalog.status) !== 'available' ||
    !catalog.releaseReadiness.mediaDelivery || !catalog.releaseReadiness.versionedBilling
}

/** Public estimate only. No payment, entitlement, reservation, or provider call. */
export function quoteCreativeOffer(offerId: CreativeOfferId, requestedScenes: number, motionBilling: MotionBilling = 'one_time') {
  if (!Number.isSafeInteger(requestedScenes) || requestedScenes < 0 || requestedScenes > 50) {
    throw new RangeError('Choose between 0 and 50 whole AI scenes.')
  }
  const offer = offerId === FIRST_CAMPAIGN.id ? FIRST_CAMPAIGN : CREATIVE_PLANS.find(plan => plan.id === offerId)
  if (!offer) throw new RangeError('Choose a listed creative offer.')
  if (!['monthly', 'one_time'].includes(motionBilling) || (offerId === 'first-campaign' && motionBilling === 'monthly')) {
    throw new RangeError('Monthly motion requires a monthly plan.')
  }
  const single = MOTION_PACKS.find(pack => pack.scenes === 1)!
  const bundle = MOTION_PACKS.find(pack => pack.scenes === 5)!
  const singleUsd = motionBilling === 'monthly' ? single.monthlyUsd : single.oneTimeUsd
  const bundleUsd = motionBilling === 'monthly' ? bundle.monthlyUsd : bundle.oneTimeUsd
  let choice = { singles: requestedScenes, bundles: 0, usd: requestedScenes * singleUsd, scenes: requestedScenes }
  for (let bundles = 1; bundles <= Math.ceil(requestedScenes / bundle.scenes); bundles++) {
    const singles = Math.max(0, requestedScenes - bundles * bundle.scenes)
    const usd = bundles * bundleUsd + singles * singleUsd
    const scenes = bundles * bundle.scenes + singles
    if (usd < choice.usd || (usd === choice.usd && scenes < choice.scenes)) choice = { singles, bundles, usd, scenes }
  }
  const baseUsd = 'monthlyUsd' in offer ? offer.monthlyUsd : offer.oneTimeUsd
  return {
    catalogVersion: CREATIVE_CATALOG_VERSION, offerId, baseUsd,
    recurring: 'monthlyUsd' in offer, requestedScenes, purchasedScenes: choice.scenes,
    purchasedSeconds: choice.scenes * MOTION_SCENE_SECONDS,
    motionUsd: choice.usd, totalUsd: baseUsd + choice.usd, motionBilling,
    renewalUsd: 'monthlyUsd' in offer ? baseUsd + (motionBilling === 'monthly' ? choice.usd : 0) : 0,
    items: [
      ...(choice.singles ? [{ packId: single.id, quantity: choice.singles }] : []),
      ...(choice.bundles ? [{ packId: bundle.id, quantity: choice.bundles }] : []),
    ],
  }
}
