import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

// Local-only QA: uses an isolated browser profile and the already-running dev
// server. It never configures or calls an AI provider, payment, or publishing API.
const baseUrl = process.env.NEXORA_QA_URL || 'http://localhost:3100'
const qaOrigin = new URL(baseUrl)
if (!['localhost', '127.0.0.1'].includes(qaOrigin.hostname) || qaOrigin.port !== '3100') throw new Error('Run this script only against an isolated local QA server on port 3100.')
const chromePath = process.env.NEXORA_QA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const debugPort = Number(process.env.NEXORA_QA_CDP_PORT || 9231)
const artifactDirectory = resolve('.qa/browser-smoke')
const profileDirectory = resolve(`.qa/browser-profile-${Date.now()}`)
const disableNestedSandbox = process.argv.includes('--no-sandbox')
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname)) throw new Error('Browser smoke QA is restricted to a local isolated test server.')
const sleep = ms => new Promise(done => setTimeout(done, ms))
await mkdir(artifactDirectory, { recursive: true })
await mkdir(profileDirectory, { recursive: true })

const browser = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--disable-gpu-sandbox', '--no-first-run', '--no-default-browser-check',
  '--disable-background-networking', '--disable-extensions', '--disable-sync',
  ...(disableNestedSandbox ? ['--no-sandbox'] : []),
  `--remote-debugging-port=${debugPort}`, '--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${profileDirectory}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
let browserError = ''
browser.stderr.on('data', data => { browserError = `${browserError}${data}`.slice(-4000) })
browser.on('error', error => { browserError = error.message })
const pending = new Map()
const runtimeErrors = []
let activePage = 'about:blank'
let socket
let nextId = 0

async function until(check, message, timeout = 25_000) {
  const deadline = Date.now() + timeout
  let lastError
  while (Date.now() < deadline) {
    try { const value = await check(); if (value) return value } catch (error) { lastError = error }
    await sleep(100)
  }
  throw new Error(`${message}${lastError ? ` (${lastError.message})` : ''}`)
}

