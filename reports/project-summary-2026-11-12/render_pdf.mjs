import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const directory = resolve('reports/project-summary-2026-11-12')
const profile = resolve(`.qa/project-report-pdf-${Date.now()}`)
const port = 9376
await mkdir(profile, { recursive: true })
await mkdir(resolve(directory, 'previews'), { recursive: true })
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--no-sandbox', '--disable-gpu', '--no-first-run',
  '--no-default-browser-check', '--disable-background-networking', '--disable-extensions',
  '--disable-sync', `--remote-debugging-port=${port}`, '--remote-debugging-address=127.0.0.1',
  `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
let diagnostic = ''
browser.stderr.on('data', data => { diagnostic = (diagnostic + data).slice(-2000) })
let socket
let sequence = 0
const pending = new Map()
const sleep = ms => new Promise(done => setTimeout(done, ms))
async function until(check, label, timeout = 20000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try { const value = await check(); if (value) return value } catch { /* Startup may race. */ }
    await sleep(100)
  }
  throw new Error(label + diagnostic)
}
function command(method, params = {}) {
  return new Promise((done, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)) }, 25000)
    pending.set(id, { done: value => { clearTimeout(timer); done(value) }, reject: error => { clearTimeout(timer); reject(error) }, timer })
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
  return result.result.value
}
try {
  const page = await until(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/json/list`)
    return (await response.json()).find(item => item.type === 'page')
  }, 'Chrome startup failed: ')
  socket = new WebSocket(page.webSocketDebuggerUrl)
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    const request = pending.get(message.id)
    if (!request) return
    pending.delete(message.id)
    if (message.error) request.reject(new Error(message.error.message))
    else request.done(message.result)
  })
  await new Promise((done, reject) => {
    socket.addEventListener('open', done, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  await command('Page.enable')
  await command('Runtime.enable')
  await command('Emulation.setDeviceMetricsOverride', { width: 1100, height: 1400, deviceScaleFactor: 1, mobile: false })
  await command('Page.navigate', { url: pathToFileURL(resolve(directory, 'NEXORA_PROJECT_REPORT_2026-11-12.html')).href })
  await until(() => evaluate("document.readyState === 'complete' && document.querySelectorAll('.page').length > 30"), 'Report did not load: ')
  await evaluate('document.fonts.ready.then(() => true)')
  await command('Emulation.setEmulatedMedia', { media: 'print' })
  const layout = await evaluate(`Array.from(document.querySelectorAll('.page')).map(page=>{const body=page.querySelector('.page-body');const rect=page.getBoundingClientRect();return {page:Number(page.dataset.page),title:page.dataset.title,overflowY:body.scrollHeight>body.clientHeight+2,overflowX:body.scrollWidth>body.clientWidth+2,bodyHeight:body.clientHeight,contentHeight:body.scrollHeight,pageHeight:Math.round(rect.height)}})`)
  const collisions = layout.filter(page => page.overflowX || page.overflowY)
  const images = await evaluate(`Array.from(document.images).map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0}))`)
  await writeFile(resolve(directory, 'verification', 'layout-report.json'), JSON.stringify({ pages: layout, collisions, images }, null, 2))
  if (collisions.length || images.some(img => !img.loaded)) throw new Error('Report layout failed: ' + JSON.stringify({ collisions, images }))
  const result = await command('Page.printToPDF', {
    printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false,
    generateTaggedPDF: true, generateDocumentOutline: true,
    marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
  })
  const pdf = resolve(directory, 'NEXORA_PROJECT_REPORT_2026-11-12.pdf')
  await writeFile(pdf, Buffer.from(result.data, 'base64'))
  await command('Emulation.setEmulatedMedia', { media: 'screen' })
  for (const number of [1, 2, 4, 6, 15, 18, 25, 26, 30, 32, 35, 36, 42, 43, 45, 47, layout.length]) {
    const clip = await evaluate(`(()=>{const rect=document.querySelector('[data-page="${number}"]').getBoundingClientRect();return {x:rect.left+scrollX,y:rect.top+scrollY,width:rect.width,height:rect.height,scale:1}})()`)
    const screenshot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip })
    await writeFile(resolve(directory, 'previews', `page-${String(number).padStart(2, '0')}.png`), Buffer.from(screenshot.data, 'base64'))
  }
  console.log(JSON.stringify({ pdf, pages: layout.length, collisions: collisions.length, images: images.length }))
} finally {
  if (socket?.readyState === WebSocket.OPEN) {
    try { await Promise.race([command('Browser.close'), sleep(1500)]) } catch { /* Browser may close the socket first. */ }
    socket.close()
  }
  for (const item of pending.values()) clearTimeout(item.timer)
  browser.kill()
}
