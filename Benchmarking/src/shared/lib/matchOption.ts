import type { ComboboxData } from '@mantine/core'

export type Option = { value: string; label: string }

export type MatchResult =
  { kind: 'match'; option: Option } | { kind: 'ambiguous'; options: Option[] } | { kind: 'none' }

/** Flatten Mantine select data (strings, `{ value, label }`, or groups) into plain options. */
export const flattenOptions = (data: ComboboxData | undefined): Option[] =>
  flatten((data ?? []) as readonly unknown[])

const flatten = (items: readonly unknown[]): Option[] =>
  items.flatMap((item): Option[] => {
    if (typeof item === 'string') return [{ value: item, label: item }]
    if (!item || typeof item !== 'object') return []
    const obj = item as { group?: unknown; items?: unknown; value?: unknown; label?: unknown }
    if (Array.isArray(obj.items)) return flatten(obj.items)
    if (typeof obj.value !== 'string') return []
    return [{ value: obj.value, label: typeof obj.label === 'string' ? obj.label : obj.value }]
  })

/** Lowercase and drop punctuation/spaces, so "Llama 3.1 8B" matches "llama-3.1-8b". */
const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '')

/**
 * Find the one option a person means by `wanted`. An exact match wins; else a
 * single option that starts with it; else a single option that contains it.
 * Several candidates are reported as ambiguous rather than guessed — picking
 * the first of many is how a chat ends up selecting the wrong value.
 */
export const matchOption = (options: Option[], wanted: string): MatchResult => {
  const target = squash(wanted)
  if (!target) return { kind: 'none' }
  const keys = (o: Option) => [squash(o.value), squash(o.label)]

  const exact = options.find((o) => keys(o).includes(target))
  if (exact) return { kind: 'match', option: exact }

  for (const test of [
    (key: string) => key.startsWith(target),
    (key: string) => key.includes(target),
  ]) {
    const found = options.filter((o) => keys(o).some(test))
    if (found.length === 1) return { kind: 'match', option: found[0] }
    if (found.length > 1) return { kind: 'ambiguous', options: found }
  }
  return { kind: 'none' }
}

/** "a, b, c" — capped so a long list doesn't flood the chat. */
export const listOptions = (options: Option[], max = 8) => {
  const labels = options.slice(0, max).map((o) => o.label)
  return options.length > max
    ? `${labels.join(', ')} and ${options.length - max} more`
    : labels.join(', ')
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?::\d{1,5})?$/
const IPV6 = /^\[?[0-9a-f]*:[0-9a-f:]+\]?(?::\d{1,5})?$/i
const HOSTNAME =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*(?::\d{1,5})?$/i

/**
 * Whether `text` can be a machine address: an IPv4/IPv6 address, or a
 * hostname with a dot or a digit in it ("bench-01", "gpu.lab.local") — so a
 * stray word like "hello" is never accepted as a Node IP.
 */
export const looksLikeHost = (text: string) => {
  const ipv4 = text.match(IPV4)
  if (ipv4) return ipv4.slice(1, 5).every((octet) => Number(octet) <= 255)
  if (IPV6.test(text)) return true
  return HOSTNAME.test(text) && /[.\d]/.test(text)
}
