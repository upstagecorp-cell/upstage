import { createHash, randomUUID } from 'node:crypto'
import { firstCheckProfile, parseFirstCheck } from '@/lib/business/first-check'
import { createAssessment } from '@/lib/business/assessment'
import type { Assessment, BusinessProfile, Evidence } from '@/lib/business/types'
import { parseProfileInput } from '@/lib/business/validation'
import { getLocalDateKey } from '@/lib/date-time'
import { getRecord, listRecords, saveRecord, transaction, workspace } from './database'
import { HttpError, invalid, objectInput } from './errors'

export function saveFirstCheck(owner:string,raw:unknown) {
  const input=objectInput(raw)
  if(input.confirmed!==true)invalid('Review and confirm before saving this check to your account.')
  if(!Number.isSafeInteger(input.expectedVersion)||Number(input.expectedVersion)<0)invalid('Refresh your business details before saving.')
  const check=parseFirstCheck(input.check)
  const hash=createHash('sha256').update(JSON.stringify(check)).digest('hex')
  transaction(()=>{
    const saved=getRecord<{hash:string}>(owner,'first_check',check.id)
    if(saved) {
      if(saved.hash!==hash)throw new HttpError(409,'CHECK_CHANGED','This check was already saved with different answers. Start a new check.')
      return
    }
    const previous=getRecord<BusinessProfile>(owner,'profile','current')
    if((previous?.version??0)!==input.expectedVersion)throw new HttpError(409,'PROFILE_CHANGED','Your business details changed in another tab. Refresh and review before saving.')
    const profileInput=parseProfileInput(firstCheckProfile(check,previous))
    if(check.evidence.some(item=>item.periodEnd>getLocalDateKey(new Date(),profileInput.timeZone)))invalid('Measured reporting periods cannot end in the future in your business time zone.')
    const recordedAt=new Date().toISOString()
    const profile:BusinessProfile={...profileInput,id:previous?.id??randomUUID(),version:(previous?.version??0)+1,updatedAt:recordedAt}
    const evidence:Evidence[]=check.evidence.map(item=>({...item,id:randomUUID(),profileId:profile.id,recordedAt}))
    const previousAssessment=listRecords<Assessment>(owner,'assessment').at(-1)
    const assessment=createAssessment(profile,evidence,previousAssessment?.id??null)
    saveRecord(owner,'profile','current',profile)
    saveRecord(owner,'profile_version',`${profile.id}:${profile.version}`,profile)
    for(const row of evidence)saveRecord(owner,'evidence',row.id,row)
    saveRecord(owner,'assessment',assessment.id,assessment)
    saveRecord(owner,'first_check',check.id,{id:check.id,hash,assessmentId:assessment.id,recordedAt})
  })
  return workspace(owner)
}
