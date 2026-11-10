import { parseFirstCheck, type FirstCheck } from './business/first-check'

const key='nexora-first-check-v1'
const progressKey='nexora-first-check-progress-v1'
export function readFirstCheck():FirstCheck|null {
  try { const raw=sessionStorage.getItem(key);return raw?parseFirstCheck(JSON.parse(raw)):null } catch { return null }
}
export function storeFirstCheck(check:FirstCheck,step?:number):boolean {
  try { sessionStorage.setItem(key,JSON.stringify(check));if(step!==undefined)sessionStorage.setItem(progressKey,JSON.stringify({id:check.id,step}));return true } catch { return false }
}
export function readFirstCheckStep(check:FirstCheck):number {
  try{const progress=JSON.parse(sessionStorage.getItem(progressKey)??'null');return progress?.id===check.id&&Number.isInteger(progress.step)&&progress.step>=0&&progress.step<=3?progress.step:3}catch{return 3}
}
export function clearFirstCheck() {
  try { sessionStorage.removeItem(key);sessionStorage.removeItem(progressKey) } catch { /* Account data is independent of tab storage. */ }
}
