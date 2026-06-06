export const DEFAULT_OPENROUTER_MODEL = 'openrouter/google/gemini-2.5-flash'

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL
}

export function assertOpenRouterApiKey(): void {
  if (!process.env.OPENROUTER_API_KEY?.trim()) {
    throw new Error('OPENROUTER_API_KEY is not configured.')
  }
}

export function isStructuredOutputCompatibilityError(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error)

  return (
    message.includes('response_format') ||
    message.includes('structured output') ||
    message.includes('schema')
  )
}
