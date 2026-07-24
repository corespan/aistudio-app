import { AiClient } from '@/shared/api/baseClient'
import type { LaunchJupyterPayload } from '../../types'

export const launchJupyter = (payload: LaunchJupyterPayload) =>
  AiClient.post<unknown>('jupyter/launch', payload)
