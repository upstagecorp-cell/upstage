import { HttpError } from './errors'

export interface TokenUsage { inputTokens: number | null; outputTokens: number | null; estimated: boolean }
export class ProviderError extends HttpError {
  constructor(status: number, code: string, message: string, public usage: TokenUsage = { inputTokens: null, outputTokens: null, estimated: true }) {
    super(status, code, message)
  }
}

export type AIProvider = 'google' | 'openai'

export function boundedConfig(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback
}

/** Explicit provider selection is preferred; legacy OPENAI_* variables remain compatible. */
export function activeProvider(): AIProvider {
  const selected = process.env.AI_PROVIDER?.trim().toLowerCase()
  if (selected === 'google' || selected === 'gemini') return 'google'
  if (selected === 'openai') return 'openai'
  return 'openai'
}

function credentials(provider: AIProvider): { key: string; model: string } {
  if (provider === 'google') return {
    key: process.env.AI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || '',
    model: process.env.AI_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash',
  }
  return {
    key: process.env.AI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || '',
    model: process.env.AI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || '',
  }
}

export function providerConfigured(): boolean {
  const { key, model } = credentials(activeProvider())
  return Boolean(key && model)
}

export function providerModel(): string {
  return credentials(activeProvider()).model || 'not-configured'
}

function usageFrom(input: unknown, output: unknown, estimated = false): TokenUsage {
  const token = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null
  const inputTokens = token(input), outputTokens = token(output)
  return { inputTokens, outputTokens, estimated: estimated || inputTokens === null || outputTokens === null }
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const reader = response.body?.getReader()
    if (!reader) throw new Error()
    const chunks: Uint8Array[] = []
    let bytes = 0
    while (true) {
      const next = await reader.read()
      if (next.done) break
      bytes += next.value.byteLength
      if (bytes > 1024 * 1024) { await reader.cancel(); throw new Error() }
      chunks.push(next.value)
    }
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    return parsed as Record<string, unknown>
  } catch {
    throw new ProviderError(502, 'PROVIDER_INVALID_RESPONSE', 'The provider returned an unreadable response. No assets were saved.')
  }
}

async function request(url: string, headers: Record<string, string>, body: Record<string, unknown>, timeout: number): Promise<Record<string, unknown>> {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout), redirect: 'error',
    })
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new ProviderError(504, 'PROVIDER_TIMEOUT', 'Generation timed out. The provider may have processed this request. Check the saved job before starting a new generation.')
    }
    throw new ProviderError(502, 'PROVIDER_UNAVAILABLE', 'The provider could not be reached. The outcome is unknown; check the saved job before trying again.')
  }
  if (!response.ok) {
    await response.body?.cancel()
    throw new ProviderError(response.status === 429 ? 429 : 502, 'PROVIDER_FAILED', response.status === 429
      ? 'The text provider is busy or its quota is exhausted. Check the provider account before starting a new generation.'
      : 'The text provider could not complete this request. Check the provider configuration and start a new generation when ready.')
  }
  return readJson(response)
}

function openAIRequest(payload: Record<string, unknown>, model: string): Record<string, unknown> {
  return { ...payload, model, store: false, max_output_tokens: boundedConfig('AI_MAX_OUTPUT_TOKENS', boundedConfig('OPENAI_MAX_OUTPUT_TOKENS', 6000, 1000, 16000), 1000, 16000) }
}

function googleRequest(payload: Record<string, unknown>): Record<string, unknown> {
  const format = (payload.text as { format?: { schema?: unknown } } | undefined)?.format
  return {
    system_instruction: { parts: [{ text: String(payload.instructions ?? '') }] },
    contents: [{ role: 'user', parts: [{ text: String(payload.input ?? '') }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      ...(format?.schema ? { responseSchema: format.schema } : {}),
      maxOutputTokens: boundedConfig('AI_MAX_OUTPUT_TOKENS', boundedConfig('OPENAI_MAX_OUTPUT_TOKENS', 6000, 1000, 16000), 1000, 16000),
    },
  }
}

function extractOpenAI(result: Record<string, unknown>): { text: string; usage: TokenUsage } {
  const rawUsage = result.usage as Record<string, unknown> | undefined
  const usage = usageFrom(rawUsage?.input_tokens, rawUsage?.output_tokens)
  if (result.status !== 'completed' || !Array.isArray(result.output)) throw new ProviderError(502, 'PROVIDER_INCOMPLETE', 'The provider did not complete the package. No assets were saved.', usage)
  const texts: string[] = []
  for (const item of result.output) {
    if (!item || typeof item !== 'object' || !Array.isArray((item as Record<string, unknown>).content)) continue
    for (const part of (item as Record<string, unknown>).content as Array<Record<string, unknown>>) {
      if (part?.type === 'refusal') throw new ProviderError(502, 'PROVIDER_REFUSED', 'The provider could not create this package. Review the business information and request.', usage)
      if (part?.type === 'output_text' && typeof part.text === 'string') texts.push(part.text)
    }
  }
  return { text: texts.join(''), usage }
}

function extractGoogle(result: Record<string, unknown>): { text: string; usage: TokenUsage } {
  const candidates = Array.isArray(result.candidates) ? result.candidates : []
  const texts: string[] = []
  for (const candidate of candidates) {
    const content = candidate && typeof candidate === 'object' ? (candidate as Record<string, unknown>).content : null
    const parts = content && typeof content === 'object' ? (content as Record<string, unknown>).parts : null
    if (Array.isArray(parts)) for (const part of parts) if (part && typeof part === 'object' && typeof (part as Record<string, unknown>).text === 'string') texts.push((part as Record<string, string>).text)
  }
  if (!texts.length) throw new ProviderError(502, 'PROVIDER_INCOMPLETE', 'The provider did not return a usable package. No assets were saved.', usageFrom(null, null))
  const metadata = result.usageMetadata as Record<string, unknown> | undefined
  return { text: texts.join(''), usage: usageFrom(metadata?.promptTokenCount, metadata?.candidatesTokenCount) }
}

/** Provider-neutral structured generation. Each adapter normalizes to the same JSON result. */
export async function generateFromProvider(payload: Record<string, unknown>): Promise<{ value: unknown; usage: TokenUsage }> {
  const provider = activeProvider()
  const { key, model } = credentials(provider)
  if (!key || !model) throw new ProviderError(503, 'PROVIDER_NOT_CONFIGURED', provider === 'google'
    ? 'Text generation is not configured. Ask the operator to set AI_API_KEY and AI_MODEL for Google Gemini.'
    : 'Text generation is not configured. Ask the operator to set AI_API_KEY and AI_MODEL for the selected provider.')
  const timeout = boundedConfig('AI_TIMEOUT_MS', boundedConfig('OPENAI_TIMEOUT_MS', 60_000, 5000, 120_000), 5000, 120_000)
  const result = provider === 'google'
    ? await request(`${process.env.AI_BASE_URL?.trim() || 'https://generativelanguage.googleapis.com/v1beta/models'}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, { 'Content-Type': 'application/json' }, googleRequest(payload), timeout)
    : await request(process.env.AI_BASE_URL?.trim() || 'https://api.openai.com/v1/responses', { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, openAIRequest(payload, model), timeout)
  const extracted = provider === 'google' ? extractGoogle(result) : extractOpenAI(result)
  try { return { value: JSON.parse(extracted.text), usage: extracted.usage } }
  catch { throw new ProviderError(502, 'PROVIDER_INVALID_RESPONSE', 'The provider returned an invalid package. No assets were saved.', extracted.usage) }
}
