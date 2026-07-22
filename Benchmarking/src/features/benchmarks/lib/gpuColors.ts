const GPU_PALETTE = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#ef4444',
  '#84cc16',
]

export const normalizeGpuType = (gpuType: string | null | undefined): string | undefined => {
  const v = (gpuType ?? '').trim()
  if (!v) return undefined
  if (v.toLowerCase() === 'unknown') return undefined
  return v
}

const hashString = (value: string) => {
  let hash = 5381
  for (let i = 0; i < value.length; i++) hash = (hash * 33) ^ value.charCodeAt(i)
  return hash >>> 0
}

export const colorForGpuType = (gpuType: string) => {
  const idx = hashString(gpuType) % GPU_PALETTE.length
  return GPU_PALETTE[idx]
}
