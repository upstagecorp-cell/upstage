import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve('.')
const directory = resolve('reviews/2026-11-11/launch-checklist')
const source = resolve(directory, 'launch-checklist.html')
const pdf = resolve('NEXORA_LAUNCH_CHECKLIST_2026-11-11.pdf')
const profile = resolve(`.qa/pdf-profile-${Date.now()}`)
const debugPort = 9237
await mkdir(profile, { recursive: true })
await mkdir(resolve(directory, 'previews'), { recursive: true })
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--disable-background-networking', '--disable-extensions',
  '--disable-sync', `--remote-debugging-port=${debugPort}`, '--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
let browserError = ''
browser.stderr.on('data', data => { browserError = (browserError + data).slice(-3000) })
let socket
let nextId = 0
const pending = new Map()
const sleep = ms => new Promise(done => setTimeout(done, ms))
async function until(check, label, timeout = 20000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try { const result = await check(); if (result) return result } catch {}
    await sleep(100)
  }
  throw new Error(label)
}
function command(method, params = {}) {
  return new Promise((done, reject) => {
    const id = ++nextId
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)) }, 20000)
    pending.set(id, { done: value => { clearTimeout(timer); done(value) }, reject: error => { clearTimeout(timer); reject(error) }, timer })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const value = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description || value.exceptionDetails.text)
  return value.result.value
}

try {
  const page = await until(async () => {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
    return (await response.json()).find(item => item.type === 'page')
  }, 'Chrome unavailable: ' + browserError)
  socket = new WebSocket(page.webSocketDebuggerUrl)
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.done(message.result)
  })
  await new Promise((done, reject) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  await command('Page.enable')
  await command('Runtime.enable')
  await command('Emulation.setDeviceMetricsOverride', { width: 1100, height: 1400, deviceScaleFactor: 1, mobile: false })
  await command('Page.navigate', { url: pathToFileURL(source).href })
  await until(() => evaluate("document.readyState === 'complete' && document.querySelectorAll('.page').length === 12"), 'Document did not load')
  await evaluate('document.fonts.ready.then(() => true)')
  const inspectLayout = `Array.from(document.querySelectorAll('.page')).map(page=>({page:Number(page.dataset.page),bodyBottom:Math.round(page.querySelector('.page-body').getBoundingClientRect().bottom-page.getBoundingClientRect().top),footerTop:Math.round(page.querySelector('.footer').getBoundingClientRect().top-page.getBoundingClientRect().top),overflow:page.scrollHeight>page.clientHeight+2,wide:page.scrollWidth>page.clientWidth+2}))`
  await command('Emulation.setEmulatedMedia', { media: 'print' })
  const layout = await evaluate(inspectLayout)
  const collisions = layout.filter(page => page.overflow || page.wide || page.bodyBottom > page.footerTop - 10)
  await writeFile(resolve(directory, 'layout-report.json'), JSON.stringify({ pages: layout, collisions }, null, 2))
  if (collisions.length) throw new Error('Content exceeds printable page: ' + JSON.stringify(collisions))
  const result = await command('Page.printToPDF', {
    printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false,
    generateTaggedPDF: true, generateDocumentOutline: true,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
  })
  await writeFile(pdf, Buffer.from(result.data, 'base64'))
  await command('Emulation.setEmulatedMedia', { media: 'screen' })
  for (const number of [1, 7, 9, 12]) {
    const rect = await evaluate(`(()=>{const rect=document.querySelector('[data-page="${number}"]').getBoundingClientRect();return {x:rect.left+scrollX,y:rect.top+scrollY,width:rect.width,height:rect.height,scale:1}})()`)
    const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: rect })
    await writeFile(resolve(directory, 'previews', `page-${number}.png`), Buffer.from(shot.data, 'base64'))
  }
  console.log(JSON.stringify({ pdf: pdf.slice(root.length + 1), pages: layout.length, overflow: collisions.length }))
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    try { await Promise.race([command('Browser.close'), sleep(1500)]) } catch {}
    socket.close()
  }
  for (const request of pending.values()) clearTimeout(request.timer)
  browser.kill()
}
