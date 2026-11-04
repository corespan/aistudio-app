/**
 * Live style overrides, written into one injected <style> tag with
 * `!important` so they beat Mantine's own hover/active/colour rules.
 *
 * A target is either a single element — tagged with `data-coremind-id` — or a
 * group selector such as every sidebar item. Group rules follow the DOM as it
 * changes (e.g. whichever nav item is active right now); a tagged element
 * loses its overrides if React remounts it. Everything persists until
 * `resetStyles`.
 */

const STYLE_ID = 'coremind-styles'
const ID_ATTR = 'data-coremind-id'

/**
 * `active` covers both "being pressed" and "the selected/current one" —
 * Mantine marks the latter with `data-active` (NavLink, Tabs) or aria attributes.
 */
export const STYLE_STATES = ['normal', 'hover', 'active'] as const
export type StyleState = (typeof STYLE_STATES)[number]
export type Declarations = Record<string, string>

const STATE_SUFFIX: Record<StyleState, string> = {
  normal: '',
  hover: ':hover',
  active: ':is(:active, [data-active], [aria-current="page"], [aria-selected="true"])',
}

const rules = new Map<string, Declarations>()
let counter = 0

/** Property names are kebab-case only; values can't break out of the rule. */
const isSafe = (property: string, value: string) =>
  /^-{0,2}[a-z][a-z-]*$/.test(property) && !/[{};<>]/.test(value)

const render = () => {
  let tag = document.getElementById(STYLE_ID)
  if (!tag) {
    tag = document.createElement('style')
    tag.id = STYLE_ID
    document.head.appendChild(tag)
  }
  tag.textContent = [...rules]
    .map(([selector, decls]) => {
      const body = Object.entries(decls)
        .map(([property, value]) => `${property}: ${value} !important;`)
        .join(' ')
      return `${selector} { ${body} }`
    })
    .join('\n')
}

/** Selector for a target: a tagged element, or a group selector used as-is. */
const baseSelector = (target: HTMLElement | string) => {
  if (typeof target === 'string') return target
  let id = target.getAttribute(ID_ATTR)
  if (!id) {
    id = `cm-${++counter}`
    target.setAttribute(ID_ATTR, id)
  }
  return `[${ID_ATTR}="${id}"]`
}

export const applyStyle = (
  target: HTMLElement | string,
  decls: Declarations,
  states: StyleState[],
) => {
  const safe = Object.fromEntries(Object.entries(decls).filter(([p, v]) => isSafe(p, v)))
  if (Object.keys(safe).length === 0) throw new Error('no valid style to apply')

  const base = baseSelector(target)
  for (const state of states) {
    // `:is()` keeps a comma-separated group selector intact when suffixed.
    const selector = state === 'normal' ? base : `:is(${base})${STATE_SUFFIX[state]}`
    rules.set(selector, { ...rules.get(selector), ...safe })
  }
  // Ease state changes in rather than snapping.
  if (states.some((state) => state !== 'normal')) {
    rules.set(base, { transition: 'all 150ms ease', ...rules.get(base) })
  }
  render()
}

/** Remove every override CoreMind has applied. Returns how many rules were removed. */
export const resetStyles = () => {
  document.querySelectorAll(`[${ID_ATTR}]`).forEach((el) => el.removeAttribute(ID_ATTR))
  const count = [...rules.values()].filter(
    (decls) => !('transition' in decls && Object.keys(decls).length === 1),
  ).length
  rules.clear()
  render()
  return count
}
