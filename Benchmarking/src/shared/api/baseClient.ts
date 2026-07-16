import { createApiClient } from './core'
import { API_ORIGIN } from './config'

/**
 * Single shared HTTP client for the Benchmarks app.
 * All services must import this instance — never create a second client.
 */
export const AiClient = createApiClient({
  baseUrl: `${API_ORIGIN}/api/v1/`,
  defaultTimeout: 60_000,
  getAuthToken: () => null,
})
