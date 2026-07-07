import { useQuery } from '@tanstack/react-query'
import { benchmarkOptionKeys } from '../keys'
import { getModelConfig } from '../services/modelConfig'

/**
 * Fetches /api/v1/models/config for one model on one node. Disabled until
 * both the node and the model have been selected, so the call fires only once
 * there's enough information to scope the config correctly.
 */
export const useModelConfig = (nodeIp: string | null, model: string | null) =>
  useQuery({
    queryKey: benchmarkOptionKeys.modelConfig(nodeIp ?? '', model ?? ''),
    queryFn: () => getModelConfig(nodeIp!, model!),
    enabled: !!nodeIp && !!model,
    meta: {
      errorNotification: {
        id: 'benchmark-model-config-error',
        title: 'Unable to load model configuration. Please try again.',
      },
    },
  })
