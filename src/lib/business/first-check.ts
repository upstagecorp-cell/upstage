import type { Assessment, BusinessGoal, BusinessProfile, BusinessProfileInput, BusinessStage, BusinessType, EvidenceInput } from './types'
import { createProfileDefaults, InputError, object, parseEvidenceInput } from './validation'
import { BUSINESS_STAGES, INDUSTRY_TEMPLATES, industryTemplate } from './industry'

export const CHECK_FOCUSES: Array<{id:BusinessGoal; title:string; description:string; question:string; task:string}> = [
  {id:'awareness',title:'I need more customers',description:'Good work. Too few people finding it.',question:'Is the missing piece visibility, or what happens after people find you?',task:'Choose one sales channel. Find its visitor and paid-order counts for the same period.'},
  {id:'conversion',title:'Interest isn’t turning into sales',description:'People look, ask, or click. Then disappear.',question:'Where does interest stop turning into a paid order?',task:'Map the steps from first interest to payment. Pick one step where the outcome is still unknown.'},
  {id:'profitability',title:'Sales aren’t leaving enough profit',description:'You’re selling, but the money feels tight.',question:'What is actually left after the costs of a sale?',task:'Choose one representative sale and list its direct costs. Keep fixed costs separate.'},
  {id:'retention',title:'Customers aren’t coming back',description:'The first sale happens. The next one doesn’t.',question:'Do customers have a clear reason to return?',task:'Define a returning customer, then check a few recent customer experiences before planning a promotion.'},
  {id:'operations',title:'Everything depends on me',description:'Too much firefighting. Not enough room to grow.',question:'Which repeated task is holding up the rest of the business?',task:'Choose one recurring process. Record its start, finish, and an observed delay before changing it.'},
]
export interface FirstCheck {
  version:1
  id:string
  focus:BusinessGoal
  businessType:BusinessType
  stage:BusinessStage
  offering:string
  timeZone:string
  evidence:EvidenceInput[]
}
export function parseFirstCheck(raw:unknown): FirstCheck {
  const value=object(raw)
  if(value.version!==1 || typeof value.id!=='string' || !/^[A-Za-z0-9_-]{8,100}$/.test(value.id)) throw new InputError('Start a new business check.')
  if(!CHECK_FOCUSES.some(item=>item.id===value.focus) || !INDUSTRY_TEMPLATES.some(item=>item.id===value.businessType) || !BUSINESS_STAGES.some(item=>item.id===value.stage)) throw new InputError('Choose a focus, business type, and stage.')
  if(typeof value.offering!=='string' || value.offering.length>5000) throw new InputError('Keep the offer description under 5,000 characters.')
  if(typeof value.timeZone!=='string' || value.timeZone.length>100) throw new InputError('Choose a valid time zone.')
  try { new Intl.DateTimeFormat('en-US',{timeZone:value.timeZone}).format() } catch { throw new InputError('Choose a valid time zone.') }
  if(!Array.isArray(value.evidence) || value.evidence.length>7) throw new InputError('Add up to seven measurements.')
  const evidence=value.evidence.map(parseEvidenceInput)
  if(new Set(evidence.map(item=>item.metric)).size!==evidence.length) throw new InputError('Use one value per metric in this first check.')
  return {version:1,id:value.id,focus:value.focus as BusinessGoal,businessType:value.businessType as BusinessType,stage:value.stage as BusinessStage,offering:value.offering.trim(),timeZone:value.timeZone,evidence}
}
export function firstCheckProfile(check:FirstCheck,previous?:BusinessProfile|null): BusinessProfileInput {
  return {...createProfileDefaults(check.timeZone),...previous,businessType:check.businessType,stage:check.stage,goal:check.focus,industry:previous?.industry || industryTemplate(check).label,offering:check.offering || previous?.offering || '',uiLocale:'en-US',contentLocale:'en-US'}
}
export function firstDirection(assessment:Assessment) {
  const focus=CHECK_FOCUSES.find(item=>item.id===assessment.profileSnapshot.goal)!
  const action=assessment.recommendedActions[0]
  const costsFirst=action?.kind==='review_costs'
  const planning=['planning','launching'].includes(assessment.profileSnapshot.stage??'')
  const planningFirst=planning&&action?.kind==='collect_data'
  const draftFirst=action?.kind==='marketing_assets'
  const businessQuestions:Partial<Record<BusinessType,string>>={services:'Where does an inquiry become a paid project?',ecommerce:'Where does a store visit become a paid order?',accommodation:'Where does guest interest become a booking?',restaurant:'How do customers find you and place an order?',cafe:'How do people discover you and make a first visit?',retail:'How does a store visit turn into a purchase?',creator:'How does your audience reach your paid offer?'}
  const question=['awareness','conversion'].includes(focus.id)?businessQuestions[assessment.profileSnapshot.businessType??'general']??focus.question:focus.question
  const businessTasks:Partial<Record<BusinessType,string>>={services:'Choose one lead source. Trace a few inquiries through proposal and payment, noting the steps you cannot yet account for.',ecommerce:'Choose one storefront channel. Match its visits and paid orders for one period, then check the steps between product view and payment.',accommodation:'Choose one booking channel. Check sessions, bookings, and unavailable inventory for the same reporting period.',restaurant:'Choose dine-in, takeout, or delivery. Check how customers find that channel and how its visits or inquiries become paid orders.',cafe:'Choose walk-in, pickup, or online ordering. Define a visit and a paid order before comparing the counts.',retail:'Choose one reporting period. Check store entries, paid transactions, and any products that were unavailable.',creator:'Choose one paid offer. Follow the path from the content to the offer and payment, keeping views separate from customers.'}
  const task=['awareness','conversion'].includes(focus.id)?businessTasks[assessment.profileSnapshot.businessType??'general']??focus.task:focus.task
  return {
    headline:costsFirst?'Start with what each sale leaves behind.':planningFirst?'Test the assumption before the bigger investment.':draftFirst?'Give your next message a clear job.':question,
    explanation:costsFirst?'Review the cost breakdown before adding more demand. Period totals alone cannot tell you which costs are responsible.':planningFirst?'Your next useful step is a small test of the offer or customer need. Operating performance can stay unknown until it exists.':draftFirst?'Your saved recommendation is to test a marketing message for your stated goal. Review the offer and intended customer action before creating a draft.':`For ${industryTemplate(assessment.profileSnapshot).label.toLowerCase()}, start by separating what you know from the step you have not measured yet.`,
    task:costsFirst?CHECK_FOCUSES.find(item=>item.id==='profitability')!.task:planningFirst?'Choose one assumption about your offer. Ask prospective customers to react to it, and record what they actually say.':draftFirst?'Create one marketing draft for the selected customer action. Verify its claims, approve the exact version, and measure the results after actual use.':task,
    guideId:action?.guideIds?.[0]??'baseline',
    action,
  }
}
