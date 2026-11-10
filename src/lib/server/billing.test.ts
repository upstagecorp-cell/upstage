import Stripe from 'stripe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createHash } from 'node:crypto'
import { database, closeDatabases, saveRecord, workspace } from './database'
import { billingSummary, createCheckout, handleBillingWebhook, paidCheckoutAvailable, requireGenerationAllowance, syncBilling } from './billing'
import { authenticate, sessionCookie } from './auth'
import { completeAccountToken, requestAccountEmail } from './account-email'
import { assess, generate, updateProfile } from './operations'
import { createProfileDefaults } from '@/lib/business/validation'
beforeEach(()=>{closeDatabases();vi.stubEnv('NEXORA_DB_PATH',':memory:');vi.stubEnv('STRIPE_SECRET_KEY','sk_test_fixture');vi.stubEnv('STRIPE_WEBHOOK_SECRET','whsec_fixture');vi.stubEnv('STRIPE_PRICE_FOCUS','price_focus');vi.stubEnv('STRIPE_PRICE_GROWTH','price_growth');vi.stubEnv('NEXORA_PAID_LAUNCH_ENABLED','false')})
afterEach(()=>{closeDatabases();vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks()})
async function owner(email='billing@example.com'){return authenticate({email,password:'fixture-password-12345'},true)}
function openConfiguration(){for(const [key,value] of Object.entries({NEXORA_PAID_LAUNCH_ENABLED:'true',NEXORA_LEGAL_APPROVED:'true',NEXORA_LIVE_TESTS_APPROVED:'true',OPENAI_API_KEY:'fixture-openai',OPENAI_MODEL:'fixture-model',STRIPE_PORTAL_CONFIGURATION:'bpc_fixture',NEXORA_LEGAL_NAME:'Fixture operator',NEXORA_LEGAL_ADDRESS:'Fixture address',NEXT_PUBLIC_SUPPORT_EMAIL:'support@example.com',APP_ORIGIN:'https://example.com',RESEND_API_KEY:'fixture-email',NEXORA_EMAIL_FROM:'account@example.com'}))vi.stubEnv(key,value)}
function ready(ownerId:string){saveRecord(ownerId,'email_verified','current',{verifiedAt:new Date().toISOString()});updateProfile(ownerId,{...createProfileDefaults('UTC'),name:'Fixture business',offering:'Design consultation',customerType:'Independent businesses',salesChannels:['Website'],goal:'awareness'});assess(ownerId,{evidenceIds:[]})}
function paid(id:string,extra:Record<string,unknown>={}){saveRecord(id,'billing','current',{id:'sub_fixture',plan:'focus',status:'active',paid:true,periodStart:new Date(Date.now()-86_400_000).toISOString(),periodEnd:new Date(Date.now()+29*86_400_000).toISOString(),cancelAtPeriodEnd:false,...extra})}
function job(id:string,status='succeeded',createdAt=new Date().toISOString()){return {id,status,createdAt}}
function subscription(extra:Record<string,unknown>={}){return {id:'sub_fixture',created:100,status:'active',cancel_at_period_end:false,latest_invoice:{id:'in_paid',status:'paid'},items:{data:[{quantity:1,current_period_start:Math.floor(Date.now()/1000)-100,current_period_end:Math.floor(Date.now()/1000)+3600,price:{id:'price_focus',currency:'usd',unit_amount:14900,tax_behavior:'exclusive',recurring:{interval:'month',interval_count:1}}}]},...extra}}
describe('paid entitlements and Stripe event trust',()=>{
  it('refreshes an unconnected free account without requiring a Stripe key',async()=>{
    const user=await owner();vi.stubEnv('STRIPE_SECRET_KEY','')
    await expect(syncBilling(user.id)).resolves.toBeUndefined();expect(billingSummary(user.id).plan).toBe('free')
  })
  it('denies free generation before any provider call or job reservation',async()=>{
    const user=await owner();updateProfile(user.id,{...createProfileDefaults('UTC'),name:'Fixture',offering:'Design consultation',customerType:'Local businesses',salesChannels:['Website'],goal:'awareness'})
    const assessment=assess(user.id,{evidenceIds:[]}).assessments[0], action=assessment.recommendedActions.find(item=>item.kind==='marketing_assets')!
    const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock)
    await expect(generate(user.id,{assessmentId:assessment.id,actionId:action.id,idempotencyKey:'free-request-key',counts:{hooks:1,adCopy:0,scripts:0,ctas:0}})).rejects.toMatchObject({code:'SUBSCRIPTION_REQUIRED'})
    expect(fetchMock).not.toHaveBeenCalled();expect(workspace(user.id).jobs).toHaveLength(0)
  })
  it('counts reserved and successful packages, excludes failures and old periods, and isolates owners',async()=>{
    const user=await owner(),other=await owner('other@example.com');paid(user.id)
    for(let i=0;i<15;i++)saveRecord(user.id,'job',String(i),job(String(i)))
    saveRecord(user.id,'job','failed',job('failed','failed'));saveRecord(user.id,'job','old',job('old','succeeded','2020-01-01T00:00:00Z'))
    expect(billingSummary(user.id).packagesUsed).toBe(15);expect(billingSummary(other.id).packagesUsed).toBe(0)
    expect(()=>requireGenerationAllowance(user.id,7)).toThrow('6 text assets')
    saveRecord(user.id,'job','running',job('running','running'));expect(()=>requireGenerationAllowance(user.id,3)).toThrow('No overage')
  })
  it('removes generation access on expiry, unpaid invoice, or failed payment but retains saved records',async()=>{
    const user=await owner();paid(user.id,{cancelAtPeriodEnd:true});expect(billingSummary(user.id).plan).toBe('focus')
    for(const extra of [{periodEnd:'2020-01-01T00:00:00Z'},{paid:false},{status:'past_due'},{status:'canceled'}]){paid(user.id,extra);expect(billingSummary(user.id).plan).toBe('free')}
    expect(database().prepare('SELECT count(*) AS n FROM records WHERE owner_id=?').get(user.id)).toMatchObject({n:1})
  })
  it('cannot open checkout through a client-supplied price or an unconfigured server',async()=>{
    const user=await owner();await expect(createCheckout(user,{plan:'focus',price:'price_cheaper'})).rejects.toMatchObject({code:'BILLING_UNAVAILABLE'})
    openConfiguration();vi.stubEnv('NODE_ENV','production')
    expect(paidCheckoutAvailable()).toBe(false)
    await expect(createCheckout(user,{plan:'focus'})).rejects.toMatchObject({code:'BILLING_UNAVAILABLE'})
  })
  it('checks verification and workspace suitability before making any Stripe request',async()=>{
    openConfiguration();const user=await owner(),fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock)
    await expect(createCheckout(user,{plan:'focus'})).rejects.toMatchObject({code:'EMAIL_VERIFICATION_REQUIRED'})
    saveRecord(user.id,'email_verified','current',{})
    await expect(createCheckout(user,{plan:'focus'})).rejects.toMatchObject({code:'WORKSPACE_SETUP_REQUIRED'})
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('uses the server catalog, tax calculation, and one idempotent checkout intent',async()=>{
    openConfiguration();const user=await owner();ready(user.id)
    const stripe=new Stripe('sk_test_fixture')
    vi.spyOn(Object.getPrototypeOf(stripe.prices),'retrieve').mockResolvedValue({id:'price_focus',active:true,currency:'usd',unit_amount:14900,tax_behavior:'exclusive',recurring:{interval:'month',interval_count:1}})
    const customer=vi.spyOn(Object.getPrototypeOf(stripe.customers),'create').mockResolvedValue({id:'cus_checkout'})
    vi.spyOn(Object.getPrototypeOf(stripe.subscriptions),'list').mockResolvedValue({data:[],has_more:false})
    const checkout=vi.spyOn(Object.getPrototypeOf(stripe.checkout.sessions),'create').mockResolvedValue({url:'https://checkout.stripe.com/c/pay/fixture'})
    expect(await createCheckout(user,{plan:'focus',price:'price_attack',amount:1})).toContain('checkout.stripe.com')
    await createCheckout(user,{plan:'focus'})
    expect(customer).toHaveBeenCalledTimes(1)
    expect(checkout.mock.calls[0][0]).toMatchObject({mode:'subscription',customer:'cus_checkout',line_items:[{price:'price_focus',quantity:1}],automatic_tax:{enabled:true}})
    expect(checkout.mock.calls[0][1]).toEqual(checkout.mock.calls[1][1])
    expect(billingSummary(user.id).plan).toBe('free')
    await expect(createCheckout(user,{plan:'growth'})).rejects.toMatchObject({code:'BILLING_CATALOG_MISMATCH'})
  })
  it('refuses a second subscription for an existing customer',async()=>{
    openConfiguration();const user=await owner();ready(user.id);database().prepare('INSERT INTO billing_customers(owner_id,customer_id) VALUES(?,?)').run(user.id,'cus_existing')
    const stripe=new Stripe('sk_test_fixture')
    vi.spyOn(Object.getPrototypeOf(stripe.prices),'retrieve').mockResolvedValue({id:'price_focus',active:true,currency:'usd',unit_amount:14900,tax_behavior:'exclusive',recurring:{interval:'month',interval_count:1}})
    vi.spyOn(Object.getPrototypeOf(stripe.subscriptions),'list').mockResolvedValue({data:[subscription()],has_more:false})
    await expect(createCheckout(user,{plan:'focus'})).rejects.toMatchObject({code:'SUBSCRIPTION_EXISTS'})
  })
  it('rejects forged, expired, and modified signatures',async()=>{
    const stripe=new Stripe('sk_test_fixture'),body=JSON.stringify({id:'evt_signed',type:'ping',data:{object:{}}})
    const header=stripe.webhooks.generateTestHeaderString({payload:body,secret:'whsec_fixture'})
    await expect(handleBillingWebhook(`${body} `,header)).rejects.toMatchObject({code:'INVALID_SIGNATURE'})
    const expired=stripe.webhooks.generateTestHeaderString({payload:body,secret:'whsec_fixture',timestamp:Math.floor(Date.now()/1000)-600})
    await expect(handleBillingWebhook(body,expired)).rejects.toMatchObject({code:'INVALID_SIGNATURE'})
    await handleBillingWebhook(body,header);await handleBillingWebhook(body,header)
    expect(database().prepare('SELECT count(*) AS n FROM billing_events').get()).toMatchObject({n:1})
  })
  it('syncs current provider state and rejects an incorrect catalog price',async()=>{
    const user=await owner();database().prepare('INSERT INTO billing_customers(owner_id,customer_id) VALUES(?,?)').run(user.id,'cus_fixture')
    const list=vi.fn().mockResolvedValue({data:[subscription()],has_more:false}),stripe={subscriptions:{list}} as unknown as Stripe
    await syncBilling(user.id,stripe);expect(billingSummary(user.id).plan).toBe('focus')
    list.mockResolvedValue({data:[subscription({latest_invoice:{status:'open'}})],has_more:false});await syncBilling(user.id,stripe);expect(billingSummary(user.id).plan).toBe('free')
    const wrong=subscription();wrong.items.data[0].price.unit_amount=9900;list.mockResolvedValue({data:[wrong],has_more:false});await syncBilling(user.id,stripe);expect(billingSummary(user.id).plan).toBe('free')
  })
  it('does not let a slower earlier sync overwrite a completed newer sync',async()=>{
    const user=await owner();database().prepare('INSERT INTO billing_customers(owner_id,customer_id) VALUES(?,?)').run(user.id,'cus_fixture')
    let resolveFirst!:(value:unknown)=>void
    const list=vi.fn().mockImplementationOnce(()=>new Promise(resolve=>{resolveFirst=resolve})).mockResolvedValueOnce({data:[subscription({status:'canceled'})],has_more:false})
    const stripe={subscriptions:{list}} as unknown as Stripe,first=syncBilling(user.id,stripe)
    await syncBilling(user.id,stripe);resolveFirst({data:[subscription()],has_more:false});await first
    expect(billingSummary(user.id).status).toBe('canceled')
  })
})
describe('account email tokens',()=>{
  it('sends no email without configuration and never stores a raw token',async()=>{
    const user=await owner();vi.stubEnv('RESEND_API_KEY','');await expect(requestAccountEmail(user.email,'reset')).rejects.toMatchObject({code:'EMAIL_UNAVAILABLE'})
    vi.stubEnv('RESEND_API_KEY','fixture-key');vi.stubEnv('NEXORA_EMAIL_FROM','NEXORA <account@example.com>');vi.stubEnv('APP_ORIGIN','https://example.com')
    const fetchMock=vi.fn().mockResolvedValue(new Response('{}'));vi.stubGlobal('fetch',fetchMock)
    await requestAccountEmail(user.email,'verify')
    const body=JSON.parse(fetchMock.mock.calls[0][1].body),token=body.text.match(/token=([a-f0-9]{64})/)[1]
    expect(database().prepare('SELECT token_hash FROM account_tokens').get()).toEqual({token_hash:createHash('sha256').update(token).digest('hex')})
    await completeAccountToken({purpose:'verify',token});expect(billingSummary(user.id).emailVerified).toBe(true)
    await expect(completeAccountToken({purpose:'verify',token})).rejects.toMatchObject({code:'INVALID_TOKEN'})
  })
  it('resets once, rejects expiry/purpose substitution, and invalidates existing sessions',async()=>{
    const user=await owner();sessionCookie(new Request('https://example.com'),user.id)
    const token='a'.repeat(64),tokenHash=createHash('sha256').update(token).digest('hex')
    database().prepare('INSERT INTO account_tokens VALUES(?,?,?,?,?)').run(tokenHash,user.id,'reset',Date.now()+60_000,Date.now())
    await expect(completeAccountToken({purpose:'verify',token})).rejects.toMatchObject({code:'INVALID_TOKEN'})
    await completeAccountToken({purpose:'reset',token,password:'a-new-fixture-password-123'})
    expect(database().prepare('SELECT count(*) AS n FROM sessions').get()).toMatchObject({n:0})
    await expect(authenticate({email:user.email,password:'fixture-password-12345'},false)).rejects.toMatchObject({code:'INVALID_CREDENTIALS'})
    expect((await authenticate({email:user.email,password:'a-new-fixture-password-123'},false)).id).toBe(user.id)
    await expect(completeAccountToken({purpose:'reset',token,password:'another-password-12345'})).rejects.toMatchObject({code:'INVALID_TOKEN'})
    database().prepare('INSERT INTO account_tokens VALUES(?,?,?,?,?)').run(tokenHash,user.id,'reset',Date.now()-1,Date.now()-1000)
    await expect(completeAccountToken({purpose:'reset',token,password:'another-password-12345'})).rejects.toMatchObject({code:'INVALID_TOKEN'})
  })
})
