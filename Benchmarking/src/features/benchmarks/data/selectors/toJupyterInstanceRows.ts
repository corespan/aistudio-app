import type { JupyterInstance } from '../../types'

// Coerce to a string, falling back when the field is missing/null/empty so the
// table renders a placeholder instead of a blank cell or the literal "undefined".
const toStr = (value: unknown, fallback = '—'): string =>
  value == null || value === '' ? fallback : String(value)

/** Normalize a single raw instance record from the API into a JupyterInstance. */
export const normalizeJupyterInstance = (item: Record<string, unknown>): JupyterInstance => ({
  taskId: toStr(item.task_id, ''),
  state: toStr(item.state, 'unknown'),
  nodeIp: toStr(item.node_ip),
  url: toStr(item.jupyter_url),
  createdAt: toStr(item.created_at, ''),
  updatedAt: toStr(item.updated_at, ''),
})

export const toJupyterInstanceRows = (raw: unknown): JupyterInstance[] => {
  // The API returns a top-level array; tolerate a { data: [...] } envelope too.
  const items: Record<string, unknown>[] = Array.isArray(raw)
    ? (raw as Record<string, unknown>[])
    : ((raw as { data?: Record<string, unknown>[] })?.data ?? [])

  return items.map(normalizeJupyterInstance)
}
