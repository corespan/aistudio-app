import { API_ORIGIN } from '@/shared/api/config'
import type { HealthStatus } from '../../types'

export const getHealth = async (): Promise<HealthStatus> => {
  const res = await fetch(`${API_ORIGIN}/health`, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return (await res.json()) as HealthStatus
}
