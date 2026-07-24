import { AiClient } from '@/shared/api/baseClient'

export const getModelConfig = (nodeIp: string, model: string) =>
  AiClient.get<unknown>('models/config', { params: { node_ip: nodeIp, model } })