function command(method, params = {}) {
  return new Promise((resolveCommand, reject) => {
    const id = ++nextId
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 30_000)
    pending.set(id, { timer, resolve: value => { clearTimeout(timer); resolveCommand(value) }, reject: error => { clearTimeout(timer); reject(error) } })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  return result.result.value
}

async function navigate(path, expectedText) {
  activePage = path
  await command('Page.navigate', { url: `${baseUrl}${path}` })
  await until(() => evaluate(`document.readyState === 'complete' && document.body.innerText.includes(${JSON.stringify(expectedText)})`), `Page did not render: ${path}`)
  await sleep(250)
}

async function expectEnglish(name) {
  const status = await evaluate(`({language:document.documentElement.lang, korean:/[가-힣]/.test(document.body.innerText), overflow:document.documentElement.scrollWidth > innerWidth+2})`)
  if (status.language !== 'en-US' || status.korean) throw new Error(`English-only UI check failed: ${name}`)
  if (status.overflow) throw new Error(`Horizontal viewport overflow: ${name}`)
  console.log(`PASS ${name}: English UI, correct document language, no horizontal overflow`)
}

async function click(text) {
  const found = await evaluate(`(() => {const element=[...document.querySelectorAll('button'),...document.querySelectorAll('a,summary')].find(item=>item.getClientRects().length&&(item.innerText.trim()===${JSON.stringify(text)}||item.getAttribute('aria-label')===${JSON.stringify(text)}||item.querySelector('.nx-choice-title')?.innerText===${JSON.stringify(text)}));if(!element)return false;element.click();return true})()`)
  if (!found) throw new Error(`Clickable control missing: ${text}`)
}

async function fillLabel(label, value) {
  const found = await evaluate(`(() => {const label=[...document.querySelectorAll('label')].find(item=>item.firstElementChild?.textContent.trim()===${JSON.stringify(label)});const field=label?.querySelector('input,textarea,select');if(!field)return false;const prototype=field.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:field.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value').set.call(field,${JSON.stringify(value)});field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));return true})()`)
  if (!found) throw new Error(`Input label missing: ${label}`)
}

async function fillSelector(selector, value) {
  const found = await evaluate(`(() => {const field=document.querySelector(${JSON.stringify(selector)});if(!field)return false;Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,${JSON.stringify(value)});field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));return true})()`)
  if (!found) throw new Error(`Input missing: ${selector}`)
}

async function screenshot(name) {
  await sleep(450)
  const { data } = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  await writeFile(resolve(artifactDirectory, `${name}.png`), Buffer.from(data, 'base64'))
}

try {
  await until(async () => {
    const response = await fetch(`${baseUrl}/api/session`, {signal:AbortSignal.timeout(5000)})
    return response.ok
  }, 'The local NEXORA dev server is unavailable', 35_000)
  const pages = await until(async () => {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
    const targets = await response.json()
    return targets.find(target => target.type === 'page')
  }, `Headless Chrome did not expose CDP: ${browserError}`)
  socket = new WebSocket(pages.webSocketDebuggerUrl)
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') {
      const description = message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text
      runtimeErrors.push(`[${activePage}] ${description}`)
      console.error(`RUNTIME ${activePage}: ${description.split('\n')[0]}`)
    }
    if (!message.id) return
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.resolve(message.result)
  })
  await new Promise((done, reject) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  await command('Page.enable')
  await command('Runtime.enable')
  await command('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
  await command('Emulation.setLocaleOverride', { locale: 'ko-KR' })
  await command('Page.addScriptToEvaluateOnNewDocument', { source: `try { localStorage.setItem('nexora-ui-locale','ko-KR') } catch {}` })

  await navigate('/', 'From big questions')
  await expectEnglish('Landing with Korean browser locale and saved Korean preference')
  await screenshot('landing-desktop')
  await navigate('/guide', 'A clear path from')
  await expectEnglish('How it works')
  await navigate('/pricing', 'Paid subscriptions are not open for purchase yet')
  await expectEnglish('Pricing')
  await navigate('/login', 'Welcome back')
  await expectEnglish('Login')
  await navigate('/register', 'Create your account')
  await expectEnglish('Registration')

  await navigate('/demo', 'Fictional example — not your business analysis.')
  await expectEnglish('Public fictional example before signup')
  if (!process.argv.includes('--demo-only')) {
  const anonymous = await evaluate("fetch('/api/session').then(r=>r.json())")
  if (anonymous.user !== null) throw new Error('The example must not require or create an account')
  await fillLabel('Example business goal','profitability')
  await until(()=>evaluate("document.body.innerText.includes('Review costs before making more content')"),'Profitability example forced a marketing package')
  await navigate('/explore?guide=baseline','Practical guides for your next action')
  await expectEnglish('Public searchable execution guides')
  await fillLabel('Search guides','unfindable-qa-query')
  await until(()=>evaluate("document.body.innerText.includes('No guides match')"),'Guide search did not filter')
  await navigate('/start','What would you most like to figure out?')
  await click('I need more customers')
  await click('Continue')
  await until(()=>evaluate("document.body.innerText.includes('What kind of business')"),'First check did not advance to business type')
  await click('Professional / local services')
  await click('Continue')
  await until(()=>evaluate("document.body.innerText.includes('Where are you right now?')"),'First check did not advance to business stage')
  await click('Already operating')
  await fillLabel('In a sentence, what do you offer? (optional)','Brand design for independent businesses')
  await screenshot('first-check-context-desktop')
  await click('See my first direction')
  await until(()=>evaluate("document.body.innerText.includes('Your first direction')"),'First direction was hidden behind signup')
  await expectEnglish('Anonymous first direction from real choices')
  await screenshot('first-direction-desktop')
  const beforeSignup = await evaluate("fetch('/api/session').then(r=>r.json())")
  if(beforeSignup.user!==null) throw new Error('The business check created an account before consent')
  await command('Page.reload',{ignoreCache:true})
  await until(()=>evaluate("document.body.innerText.includes('Your first direction')&&document.body.innerText.includes('Brand design for independent businesses')"),'Tab reload lost the first check')
  await navigate('/register','Create your account')

  const email = `browser-qa-${Date.now()}@example.invalid`
  const password = `QA-${crypto.randomUUID()}-LocalOnly!`
  await fillSelector('input[type="email"]', email)
  await fillSelector('input[type="password"]', password)
  await click('Create account')
  await until(() => evaluate(`location.pathname==='/workspace' && document.body.innerText.includes('Your first check is ready to keep.')`), 'Registration did not preserve the first check')
  const beforeConsent=await evaluate("fetch('/api/workspace').then(r=>r.json()).then(x=>x.workspace)")
  if(beforeConsent.profile!==null||beforeConsent.assessments.length)throw new Error('Registration silently saved first-check business data')
  await click('Save this check to my account')
  await until(()=>evaluate("document.body.innerText.includes('A little more clarity.')&&!document.body.innerText.includes('Your first check is ready to keep.')"),'Confirmed check did not create the assessment and overview')
  const afterConsent=await evaluate("fetch('/api/workspace').then(r=>r.json()).then(x=>x.workspace)")
  if(afterConsent.assessments.length!==1||afterConsent.profile.offering!=='Brand design for independent businesses'||afterConsent.evidence.length)throw new Error('First check did not retain answers or invented metrics')
  console.log('PASS Value before signup, explicit save, and answer continuity without invented metrics')
  await screenshot('workspace-overview-desktop')
  await expectEnglish('New account workspace')
  await navigate('/workspace#profile','Business Profile')
  await fillLabel('Business name (optional)', 'QA Design Studio')
  await fillLabel('Business type', 'services')
  await fillLabel('Industry details (optional)', 'Design services')
  await fillLabel('Business stage', 'operating')
  await click('Continue')
  await until(()=>evaluate("document.body.innerText.includes('Products or services (optional)')"),'Guided offer step did not open')
  await fillLabel('Products or services (optional)', 'Brand design and website design services for small businesses.')
  await fillLabel('Target customers (optional)', 'Independent business owners in the United States')
  await fillLabel('Sales channels (optional)', 'Website, email')
  await click('Continue')
  await until(()=>evaluate("document.body.innerText.includes('What are the steps from an inquiry to a paid engagement?')"),'Business-specific service questions were missing')
  await click('Skip this step')
  await until(()=>evaluate("document.body.innerText.includes('Your time zone')"),'Unknown business questions could not be skipped')
  await fillLabel('Your time zone', 'America/New_York')
  await click('Continue')
  await until(()=>evaluate("document.body.innerText.includes('Review and save')"),'Review step did not open')
  await click('Save Business Profile')
  await until(() => evaluate(`location.hash==='#overview'`), 'Profile did not persist and return to the next action')
  await navigate('/workspace#evidence','Business evidence')
  await expectEnglish('Saved profile and evidence form')

  const periodStart = '2026-01-01'
  const periodEnd = '2026-01-07'
  await fillLabel('Count', '0')
  await fillLabel('Period start', periodStart)
  await fillLabel('Period end (inclusive)', periodEnd)
  await fillLabel('Source description', 'Local QA measured visitor report')
  await click('Save evidence')
  await until(() => evaluate(`document.body.innerText.includes('Evidence saved.')`), 'Zero-valued evidence was not saved')
  await fillLabel('Metric', 'purchases')
  await fillLabel('Count', '0')
  await click('Save evidence')
  await until(() => evaluate(`[...document.querySelectorAll('strong')].some(e=>e.innerText==='Purchases')`), 'Purchase evidence was not saved')
  await fillLabel('Metric','revenue')
  await fillLabel('Amount (major currency units)','125.50')
  await fillLabel('Source description','Local QA ledger')
  await click('Save evidence')
  await until(()=>evaluate("document.body.innerText.includes('125.50')"),'First monetary measurement did not persist')
  await fillLabel('Amount (major currency units)','130.50')
  await fillLabel('Period start','2026-01-08')
  await fillLabel('Period end (inclusive)','2026-01-14')
  await click('Save evidence')
  await until(()=>evaluate("document.body.innerText.includes('130.50')"),'Second monetary measurement did not persist')
  await click('Business check')
  await click('Reassess with selected evidence')
  await click('The evidence behind this direction\nFacts, possible explanations, and questions still open.')
  await until(() => evaluate(`document.body.innerText.includes('visitor count is zero')`), 'Assessment did not handle zero denominator')
  await expectEnglish('Assessment with zero denominator and missing money data')
  await screenshot('assessment-desktop')
  await command('Page.reload', { ignoreCache: true })
  await until(() => evaluate(`document.body.textContent.includes('visitor count is zero') && document.body.innerText.includes('QA Design Studio')`), 'Reload did not preserve profile, evidence, and assessment')
  console.log('PASS persisted profile, evidence, and assessment after browser reload')

  for (const [path, hash, text] of [
    ['/onboarding', '#profile', 'Business Profile'],
    ['/diagnosis', '#assessment', 'A practical way forward'],
    ['/diagnosis/result', '#assessment', 'A practical way forward'],
    ['/action', '#assets', 'Content generation is not configured'],
    ['/history', '#history', 'History and exports'],
  ]) {
    await navigate(path, text)
    const target = await evaluate('({path:location.pathname,hash:location.hash})')
    if (target.path !== '/workspace' || target.hash !== hash) throw new Error(`Incorrect legacy redirect: ${path}`)
    await expectEnglish(`Redirect ${path}`)
    if (path === '/action') {
      const disabled = await evaluate(`[...document.querySelectorAll('button')].some(button=>button.innerText.trim()==='Generate package' && button.disabled)`)
      if (!disabled) throw new Error('Unconfigured provider generation must remain disabled')
    }
  }
  await navigate('/metrics','Measured performance')
  await until(()=>evaluate("document.body.innerText.includes('125.50') && document.body.innerText.includes('130.50') && document.body.innerText.includes('USD')"),'Actual monetary graph did not use recorded values')
  await expectEnglish('Actual measured performance and sources')
  await screenshot('performance-desktop')
  await fillLabel('Performance metric','conversionRate')
  await until(()=>evaluate("document.body.innerText.includes('No compatible measurements')"),'Undefined conversion was plotted as an invented value')
  await navigate('/workspace#assessment','A practical way forward')
  const beforePlan = await evaluate("fetch('/api/workspace').then(r=>r.json()).then(x=>JSON.stringify({evidence:x.workspace.evidence,assessments:x.workspace.assessments,results:x.workspace.results}))")
  await click('Plan this action')
  await until(()=>evaluate("document.body.innerText.includes('Add a recommendation to this week')"),'Recommendation did not open weekly planning')
  await fillLabel('Goal title','QA weekly baseline')
  await click('Save weekly goal')
  await until(()=>evaluate("document.body.innerText.includes('Weekly goal saved.')"),'Weekly goal did not save')
  await navigate('/goals','QA weekly baseline')
  if (await evaluate("location.pathname") !== '/goals') throw new Error('/goals must provide planning rather than redirect to a profile')
  await click('Edit goal')
  await fillLabel('Goal status','completed')
  await evaluate("document.querySelector('input[type=checkbox]').click()")
  await click('Save goal changes')
  await until(()=>evaluate("document.body.innerText.includes('1 of 1 active goals completed')"),'Weekly completion did not persist')
  const afterPlan = await evaluate("fetch('/api/workspace').then(r=>r.json()).then(x=>JSON.stringify({evidence:x.workspace.evidence,assessments:x.workspace.assessments,results:x.workspace.results}))")
  if (beforePlan!==afterPlan) throw new Error('Goal completion modified measured business evidence or assessments')
  await screenshot('weekly-plan-desktop')
  await click('Collect a useful baseline')
  await until(()=>evaluate("location.pathname==='/explore' && document.body.innerText.includes('Return to weekly plan')"),'Related guide did not retain execution context')
  await click('Return to weekly plan')
  await until(()=>evaluate("location.pathname==='/goals' && document.body.innerText.includes('QA weekly baseline')"),'Guide did not return to original weekly plan')
  await expectEnglish('Guide round trip and persisted weekly completion')
  const savedPlan = await evaluate("fetch('/api/workspace').then(r=>r.json()).then(x=>x.workspace.weeklyPlans[0])")
  await navigate('/workspace#assessment','A practical way forward')
  await click('Reassess with selected evidence')
  await until(()=>evaluate("document.body.innerText.includes('Assessment saved. Earlier assessments are preserved.')"),'A subsequent assessment did not save')
  await navigate(`/goals?goal=${savedPlan.id}&assessment=${savedPlan.assessmentId}&action=${savedPlan.actionId}`,'QA weekly baseline')
  await click('Record action and measured results')
  await until(()=>evaluate("document.body.innerText.includes('Weekly goal: QA weekly baseline')"),'Plan context was lost when opening results')
  const selectedAction = await evaluate("Object.fromEntries([...document.querySelectorAll('label')].filter(label=>['Related assessment','Completed recommended action'].includes(label.firstElementChild?.textContent.trim())).map(label=>[label.firstElementChild.textContent.trim(),label.querySelector('select').value]))")
  if (selectedAction['Related assessment']!==savedPlan.assessmentId || selectedAction['Completed recommended action']!==savedPlan.actionId) throw new Error('Weekly plan results selected a different assessment or action')
  console.log('PASS Earlier weekly plan retains its selected action after a later reassessment')
  await fillLabel('Channel or business context', 'Local QA analytics review')
  await fillLabel('Completion notes (optional)', 'Synthetic QA completion record; no real customer activity.')
  await evaluate(`document.querySelector('input[type="checkbox"]').click()`)
  await click('Record completed business action')
  await until(() => evaluate(`document.body.innerText.includes('Completed business action recorded.') && document.body.innerText.includes('Measured count')`), 'Nonmarketing action could not be recorded without assets')
  await fillLabel('Measured count', '0')
  const outcomeParts = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]))
  const outcomeDate = `${outcomeParts.year}-${outcomeParts.month}-${outcomeParts.day}`
  await fillLabel('Period start', outcomeDate)
  await fillLabel('Period end (inclusive)', outcomeDate)
  await fillLabel('Source description', 'Local QA manually entered result')
  await click('Save measured result')
  await until(() => evaluate(`document.body.innerText.includes('Result saved and added') && document.body.innerText.includes('Measured outcomes')`), 'Measured zero result did not save')
  await expectEnglish('Completed business action and manual zero result without generated assets')
  await screenshot('results-desktop')
  await command('Page.reload', { ignoreCache: true })
  await until(() => evaluate(`document.body.innerText.includes('Measured outcomes') && document.body.innerText.includes('Local QA manually entered result')`), 'Reload did not preserve completed action and results')
  console.log('PASS persisted completed business action and manual result after reload')
  await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await navigate('/goals','QA weekly baseline')
  await expectEnglish('Mobile weekly execution plan')
  await screenshot('weekly-plan-mobile')
  await navigate('/explore?guide=cost-review','Practical guides for your next action')
  await expectEnglish('Mobile execution guides')
  await screenshot('guides-mobile')
  await navigate('/workspace#assessment', 'A practical way forward')
  await expectEnglish('Mobile assessment')
  await screenshot('assessment-mobile')
  await click('Explore your workspace')
  await click('Actions & outcomes')
  await until(()=>evaluate("location.hash==='#results'&&document.body.innerText.includes('What happened after the work?')"),'Mobile navigation did not reach outcomes')
  const beforeLocalCheck=await evaluate("fetch('/api/workspace').then(r=>r.json()).then(x=>JSON.stringify(x.workspace))")
  await navigate('/start?focus=profitability','What kind of business')
  await click('Cafe / bakery')
  await click('Continue')
  await until(()=>evaluate("document.body.innerText.includes('Where are you right now?')"),'Mobile check lost business selection')
  await click('Already operating')
  await click('See my first direction')
  await until(()=>evaluate("document.body.innerText.includes('What is actually left after the costs of a sale?')"),'Mobile profitability direction did not render')
  await click('Make this more specific with my numbers')
  await fillLabel('Revenue','0')
  await fillLabel('Operating costs','25.50')
  await fillLabel('Reporting period start','2026-01-01')
  await fillLabel('Reporting period end','2026-01-07')
  await fillLabel('Where did these numbers come from?','Local QA sample ledger entered manually')
  await click('Update my direction')
  await until(()=>evaluate("document.body.innerText.includes('Your direction now includes these measurements.')&&document.body.innerText.includes('25.50')&&document.body.innerText.includes('Start with what each sale leaves behind.')"),'Optional first-check measurements did not affect the direction')
  const afterLocalCheck=await evaluate("fetch('/api/workspace').then(r=>r.json()).then(x=>JSON.stringify(x.workspace))")
  if(beforeLocalCheck!==afterLocalCheck)throw new Error('Unsaved first-check answers changed account records')
  await expectEnglish('Mobile first check with real source, measured zero, and no silent account writes')
  await screenshot('first-direction-mobile')
  await command('Page.reload',{ignoreCache:true})
  await until(()=>evaluate("document.body.innerText.includes('Start with what each sale leaves behind.')&&document.body.innerText.includes('25.50')"),'A concern link lost its saved first direction after reload')
  await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'dark'},{name:'prefers-reduced-motion',value:'reduce'}]})
  await until(()=>evaluate("document.documentElement.classList.contains('dark')"),'Dark color preference was not applied')
  await expectEnglish('Dark theme and reduced-motion first check')
  await screenshot('first-direction-mobile-dark')
  await command('Emulation.setEmulatedMedia',{features:[{name:'prefers-color-scheme',value:'light'}]})
  await navigate('/', 'From big questions')
  await expectEnglish('Mobile landing')
  await screenshot('landing-mobile')
  await navigate('/workspace', 'QA Design Studio')
  await click('Log out')
  await until(() => evaluate(`document.body.innerText.includes('Find your next move.')`), 'Logout did not clear the active session UI')
  await navigate('/login', 'Welcome back')
  await fillSelector('input[type="email"]', email)
  await fillSelector('input[type="password"]', password)
  await click('Log in')
  await until(() => evaluate(`location.pathname==='/workspace' && document.body.innerText.includes('QA Design Studio')`), 'Saved account login failed')
  await expectEnglish('Returning account login and persisted workspace')
  }
  await sleep(500)
  if (runtimeErrors.length) throw new Error(`Browser runtime errors: ${runtimeErrors.join('\n')}`)
  console.log(`PASS browser smoke complete; screenshots: ${artifactDirectory}`)
} catch (error) {
  console.error(`FAIL ${error.message}`)
  await writeFile(resolve(artifactDirectory, 'chrome-stderr.log'), browserError)
  if (socket?.readyState === WebSocket.OPEN) {
    try { await screenshot('failure'); console.error(await evaluate('document.body.innerText.slice(0,2000)')) } catch { /* browser unavailable */ }
  }
  process.exitCode = 1
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    try { await Promise.race([command('Browser.close'), sleep(2000)]) } catch { /* process may already be closed */ }
    socket.close()
  }
  for (const request of pending.values()) clearTimeout(request.timer)
  browser.kill()
}
