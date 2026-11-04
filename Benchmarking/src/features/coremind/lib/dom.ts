/**
 * Generic DOM helpers behind the fill / click / style tools. Elements are
 * located the way a person describes them — by visible text, label,
 * placeholder or aria-label — so the tools work on any page without each
 * component registering itself.
 */

/** CoreMind's own UI is marked with this so it never targets itself. */
export const COREMIND_ROOT_ATTR = 'data-coremind-root'

/** Words that describe the kind of element rather than which one. */
const KIND_WORDS = new Set([
  'field',
  'input',
  'box',
  'textbox',
  'dropdown',
  'select',
  'selector',
  'button',
  'btn',
  'link',
  'tab',
  'menu',
  'item',
  'area',
  'textarea',
  'element',
  'section',
  'icon',
  'heading',
  'title',
])
const FILLER = new Set(['the', 'a', 'an', 'on', 'of', 'in', 'to', 'my', 'this', 'that', 'please'])

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token && !FILLER.has(token) && !KIND_WORDS.has(token))

const INPUT_SELECTOR =
  'input:not([type="hidden"]), textarea, select, [contenteditable="true"], [role="combobox"]'
const CLICKABLE_SELECTOR =
  'button, a, [role="button"], [role="tab"], [role="link"], [role="menuitem"], [role="option"], [role="switch"], [role="checkbox"], input[type="checkbox"], input[type="radio"], label'
const ANY_SELECTOR = `${CLICKABLE_SELECTOR}, ${INPUT_SELECTOR}, h1, h2, h3, h4, h5, h6, p, span, div, li, th, td, img`

/** Named layout regions — "make the sidebar dark blue" targets the whole navbar. */
const REGIONS: [RegExp, string][] = [
  [/^(sidebar|navbar|nav|navigation|side menu|left menu)$/, '.mantine-AppShell-navbar'],
  [/^footer$/, '.mantine-AppShell-footer'],
  [/^(header|top bar|topbar|app bar|title bar)$/, '[data-coremind-region="header"]'],
  [/^(page|main|content|main area|main content)$/, '.mantine-AppShell-main'],
  [/^(body|whole app|whole page|app|everything|background)$/, 'body'],
]

const isVisible = (el: Element) =>
  !el.closest(`[${COREMIND_ROOT_ATTR}]`) &&
  (typeof (el as HTMLElement).checkVisibility === 'function'
    ? (el as HTMLElement).checkVisibility()
    : true)

const isInteractive = (el: Element) => el.matches(CLICKABLE_SELECTOR) || el.matches(INPUT_SELECTOR)

/**
 * Named groups of elements, styled together by selector rather than one at a
 * time — "the sidebar items" is four NavLinks, and which one is active moves.
 */
const NAV_WORDS = '(?:sidebar|navbar|nav|navigation|side menu|menu)'
const ITEM_WORDS = '(?:items?|links?|list|options?|entries|tabs?|buttons?|elements?|menu)'
const GROUPS: [RegExp, string][] = [
  [
    new RegExp(
      `\\b${NAV_WORDS}\\s+${ITEM_WORDS}\\b|\\b${ITEM_WORDS}\\s+(?:(?:in|on|of)\\s+)?(?:the\\s+)?${NAV_WORDS}\\b`,
    ),
    '.mantine-AppShell-navbar .mantine-NavLink-root',
  ],
  [/^(?:all\s+)?(?:the\s+)?buttons$/, '.mantine-Button-root'],
  [/^(?:all\s+)?(?:the\s+)?cards$/, '.mantine-Card-root'],
  [/^(?:all\s+)?(?:the\s+)?(?:table\s+)?rows$/, 'tbody tr'],
]

/** Group selector for a description like "sidebar items", or null if it names one element. */
export const findGroup = (query: string): string | null =>
  GROUPS.find(([pattern]) => pattern.test(query.toLowerCase().trim()))?.[1] ?? null

export const isButtonLike = (el: Element) =>
  el.tagName === 'BUTTON' ||
  el.getAttribute('role') === 'button' ||
  /mantine-(Button|ActionIcon|Badge|NavLink)-root/.test(el.className.toString())

export const isRegion = (el: Element) => REGIONS.some(([, selector]) => el.matches(selector))

/** Everything a person might call this element by. */
const describe = (el: Element, includeText: boolean) => {
  const parts = ['aria-label', 'placeholder', 'title', 'name', 'alt'].map((attr) =>
    el.getAttribute(attr),
  )
  const labels = (el as HTMLInputElement).labels
  if (labels) labels.forEach((label) => parts.push(label.textContent))
  el.getAttribute('aria-labelledby')
    ?.split(' ')
    .forEach((id) => parts.push(document.getElementById(id)?.textContent ?? null))
  parts.push(el.closest('.mantine-InputWrapper-root')?.querySelector('label')?.textContent ?? null)
  if (includeText) {
    const text = el.textContent?.trim()
    if (text && text.length <= 120) parts.push(text)
  }
  return parts.filter(Boolean).join(' ')
}

type Kind = 'input' | 'clickable' | 'any'

/**
 * Best-matching visible element for a description like "model field" or
 * "start benchmark button". Score is mostly "how many query words appear in
 * the label", with a smaller weight on "how much of the label is the query"
 * so a wrapper div full of text loses to the exact button inside it.
 */
