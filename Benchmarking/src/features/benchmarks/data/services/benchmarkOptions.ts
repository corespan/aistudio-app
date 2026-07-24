import { AiClient } from '@/shared/api/baseClient'
import type { QueryParams } from '@/shared/api/core'

export const getNodes = () => AiClient.get<unknown>('nodes')

export const getBenchmarks = (params?: QueryParams) =>
  AiClient.get<unknown>('benchmarks', { params })

export const getModels = () => AiClient.get<unknown>('models')

export const getGpuTypes = () => AiClient.get<unknown>('gpu-types')

export const getConcurrencies = () => AiClient.get<unknown>('concurrencies')

export const getPrecisions = () => AiClient.get<unknown>('precisions')

export const getOutputTokens = () => AiClient.get<unknown>('output-tokens')

export const getInputTokens = () => AiClient.get<unknown>('input-tokens')
