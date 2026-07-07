const extractStringField = (
  value: unknown,
  field: 'message' | 'detail' | 'error',
): string | null => {
  if (typeof value !== 'object' || value === null || !(field in value)) return null
  const record = value as Record<typeof field, unknown>
  return typeof record[field] === 'string' ? record[field] : null
}

export class ApiError extends Error {
  readonly status: number | null
  readonly detail: unknown
  readonly requestId: string | null

  constructor(message: string, status: number | null, detail?: unknown, requestId?: string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail ?? null
    this.requestId = requestId ?? null
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export async function parseApiError(response: Response): Promise<ApiError> {
  const requestId = response.headers.get('X-Request-ID')

  let detail: unknown = null
  try {
    detail = await response.clone().json()
  } catch {
    const text = await response.text()
    detail = text.length > 0 ? text : null
  }

  const message =
    extractStringField(detail, 'message') ??
    extractStringField(detail, 'detail') ??
    extractStringField(detail, 'error') ??
    (typeof detail === 'string' && detail.length > 0
      ? detail
      : `Request failed: ${response.status} ${response.statusText}`)

  return new ApiError(message, response.status, detail, requestId)
}
