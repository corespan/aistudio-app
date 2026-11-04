import { type CoreMindField, useCoreMindFieldRegistry } from '@/shared/coremind/fieldRegistry'
import { listOptions, matchOption } from '@/shared/lib/matchOption'
import { flash } from './dom'

/**
 * Reading and filling the live field list (see shared/coremind/fieldRegistry).
 * This is how CoreMind knows every form without per-form code.
 */

const isShowing = (field: CoreMindField) => {
  const el = field.element()
  if (!el?.isConnected) return false
  return typeof el.checkVisibility === 'function' ? el.checkVisibility() : true
}

const inDialog = (field: CoreMindField) => Boolean(field.element()?.closest('[role="dialog"]'))

/**
 * The fields the user can act on right now. When a modal is open, only its
 * fields count — the page behind it is covered (and may share labels, like
 * the Benchmarks page's "Model" filter behind the Start Benchmark wizard).
 */
export const fieldsInFocus = (): CoreMindField[] => {
  const live = Object.values(useCoreMindFieldRegistry.getState().fields).filter(
    (field) => !field.disabled && isShowing(field),
  )
  const modal = live.filter(inDialog)
  return modal.length ? modal : live
}

const FILLER = new Set(['the', 'a', 'an', 'field', 'box', 'input', 'dropdown', 'value', 'of', 'my'])
const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !FILLER.has(word))
const squash = (text: string) => words(text).join('')

/** Every name a field answers to: its label, aliases and form name. */
export const namesOf = (field: CoreMindField) => [field.label, ...field.aliases]

/** How well `target` names this field: 3 exact, 2 all its words, 1 partial, 0 none. */
const score = (field: CoreMindField, target: string) => {
  const wanted = words(target)
  if (!wanted.length) return 0
  return Math.max(
    ...namesOf(field).map((name) => {
      const own = words(name)
      if (!own.length) return 0
      if (squash(name) === squash(target)) return 3
      if (own.every((word) => wanted.includes(word))) return 2 + own.length / 100
      if (wanted.every((word) => own.includes(word))) return 1
      return 0
    }),
  )
}

export type FieldLookup =
  | { kind: 'match'; field: CoreMindField }
  | { kind: 'ambiguous'; fields: CoreMindField[] }
  | { kind: 'none' }

/** Find the field the user means among those in focus. Ties are reported, not guessed. */
export const findField = (target: string, fields = fieldsInFocus()): FieldLookup => {
  const scored = fields.map((field) => ({ field, score: score(field, target) }))
  const best = Math.max(0, ...scored.map((s) => s.score))
  if (best === 0) return { kind: 'none' }
  const top = scored.filter((s) => s.score === best).map((s) => s.field)
  return top.length === 1 ? { kind: 'match', field: top[0] } : { kind: 'ambiguous', fields: top }
}

/** Put `value` into a field through its form and return the chat reply. */
export const fillField = (field: CoreMindField, raw: string): string => {
  const value = raw.trim()
  const el = field.element()

  if (field.kind === 'select') {
    if (!value) return `Which ${field.label}? Options: ${listOptions(field.options)}.`
    const result = matchOption(field.options, value)
    if (result.kind === 'none') {
      return `"${value}" isn't one of the ${field.label} options: ${listOptions(field.options)}.`
    }
    if (result.kind === 'ambiguous') {
      return `Several ${field.label} options match "${value}": ${listOptions(result.options)}. Which one?`
    }
    field.setValue(result.option.value)
    if (el) flash(el)
    return `${field.label} set to ${result.option.label}.`
  }

  if (!value) return `What should ${field.label} be?`
  field.setValue(value)
  if (el) flash(el)
  return `${field.label} set to ${value}.`
}

/** "Model (dropdown: a, b) — currently a" lines for the help text and the AI prompt. */
export const describeFields = (fields = fieldsInFocus()) =>
  fields.map((field) => {
    const kind = field.kind === 'select' ? `dropdown: ${listOptions(field.options, 12)}` : 'text'
    const current = field.getValue()
    return `${field.label} (${kind})${current ? ` — currently "${current}"` : ''}`
  })
