import type { ComboboxData } from '@mantine/core'

/**
 * Backend option endpoints may return any of these shapes:
 *   ['GPT-4o', ...]                          → strings
 *   [16, 32, ...]                            → numbers
 *   [{ id, name }, ...]                      → id/name objects
 *   [{ value, label }, ...]                  → value/label objects
 *   { data: [...] } | { results: [...] }     → wrapped in an envelope
 *
 * These selectors normalize all of them into Mantine Select option data so the
 * response always renders. Adjust the field picks if the real contract differs.
 */

const unwrap = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>
    if (Array.isArray(obj.data)) return obj.data
    if (Array.isArray(obj.results)) return obj.results
    if (Array.isArray(obj.items)) return obj.items
  }
  return []
}

const toOption = (item: unknown): { value: string; label: string } | null => {
  if (item == null) return null
  if (typeof item === 'string' || typeof item === 'number') {
    return { value: String(item), label: String(item) }
  }
  if (typeof item === 'object') {
    const obj = item as Record<string, unknown>
    const value = obj.value ?? obj.id ?? obj.name ?? obj.label
    const label = obj.label ?? obj.name ?? obj.value ?? obj.id
    if (value == null) return null
    return { value: String(value), label: String(label ?? value) }
  }
  return null
}

const toOptions = (raw: unknown): ComboboxData =>
  unwrap(raw)
    .map(toOption)
    .filter((o): o is { value: string; label: string } => o !== null)

/** Normalize { id, name } resources (models, GPU types) into Select options. */
export const toNamedOptions = (raw: unknown): ComboboxData => toOptions(raw)

/**
 * Normalize /nodes into Machine IP options. Value is the node's IP; label adds
 * the hostname/name when present (e.g. "10.6.82.45 (bench-01)").
 */
export const toNodeOptions = (raw: unknown): ComboboxData =>
  unwrap(raw)
    .map((item) => {
      if (typeof item === 'string') return { value: item, label: item }
      if (!item || typeof item !== 'object') return null
      const obj = item as Record<string, unknown>
      const ip = obj.ip ?? obj.ip_address ?? obj.address ?? obj.host ?? obj.id
      if (ip == null) return null
      const hostname = obj.hostname ?? obj.name ?? obj.node_name
      return {
        value: String(ip),
        label: hostname ? `${ip} (${hostname})` : String(ip),
      }
    })
    .filter((o): o is { value: string; label: string } => o !== null)

/** Normalize numeric concurrency levels into Select options. */
export const toConcurrencyOptions = (raw: unknown): ComboboxData => toOptions(raw)
