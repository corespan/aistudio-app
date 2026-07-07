import { z } from 'zod'

/**
 * Single source of truth for what a valid Start Benchmark submission looks
 * like. `config` is a record because its keys are only known once a model's
 * /models/config response arrives — every present key must be non-blank per
 * the confirmed backend contract (no config field is optional).
 */
export const startBenchmarkSchema = z.object({
  nodeIp: z.string().min(1, 'Node IP is required'),
  model: z.string().min(1, 'Model is required'),
  config: z.record(z.string(), z.string().min(1, 'This field is required')),
})

export type StartBenchmarkFormValues = z.infer<typeof startBenchmarkSchema>
