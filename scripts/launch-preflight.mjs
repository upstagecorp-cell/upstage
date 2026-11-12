// Read-only operator preflight. Never prints values or makes a provider/payment call.
import { existsSync, readFileSync } from 'node:fs'
import { resolve, isAbsolute } from 'node:path'
for (const path of ['.env.local','.env']) if(existsSync(resolve(path))) process.loadEnvFile(resolve(path))
const checks=[]
const check=(label,ok)=>checks.push({label,ok:Boolean(ok)})
const creativeCatalog=JSON.parse(readFileSync(new URL('../src/lib/marketing/creative-plans.json',import.meta.url),'utf8'))
check('Creative offer delivery and versioned billing released',creativeCatalog.status==='available'&&creativeCatalog.releaseReadiness?.mediaDelivery===true&&creativeCatalog.releaseReadiness?.versionedBilling===true)
const [major,minor]=process.versions.node.split('.').map(Number)
check('Node.js 24.14 or newer',major>24||(major===24&&minor>=14))
for(const name of ['OPENAI_API_KEY','OPENAI_MODEL','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','STRIPE_PRICE_CREATIVE_FOCUS','STRIPE_PRICE_CREATIVE_GROWTH','STRIPE_PRICE_MOTION_SCENE_MONTHLY','STRIPE_PRICE_MOTION_FIVE_MONTHLY','STRIPE_PRICE_MOTION_SCENE_ONCE','STRIPE_PRICE_MOTION_FIVE_ONCE','STRIPE_PORTAL_CONFIGURATION','RESEND_API_KEY','NEXORA_EMAIL_FROM','NEXORA_LEGAL_NAME','NEXORA_LEGAL_ADDRESS','NEXT_PUBLIC_SUPPORT_EMAIL']) check(`${name} configured`,process.env[name]?.trim())
let canonical=false
try{const url=new URL(process.env.APP_ORIGIN);canonical=url.protocol==='https:'&&url.pathname==='/'&&!url.search&&!url.hash&&!url.username&&!url.password&&!['localhost','127.0.0.1'].includes(url.hostname)}catch{}
check('Canonical public HTTPS APP_ORIGIN',canonical)
check('Public sitemap origin matches application origin',canonical&&process.env.NEXT_PUBLIC_SITE_URL===process.env.APP_ORIGIN)
check('Persistent database path explicitly configured outside QA',process.env.NEXORA_DB_PATH&&isAbsolute(process.env.NEXORA_DB_PATH)&&!process.env.NEXORA_DB_PATH.includes('.qa')&&process.env.NEXORA_DB_PATH!==':memory:')
check('Live Stripe key selected',process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')||process.env.STRIPE_SECRET_KEY?.startsWith('rk_live_'))
for(const name of ['NEXORA_LEGAL_APPROVED','NEXORA_LIVE_TESTS_APPROVED','NEXORA_PAID_LAUNCH_ENABLED'])check(name,process.env[name]==='true')
for(const item of checks)console.log(`${item.ok?'PASS':'BLOCK'} ${item.label}`)
const blocked=checks.filter(item=>!item.ok).length
console.log(blocked?`\nPaid launch blocked by ${blocked} configuration checks. No network calls or changes were made.`:'\nConfiguration preflight passed. This does not certify tax registrations, provider health, payment tests, monitoring, backup restoration, or customer value; complete the runbook.')
process.exitCode=blocked?1:0
