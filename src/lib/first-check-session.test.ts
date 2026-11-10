import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest'
import { clearFirstCheck,readFirstCheck,readFirstCheckStep,storeFirstCheck } from './first-check-session'
import type { FirstCheck } from './business/first-check'

const check:FirstCheck={version:1,id:'local-check-12345',focus:'conversion',businessType:'ecommerce',stage:'not_sure',offering:'',timeZone:'America/New_York',evidence:[]}
beforeEach(()=>{const values=new Map<string,string>();vi.stubGlobal('sessionStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)})})
afterEach(()=>vi.unstubAllGlobals())
describe('first check resumption',()=>{
  it('resumes an incomplete step and preserves it when the check is handed off',()=>{
    expect(storeFirstCheck(check,1)).toBe(true)
    expect(readFirstCheckStep(readFirstCheck()!)).toBe(1)
    storeFirstCheck({...check,businessType:'services'})
    expect(readFirstCheckStep(readFirstCheck()!)).toBe(1)
    storeFirstCheck(check,3)
    expect(readFirstCheckStep(readFirstCheck()!)).toBe(3)
  })
  it('clears progress with the check and keeps older saved checks readable',()=>{
    storeFirstCheck(check)
    expect(readFirstCheckStep(check)).toBe(3)
    clearFirstCheck()
    expect(readFirstCheck()).toBeNull()
    expect(sessionStorage.getItem('nexora-first-check-progress-v1')).toBeNull()
  })
})
