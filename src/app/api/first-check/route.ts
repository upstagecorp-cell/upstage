import { requireUser } from '@/lib/server/auth'
import { json, readJson, route } from '@/lib/server/http'
import { saveFirstCheck } from '@/lib/server/first-check'
export const runtime='nodejs'
export function POST(request:Request) {
  return route(async()=>{
    const user=requireUser(request)
    return json({workspace:saveFirstCheck(user.id,await readJson(request))})
  })
}
