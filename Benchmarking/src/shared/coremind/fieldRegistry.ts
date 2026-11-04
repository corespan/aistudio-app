import { type ReactNode, type RefObject, useEffect, useId, useRef } from 'react'
import { create } from 'zustand'
import type { ComboboxData } from '@mantine/core'
import { flattenOptions, type Option } from '@/shared/lib/matchOption'

/**
 * The live list of form fields on screen, which CoreMind (the chat assistant)
 * reads to understand and fill any form. Inputs sign in when they mount and
 * sign out when they unmount, so the list is always exactly what the user
 * can see. The shared CoreSelect / CoreTextInput do this automatically; any
 * other input can call `useCoreMindField` itself.
 */

export type CoreMindFieldKind = 'text' | 'select'

export type CoreMindField = {
  id: string
  /** Form field name, e.g. "model" or "config.max_tokens". */
  name: string
  /** What the user sees, e.g. "Model". */
  label: string
  /** Other words people use for it, e.g. ["ip", "machine"]. */
  aliases: string[]
  kind: CoreMindFieldKind
  /** The choices, for dropdowns. */
  options: Option[]
  disabled: boolean
  getValue: () => string
  /** Sets the value through the form, so the input shows exactly this value. */
  setValue: (value: string) => void
  /** The input element — used to tell which fields are visible / in a modal. */
  element: () => HTMLElement | null
}

type FieldRegistry = {
  fields: Record<string, CoreMindField>
  register: (field: CoreMindField) => void
  unregister: (id: string) => void
}

export const useCoreMindFieldRegistry = create<FieldRegistry>((set) => ({
  fields: {},
  register: (field) => set((s) => ({ fields: { ...s.fields, [field.id]: field } })),
  unregister: (id) =>
    set((s) => ({
      fields: Object.fromEntries(Object.entries(s.fields).filter(([key]) => key !== id)),
    })),
}))

export type CoreMindFieldSpec = {
  name: string
  label?: ReactNode
  placeholder?: string
  aliases?: string[]
  /** Dropdown choices — present means the field is a dropdown. */
  data?: ComboboxData
  disabled?: boolean
  /** Set false to keep the field off the list (e.g. on a hidden step). Default true. */
  enabled?: boolean
  value: unknown
  onChange: (value: string) => void
}

/** "config.max_tokens" → "max tokens", "gpuType" → "gpu type". */
const humanize = (name: string) =>
  (name.split('.').pop() ?? name)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .trim()

const toLabel = (label: ReactNode, placeholder: string | undefined, name: string) => {
  if (typeof label === 'string' && label.trim()) return label.trim()
  if (placeholder?.trim() && !placeholder.includes('…')) return placeholder.trim()
  return humanize(name)
}

/** Put a field on CoreMind's list while it is mounted (and `enabled`). */
export const useCoreMindField = (
  spec: CoreMindFieldSpec,
  elementRef: RefObject<HTMLElement | null>,
) => {
  const id = useId()
  const register = useCoreMindFieldRegistry((s) => s.register)
  const unregister = useCoreMindFieldRegistry((s) => s.unregister)

  // Value and onChange change every render; read them through a ref so the
  // registration itself only changes when the field's description does.
  const latest = useRef(spec)
  useEffect(() => {
    latest.current = spec
  })

  const { name, disabled = false, enabled = true } = spec
  const label = toLabel(spec.label, spec.placeholder, name)
  const aliasesKey = JSON.stringify([...(spec.aliases ?? []), humanize(name)])
  const optionsKey = spec.data ? JSON.stringify(flattenOptions(spec.data)) : ''

  useEffect(() => {
    if (!enabled) return
    register({
      id,
      name,
      label,
      aliases: (JSON.parse(aliasesKey) as string[]).filter((a) => a && a !== label.toLowerCase()),
      kind: optionsKey ? 'select' : 'text',
      options: optionsKey ? (JSON.parse(optionsKey) as Option[]) : [],
      disabled,
      getValue: () => {
        const value = latest.current.value
        return value == null ? '' : String(value)
      },
      setValue: (value) => latest.current.onChange(value),
      element: () => elementRef.current,
    })
    return () => unregister(id)
  }, [id, name, label, aliasesKey, optionsKey, disabled, enabled, register, unregister, elementRef])
}
