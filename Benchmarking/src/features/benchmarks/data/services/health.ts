/**
 * Backend/database health probe.
 *
 * The endpoint lives at the server root (`/health`), *outside* the `/api/v1`
 * namespace that `AiClient` is bound to, so this uses `fetch` directly rather
 * than the shared client. (`AiClient` always prefixes `baseUrl` = `/api/v1/`.)
 */
export type HealthStatus = {
  /** Overall service status, e.g. "healthy". */
  status: string
  /** Database connectivity, e.g. "ok". */
  database: string
}

export const getHealth = async (): Promise<HealthStatus> => {
  const res = await fetch('/health', { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return (await res.json()) as HealthStatus
}
