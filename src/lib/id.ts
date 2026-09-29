export function createId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `${prefix}_${uuid}`

  const fallback = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`
  return `${prefix}_${fallback}`
}
