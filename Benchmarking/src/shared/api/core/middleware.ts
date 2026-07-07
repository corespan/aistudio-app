import type { Middleware } from './types'

const combineSignals = (signals: AbortSignal[]): AbortSignal => AbortSignal.any(signals)

const createTimeoutSignal = (ms: number): AbortSignal => AbortSignal.timeout(ms)

// Injects Authorization: Bearer <token> header.
export function createAuthMiddleware(
  getToken: () => string | null | Promise<string | null>,
): Middleware {
  return async (config, next): Promise<Response> => {
    if (config.skipAuth === true) return next(config)

    const token = await getToken()
    if (token) {
      const headers = new Headers(config.headers)
      headers.set('Authorization', `Bearer ${token}`)
      config.headers = headers
    }

    return next(config)
  }
}
export function createTimeoutMiddleware(defaultTimeoutMs: number): Middleware {
  return async (config, next): Promise<Response> => {
    const timeoutMs = config.timeout ?? defaultTimeoutMs
    if (timeoutMs <= 0) return next(config)

    const timeoutSignal = createTimeoutSignal(timeoutMs)
    config.__timeoutSignal = timeoutSignal
    config.signal = config.signal ? combineSignals([config.signal, timeoutSignal]) : timeoutSignal

    return next(config)
  }
}

// Attaches a unique X-Request-ID header for server-side log correlation.
export function createRequestIdMiddleware(): Middleware {
  return async (config, next): Promise<Response> => {
    const headers = new Headers(config.headers)
    headers.set('X-Request-ID', crypto.randomUUID())
    config.headers = headers
    return next(config)
  }
}
