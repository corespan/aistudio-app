export type QueryParams = Record<string, string | number | boolean | null | undefined>

export type RequestConfig = RequestInit & {
  params?: QueryParams
  signal?: AbortSignal
  timeout?: number
  skipAuth?: boolean
}

export type InternalRequestConfig = RequestConfig & {
  url: string
  __timeoutSignal?: AbortSignal
}

export type Handler = (config: InternalRequestConfig) => Promise<Response>

export type Middleware = (config: InternalRequestConfig, next: Handler) => Promise<Response>

export type ApiClientConfig = {
  baseUrl: string
  middlewares?: Middleware[]
  defaultHeaders?: Record<string, string>
  defaultTimeout?: number
  getAuthToken?: () => string | null | Promise<string | null>
}

export type ApiClient = {
  get: <T>(url: string, options?: RequestConfig) => Promise<T>
  post: <T>(url: string, body: unknown, options?: RequestConfig) => Promise<T>
  patch: <T>(url: string, body: unknown, options?: RequestConfig) => Promise<T>
  put: <T>(url: string, body: unknown, options?: RequestConfig) => Promise<T>
  delete: <T>(url: string, options?: RequestConfig) => Promise<T>
  request: <T>(url: string, options?: RequestConfig) => Promise<T>
}
