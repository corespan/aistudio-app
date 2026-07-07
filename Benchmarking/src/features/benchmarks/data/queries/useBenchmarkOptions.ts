import { useQuery } from '@tanstack/react-query'
import { benchmarkOptionKeys } from '../keys'
import {
  getConcurrencies,
  getGpuTypes,
  getInputTokens,
  getModels,
  getNodes,
  getOutputTokens,
  getPrecisions,
} from '../services/benchmarkOptions'
import { toConcurrencyOptions, toNamedOptions, toNodeOptions } from '../selectors/toSelectOptions'

export const useNodes = () =>
  useQuery({
    queryKey: benchmarkOptionKeys.nodes(),
    queryFn: getNodes,
    select: toNodeOptions,
    meta: {
      errorNotification: {
        id: 'benchmark-nodes-error',
        title: 'Unable to load machines. Please try again.',
      },
    },
  })

export const useModels = () =>
  useQuery({
    queryKey: benchmarkOptionKeys.models(),
    queryFn: getModels,
    select: toNamedOptions,
    meta: {
      errorNotification: {
        id: 'benchmark-models-error',
        title: 'Unable to load models. Please try again.',
      },
    },
  })

export const useGpuTypes = () =>
  useQuery({
    queryKey: benchmarkOptionKeys.gpuTypes(),
    queryFn: getGpuTypes,
    select: toNamedOptions,
    meta: {
      errorNotification: {
        id: 'benchmark-gpu-types-error',
        title: 'Unable to load GPU types. Please try again.',
      },
    },
  })

export const useConcurrencies = () =>
  useQuery({
    queryKey: benchmarkOptionKeys.concurrencies(),
    queryFn: getConcurrencies,
    select: toConcurrencyOptions,
    meta: {
      errorNotification: {
        id: 'benchmark-concurrencies-error',
        title: 'Unable to load concurrency options. Please try again.',
      },
    },
  })

export const usePrecisions = () =>
  useQuery({
    queryKey: benchmarkOptionKeys.precisions(),
    queryFn: getPrecisions,
    select: toNamedOptions,
    meta: {
      errorNotification: {
        id: 'benchmark-precisions-error',
        title: 'Unable to load precisions. Please try again.',
      },
    },
  })

export const useOutputTokens = () =>
  useQuery({
    queryKey: benchmarkOptionKeys.outputTokens(),
    queryFn: getOutputTokens,
    select: toConcurrencyOptions,
    meta: {
      errorNotification: {
        id: 'benchmark-output-tokens-error',
        title: 'Unable to load output tokens. Please try again.',
      },
    },
  })

export const useInputTokens = () =>
  useQuery({
    queryKey: benchmarkOptionKeys.inputTokens(),
    queryFn: getInputTokens,
    select: toConcurrencyOptions,
    meta: {
      errorNotification: {
        id: 'benchmark-input-tokens-error',
        title: 'Unable to load input tokens. Please try again.',
      },
    },
  })
