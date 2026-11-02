import { HttpError } from './errors'

export interface TokenUsage { inputTokens: number | null; outputTokens: number | null; estimated: boolean }
export class ProviderError extends HttpError {
  constructor(status: number, code: string, message: string, public usage: TokenUsage = { inputTokens: null, outputTokens: null, estimated: true }) {
    super(status, code, message)
  }
}

export function boundedConfig(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback
}

/** No tools or URL fetches are offered. Timeouts and ambiguous failures are never retried. */
export async function generateFromProvider(payload: Record<string, unknown>): Promise<{ value: unknown; usage: TokenUsage }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_MODEL?.trim()
  if (!apiKey || !model) throw new ProviderError(503, 'PROVIDER_NOT_CONFIGURED', 'Text generation is not configured. Ask the operator to set OPENAI_API_KEY and OPENAI_MODEL.')
  const timeout = boundedConfig('OPENAI_TIMEOUT_MS', 60_000, 5000, 120_000)
  let response: Response
  try {
    // Zero automatic retries avoids charging twice after an unknown provider outcome.
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, model, store: false, max_output_tokens: boundedConfig('OPENAI_MAX_OUTPUT_TOKENS', 6000, 1000, 16000) }),
      signal: AbortSignal.timeout(timeout),
      redirect: 'error',
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
  let value: unknown
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
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new ProviderError(502, 'PROVIDER_INVALID_RESPONSE', 'The provider returned an unreadable response. No assets were saved.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ProviderError(502, 'PROVIDER_INVALID_RESPONSE', 'The provider returned an invalid response. No assets were saved.')
  }
  const result = value as Record<string, unknown>
  const rawUsage = result.usage as Record<string, unknown> | undefined
  const token = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null
  const inputTokens = token(rawUsage?.input_tokens)
  const outputTokens = token(rawUsage?.output_tokens)
  const usage = { inputTokens, outputTokens, estimated: inputTokens === null || outputTokens === null }
  if (result.status !== 'completed' || !Array.isArray(result.output)) {
    throw new ProviderError(502, 'PROVIDER_INCOMPLETE', 'The provider did not complete the package. No assets were saved.', usage)
  }
  const texts: string[] = []
  for (const item of result.output) {
    if (!item || typeof item !== 'object' || !Array.isArray(item.content)) continue
    for (const part of item.content) {
      if (part?.type === 'refusal') throw new ProviderError(502, 'PROVIDER_REFUSED', 'The provider could not create this package. Review the business information and request.', usage)
      if (part?.type === 'output_text' && typeof part.text === 'string') texts.push(part.text)
    }
  }
  try { return { value: JSON.parse(texts.join('')), usage } }
  catch { throw new ProviderError(502, 'PROVIDER_INVALID_RESPONSE', 'The provider returned an invalid package. No assets were saved.', usage) }
}
