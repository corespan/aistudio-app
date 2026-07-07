import { parseApiError } from './errors'
import {
  createAuthMiddleware,
  createRequestIdMiddleware,
  createTimeoutMiddleware,
} from './middleware'
import type { ApiClient, ApiClientConfig, Handler, Middleware, RequestConfig } from './types'

const isFormData = (body: unknown): body is FormData =>
  typeof FormData !== 'undefined' && body instanceof FormData

const serialize = (body: unknown): BodyInit => (isFormData(body) ? body : JSON.stringify(body))

const withParams = (url: string, params?: RequestConfig['params']): string => {
  if (!params) return url
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)]),
  ).toString()
  return qs ? `${url}${url.includes('?') ? '&' : '?'}${qs}` : url
}

// Middleware chain
function applyMiddlewares(middlewares: Middleware[], core: Handler): Handler {
  return middlewares.reduceRight<Handler>((next, mw) => (cfg) => mw(cfg, next), core)
}

// Core fetch handler
function coreHandler(config: ApiClientConfig, baseUrl: string): Handler {
  return async (req) => {
    const { url, params, body, headers: extraHeaders, method, ...rest } = req

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(config.defaultHeaders ?? {}),
    })
    new Headers(extraHeaders).forEach((v, k) => headers.set(k, v))
    if (isFormData(body)) headers.delete('Content-Type')

    return fetch(withParams(`${baseUrl}/${url.replace(/^\//, '')}`, params), {
      ...rest,
      method,
      headers,
      body: body as BodyInit | undefined,
    })
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return null as T
  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json') || ct.includes('application/problem+json'))
    return res.json() as Promise<T>
  if (ct.startsWith('text/')) return res.text() as Promise<T>
  const text = await res.text()
  try {
    return JSON.parse(text) as T
  } catch {
    return text as T
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const baseUrl = config.baseUrl.replace(/\/$/, '')

  const middlewares: Middleware[] = [
    createRequestIdMiddleware(),
    createTimeoutMiddleware(config.defaultTimeout ?? 60_000),
    createAuthMiddleware(config.getAuthToken ?? (() => null)),
    ...(config.middlewares ?? []),
  ]

  const run = applyMiddlewares(middlewares, coreHandler(config, baseUrl))

  async function request<T>(url: string, options: RequestConfig = {}): Promise<T> {
    const res = await run({ ...options, url, method: options.method ?? 'GET' })
    if (!res.ok) throw await parseApiError(res)
    return parseResponse<T>(res)
  }

  return {
    request,
    get: <T>(url: string, opts?: RequestConfig) => request<T>(url, { ...opts, method: 'GET' }),
    post: <T>(url: string, body: unknown, opts?: RequestConfig) =>
      request<T>(url, { ...opts, method: 'POST', body: serialize(body) }),
    patch: <T>(url: string, body: unknown, opts?: RequestConfig) =>
      request<T>(url, { ...opts, method: 'PATCH', body: serialize(body) }),
    put: <T>(url: string, body: unknown, opts?: RequestConfig) =>
      request<T>(url, { ...opts, method: 'PUT', body: serialize(body) }),
    delete: <T>(url: string, opts?: RequestConfig) =>
      request<T>(url, { ...opts, method: 'DELETE' }),
  }
}
