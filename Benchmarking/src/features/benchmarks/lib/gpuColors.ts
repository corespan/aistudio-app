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

// Values that mean "no real GPU type" even though they're non-empty strings —
// "unknown" from the API, "nan"/"undefined"/"null" from a bad field that got
// stringified upstream (e.g. `String(NaN)`), and "—" — the placeholder
// `toBenchmarkRows` itself falls back to for a missing `gpu_type`. Without
// that last one, every run with no GPU type was passing through here as a
// real, valid GPU series literally named "—".
const NON_VALUES = new Set(['unknown', 'nan', 'undefined', 'null', '—'])

export const normalizeGpuType = (gpuType: string | null | undefined): string | undefined => {
  const v = (gpuType ?? '').trim()
  if (!v) return undefined
  if (NON_VALUES.has(v.toLowerCase())) return undefined
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
