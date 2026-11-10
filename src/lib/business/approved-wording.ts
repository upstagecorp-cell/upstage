import type { ApprovedWordingReference, Asset } from './types'

/** Call only with the authenticated owner's assets. Approved text is a style reference, not current product evidence. */
export function approvedWordingForProfile(ownedAssets: Asset[], profileId: string): ApprovedWordingReference[] {
  return ownedAssets.filter(asset=>asset.profileId===profileId).flatMap(asset=>{
    const approved=asset.versions.filter(version=>version.reviewStatus==='approved'&&version.approvedAt).sort((a,b)=>b.version-a.version)[0]
    return approved?[{assetId:asset.id,version:approved.version,title:approved.title.slice(0,200),body:approved.body.slice(0,1800),channel:asset.channel.slice(0,200),approvedAt:approved.approvedAt!}]:[]
  }).sort((a,b)=>b.approvedAt.localeCompare(a.approvedAt)||a.assetId.localeCompare(b.assetId)).slice(0,3)
}
