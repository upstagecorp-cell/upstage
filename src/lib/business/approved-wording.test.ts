import { describe,expect,it } from 'vitest'
import type { Asset } from './types'
import { approvedWordingForProfile } from './approved-wording'

function asset(id:string,profileId='business'):Asset{return {id,profileId,jobId:'job',assessmentId:'assessment',actionId:'action',kind:'ad_copy',language:'en-US',linkedProblem:'Offer review',target:'Customers',keyMessage:'An offer',channel:'Website',expectedAction:'Review',measurementMetric:'purchases',claimsToVerify:[],currentVersion:3,versions:[{version:1,title:'Earlier approval',body:'Old approved wording',createdAt:'2026-01-01T00:00:00Z',approvedAt:'2026-01-02T00:00:00Z',reviewStatus:'approved'},{version:2,title:'Latest approval',body:'Current approved wording',createdAt:'2026-01-03T00:00:00Z',approvedAt:'2026-01-04T00:00:00Z',reviewStatus:'approved'},{version:3,title:'Unapproved edits',body:'Do not include these edits',createdAt:'2026-01-05T00:00:00Z',approvedAt:null,reviewStatus:'draft'}]}}

describe('approved wording references',()=>{
  it('uses the latest approved version without adopting current unapproved edits or another profile',()=>{
    const references=approvedWordingForProfile([asset('own'),asset('other','different-business')],'business')
    expect(references).toHaveLength(1)
    expect(references[0]).toMatchObject({assetId:'own',version:2,title:'Latest approval',body:'Current approved wording'})
  })
  it('bounds context size and omits drafts that have never been approved',()=>{
    const rows=Array.from({length:5},(_,index)=>{const item=asset(`asset-${index}`);item.versions[1].body='x'.repeat(12000);return item})
    const draft=asset('never-approved');draft.versions=draft.versions.filter(item=>item.reviewStatus==='draft')
    const references=approvedWordingForProfile([draft,...rows],'business')
    expect(references).toHaveLength(3)
    expect(references.every(item=>item.body.length===1800)).toBe(true)
    expect(references.some(item=>item.assetId==='never-approved')).toBe(false)
  })
})
