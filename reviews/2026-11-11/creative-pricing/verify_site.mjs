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
const artifactDirectory = resolve('reviews/2026-11-11/creative-pricing/screenshots')
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
  await until(async()=>{const response=await fetch(`${baseUrl}/api/session`);return response.ok},'Local server unavailable',35000)
  const page=await until(async()=>{const response=await fetch(`http://127.0.0.1:${debugPort}/json/list`);return (await response.json()).find(item=>item.type==='page')},'Chrome unavailable')
  socket=new WebSocket(page.webSocketDebuggerUrl)
  socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.method==='Runtime.exceptionThrown')runtimeErrors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);if(!message.id)return;const request=pending.get(message.id);if(!request)return;pending.delete(message.id);if(message.error)request.reject(new Error(message.error.message));else request.resolve(message.result)})
  await new Promise((done,reject)=>{socket.addEventListener('open',done,{once:true});socket.addEventListener('error',reject,{once:true})})
  await command('Page.enable');await command('Runtime.enable')
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false})
  await navigate('/pricing','A month of creative.')
  const pricing=await evaluate(`({text:document.body.innerText,disabled:document.querySelectorAll('.nx-price-card button:disabled').length,cards:document.querySelectorAll('.nx-price-card').length})`)
  for(const text of ['$79','$149','80 new ad images','160 new ad images','16 finished short videos','32 finished short videos','60s total','120s total','not available for purchase'])if(!pricing.text.includes(text))throw new Error('Pricing detail missing: '+text)
  if(pricing.text.includes('$299')||pricing.disabled!==2||pricing.cards!==3)throw new Error('Old pricing or available paid checkout remains')
  await evaluate("document.querySelector('.nx-price-grid').scrollIntoView({behavior:'instant',block:'start'});window.scrollBy(0,-100)")
  await screenshot('pricing-desktop')
  await click('How are finished videos different from AI scene seconds?')
  if(!await evaluate("[...document.querySelectorAll('details[open]')].some(item=>item.innerText.includes('reuse a scene'))"))throw new Error('Allowance FAQ failed')
  for(const [path,text] of [['/','From big questions'],['/product','One workspace.'],['/guide','Your work has'],['/terms','Terms & refund policy'],['/pricing','A month of creative.']]){
    await navigate(path,text)
    if(path==='/'){
      if(!await evaluate("document.querySelector('.nx-platform-pricing-band').innerText.includes('$79')&&document.querySelector('.nx-platform-pricing-band').innerText.includes('16 short videos')"))throw new Error('Home pricing did not update')
      await evaluate("document.querySelector('.nx-creative-overview').scrollIntoView({behavior:'instant',block:'start'})");await screenshot('creative-overview-desktop')
    }
    if(path==='/terms'&&!await evaluate("document.body.innerText.includes('$79/month')&&!document.body.innerText.includes('$299')"))throw new Error('Terms disagree with creative offer')
    for(const width of [320,390,768,1024,1440]){
      await command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<700});await sleep(80)
      await expectEnglish(path+' at '+width)
    }
  }
  await command('Emulation.setDeviceMetricsOverride',{width:390,height:1100,deviceScaleFactor:1,mobile:true})
  await navigate('/pricing','A month of creative.')
  await evaluate("document.querySelector('.nx-price-grid article:nth-child(2)').scrollIntoView({behavior:'instant',block:'start'});window.scrollBy(0,-100)")
  await screenshot('pricing-mobile')
  const session=await evaluate(`(async()=>{const response=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'creative-qa-'+Date.now()+'@example.invalid',password:'Creative-fixture-password-12345'})});return {status:response.status}})()`)
  if(session.status!==200)throw new Error('Isolated account creation failed '+session.status)
  const checkout=await evaluate(`(async()=>{const response=await fetch('/api/billing/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:'focus'})});return {status:response.status,body:await response.json()}})()`)
  if(checkout.status!==503||!JSON.stringify(checkout.body).includes('BILLING_UNAVAILABLE'))throw new Error('Preview checkout was not closed')
  await navigate('/workspace#billing','Plan & billing.')
  await expectEnglish('Workspace billing preview')
  if(!await evaluate("document.body.innerText.includes('$79')&&document.querySelectorAll('.nx-price-card button:disabled').length===2"))throw new Error('Workspace pricing differs')
  await screenshot('billing-mobile')
  const financialUrl='file:///'+resolve('reviews/2026-11-11/creative-pricing/unit-economics.html').split(String.fromCharCode(92)).join('/')
  await command('Page.navigate',{url:financialUrl})
  await until(()=>evaluate("!!document.getElementById('take-home')&&document.getElementById('take-home').innerText.includes('24,102,905')"),'Offline model failed')
  const parity=await evaluate(`(()=>{const errors=[];for(const row of REPORT.scenarios){const actual=calculate(row.customers,REPORT.scenario_settings[row.scenario]);if(Math.abs(actual.takeHome-row.personal_take_home_krw)>.01||Math.abs(actual.annual-row.annualized_net_revenue_krw)>.01)errors.push(row.scenario)}return errors})()`)
  if(parity.length)throw new Error('Python/JS model mismatch '+parity.join(','))
  await command('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false})
  await screenshot('unit-economics-desktop')
  await evaluate("document.getElementById('scenario').value='personal_reserve_45pct';document.getElementById('scenario').dispatchEvent(new Event('change'));document.getElementById('minimum').click()")
  if(!await evaluate("document.getElementById('count').value==='716'&&document.getElementById('income-state').className==='ok'"))throw new Error('Model scenario controls failed')
  for(const width of [320,390,768,1440]){await command('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<700});if(await evaluate('document.documentElement.scrollWidth>innerWidth+2'))throw new Error('Offline report overflow '+width)}
  if(runtimeErrors.length)throw new Error('Browser exceptions: '+runtimeErrors.join('\n'))
  await writeFile(resolve(artifactDirectory,'../browser-results.json'),JSON.stringify({status:'passed',routes:['/','/pricing','/product','/guide','/terms','/workspace#billing'],widths:[320,390,768,1024,1440],checkoutStatus:checkout.status,modelParityScenarios:9,errors:runtimeErrors},null,2))
  console.log('PASS updated pricing and scope, monthly allowances, FAQ, homepage and workspace consistency, checkout closure, responsive layouts, and nine Python/JS financial scenarios')
} catch(error){
  console.error('FAIL '+error.message);process.exitCode=1
  if(socket?.readyState===WebSocket.OPEN)try{await screenshot('failure');console.error(await evaluate('document.body.innerText.slice(0,1500)'))}catch{}
} finally {
  if(socket?.readyState===WebSocket.OPEN){try{await Promise.race([command('Browser.close'),sleep(2000)])}catch{}socket.close()}
  for(const request of pending.values())clearTimeout(request.timer)
  browser.kill()
}
