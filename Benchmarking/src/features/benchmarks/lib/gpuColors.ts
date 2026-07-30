const GPU_PALETTE = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#ef4444',
  '#84cc16',
  '#6366f1',
  '#14b8a6',
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

// First-seen GPU type claims the next unused palette color, so two GPUs never
// share a color as long as the count of distinct types seen so far doesn't
// exceed the palette — unlike a plain hash, which can (and did) collide two
// different strings onto the same index regardless of how few types exist.
// The assignment is a module-level singleton so it stays stable for the
// lifetime of the page, across every component that calls this.
const colorAssignments = new Map<string, string>()

export const colorForGpuType = (gpuType: string) => {
  const assigned = colorAssignments.get(gpuType)
  if (assigned) return assigned

  const used = new Set(colorAssignments.values())
  const color =
    GPU_PALETTE.find((c) => !used.has(c)) ?? GPU_PALETTE[hashString(gpuType) % GPU_PALETTE.length]
  colorAssignments.set(gpuType, color)
  return color
}
