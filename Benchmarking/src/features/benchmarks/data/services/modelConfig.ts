import { AiClient } from '@/shared/api/baseClient'

// Resolves to /api/v1/models/config?node_ip=<nodeIp>&model=<model> (proxied to
// VITE_API_URL). Response shape is normalized by its consumers, so it stays
// `unknown` here.
export const getModelConfig = (nodeIp: string, model: string) =>
  AiClient.get<unknown>('models/config', { params: { node_ip: nodeIp, model } })
