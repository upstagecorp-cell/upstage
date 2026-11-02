export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export function invalid(message: string): never {
  throw new HttpError(400, 'INVALID_INPUT', message)
}

export function objectInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('Enter a valid request.')
  return value as Record<string, unknown>
}

export function textInput(value: unknown, label: string, max = 500, required = true): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    invalid(`Enter a valid ${label}.`)
  }
  return value.trim()
}

export function versionInput(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) invalid('Select a valid asset version.')
  return value as number
}