export const findElement = (query: string, kind: Kind = 'any'): HTMLElement | null => {
  const raw = query.toLowerCase().trim()
  const queryTokens = tokenize(raw)

  if (kind === 'any') {
    const region = REGIONS.find(([pattern]) => pattern.test(queryTokens.join(' ') || raw))
    const el = region && document.querySelector<HTMLElement>(region[1])
    if (el) return el
  }
  const wantsButton = /\b(button|btn)\b/.test(raw)
  const wantsLink = /\b(link|tab)\b/.test(raw)
  const wantsHeading = /\b(heading|title)\b/.test(raw)
  if (queryTokens.length === 0) {
    // Plain "the title" / "the heading" — the first visible heading on the page.
    if (!wantsHeading) return null
    return [...document.querySelectorAll<HTMLElement>('h1, h2, h3')].find(isVisible) ?? null
  }
  const selector =
    kind === 'input' ? INPUT_SELECTOR : kind === 'clickable' ? CLICKABLE_SELECTOR : ANY_SELECTOR

  let best: { el: HTMLElement; score: number } | undefined
  for (const el of document.querySelectorAll<HTMLElement>(selector)) {
    if (!isVisible(el)) continue
    const label = new Set(tokenize(describe(el, kind !== 'input')))
    if (label.size === 0) continue
    const matched = queryTokens.filter(
      (token) =>
        label.has(token) || [...label].some((l) => token.length >= 3 && l.startsWith(token)),
    ).length
    if (matched / queryTokens.length < 0.5) continue

    let score = (0.7 * matched) / queryTokens.length + (0.3 * matched) / label.size
    if (isInteractive(el)) score += 0.05
    if (wantsButton && isButtonLike(el)) score += 0.2
    if (wantsLink && (el.tagName === 'A' || el.getAttribute('role') === 'tab')) score += 0.2
    if (wantsHeading && /^H[1-6]$/.test(el.tagName)) score += 0.2
    // `>=` so that on a tie the later — i.e. more deeply nested — element wins.
    if (!best || score >= best.score) best = { el, score }
  }
  return best?.el ?? null
}

/** Briefly outline an element so the user can see what CoreMind acted on. */
export const flash = (el: HTMLElement) => {
  el.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  el.animate?.(
    [
      { outline: '2px solid var(--mantine-primary-color-filled)', outlineOffset: '2px' },
      { outline: '2px solid transparent', outlineOffset: '2px' },
    ],
    { duration: 1200 },
  )
}

/**
 * Set a value the way typing would, so React's controlled inputs see it: call
 * the native setter (React overrides the instance one) and fire input/change.
 */
const setNativeValue = (
  el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
) => {
  const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

const waitFor = async <T>(fn: () => T | null, timeoutMs = 1000): Promise<T | null> => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const result = fn()
    if (result) return result
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  return null
}

/**
 * The dropdown option the user means. Looks only inside this input's own list
 * (`aria-controls`) when it has one, so another open dropdown can't answer.
 * An exact match wins; else a single option that starts with / contains the
 * text. Several candidates throw rather than guess the first one.
 */
const findOption = (value: string, input?: HTMLElement) => {
  const wanted = value.toLowerCase().trim()
  const listId = input?.getAttribute('aria-controls')
  const scope = (listId && document.getElementById(listId)) || document
  const options = [...scope.querySelectorAll<HTMLElement>('[role="option"]')].filter(isVisible)
  const text = (el: HTMLElement) => el.textContent?.toLowerCase().trim() ?? ''

  const exact = options.find((o) => text(o) === wanted)
  if (exact) return exact
  for (const test of [(t: string) => t.startsWith(wanted), (t: string) => t.includes(wanted)]) {
    const found = options.filter((o) => test(text(o)))
    if (found.length === 1) return found[0]
    if (found.length > 1) {
      const labels = found
        .slice(0, 8)
        .map((o) => o.textContent?.trim())
        .join(', ')
      throw new Error(`"${value}" matches several options (${labels}). Which one?`)
    }
  }
  return null
}

const TRUTHY = /^(on|yes|true|checked|enabled?|1|tick(ed)?)$/i

/** Put `value` into a field: text inputs, native selects, checkboxes, and Mantine comboboxes. */
export const fillInput = async (el: HTMLElement, value: string): Promise<string> => {
  if (el instanceof HTMLSelectElement) {
    const wanted = value.toLowerCase()
    const option = [...el.options].find(
      (o) => o.text.toLowerCase().includes(wanted) || o.value.toLowerCase() === wanted,
    )
    if (!option) throw new Error(`no option matching "${value}"`)
    setNativeValue(el, option.value)
    return `Selected "${option.text}".`
  }

  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
    if (el.checked !== TRUTHY.test(value)) el.click()
    return `${el.checked ? 'Checked' : 'Unchecked'} it.`
  }

  if (el.isContentEditable) {
    el.focus()
    el.textContent = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return `Entered "${value}".`
  }

  const input = el as HTMLInputElement
  const isCombobox =
    input.getAttribute('aria-haspopup') === 'listbox' || input.getAttribute('role') === 'combobox'
  if (isCombobox) {
    input.focus()
    input.click()
    if (!input.readOnly) setNativeValue(input, value)
    const option = await waitFor(() => findOption(value, input))
    if (option) {
      const label = option.textContent?.trim()
      option.click()
      return `Selected "${label}".`
    }
    if (input.readOnly) throw new Error(`no option matching "${value}" in that dropdown`)
    return `Entered "${value}".`
  }

  input.focus()
  setNativeValue(input, value)
  return `Entered "${value}".`
}
