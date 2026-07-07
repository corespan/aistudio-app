import { AiClient } from '@/shared/api/baseClient'

export type LaunchJupyterPayload = {
  node_ip: string
}

// POST /api/v1/jupyter/launch (proxied to VITE_API_URL).
export const launchJupyter = (payload: LaunchJupyterPayload) =>
  AiClient.post<unknown>('jupyter/launch', payload)
