import { NAV_GROUPS, type SectionKey } from '@/app/constants'
import { BENCHMARK_TYPE_OPTIONS } from '@/features/benchmarks/constants'
import { findBlogPost } from '../lib/findBlogPost'
import { mantineColorName, toHex } from '@/app/theme/colors'
import { fillInput, findElement, findGroup, flash, isButtonLike, isRegion } from '../lib/dom'
import { describeFields, fillField, findField } from '../lib/fields'
import { BARE_COLOR } from '../lib/parseDomCommand'
import { applyStyle, resetStyles, STYLE_STATES, type StyleState } from '../lib/styleInjector'
import type { ClientTool, ToolContext } from '../types'

/** The wizard if it's already open; otherwise go to Benchmarks and open it. */
const openWizard = async (ctx: ToolContext) => {
  const current = ctx.startBenchmarkWizard?.()
  return current?.isOpen ? current : ((await ctx.openStartBenchmarkWizard?.()) ?? null)
}

const SECTIONS = NAV_GROUPS.flatMap((group) => group.children)
const SECTION_KEYS = SECTIONS.map((section) => section.key)

/**
 * The registry of browser actions CoreMind can take. Each entry carries a
 * JSON-schema `parameters` block so the same list can be handed to an LLM as
 * tool definitions later — today `parseCommand` picks the tool locally.
 */
export const CLIENT_TOOLS: ClientTool[] = [
  {
    name: 'navigate',
    description: 'Go to a section of the app.',
    parameters: {
      type: 'object',
      properties: {
        section: { type: 'string', description: 'Section to open.', enum: SECTION_KEYS },
      },
      required: ['section'],
    },
    execute: ({ section }, ctx) => {
      const target = SECTIONS.find((s) => s.key === section)
      if (!target) return `I don't know a section called "${section}".`
      ctx.navigateTo(target.key as SectionKey)
      return `Opened ${target.label}.`
    },
  },
  {
    name: 'go_back',
    description: 'Go back to the previous page.',
    parameters: { type: 'object', properties: {} },
    execute: (_args, ctx) => {
      // Inside the Start Benchmark wizard, "back" means the previous step.
      const wizard = ctx.startBenchmarkWizard?.()
      if (wizard?.isOpen) return wizard.back()
      ctx.goBack()
      return 'Went back.'
    },
  },
  {
    name: 'start_benchmark',
    description: 'Open the Start Benchmark wizard.',
    parameters: { type: 'object', properties: {} },
    execute: (_args, ctx) => {
      const wizard = ctx.startBenchmarkWizard?.()
      if (wizard?.isOpen) {
        return `The Start Benchmark wizard is already open, on step ${wizard.step + 1}. Fill it in step by step, e.g. "add node ip 10.0.0.12", "add model <name>", then "next". Click "Start Benchmark" on the last step to run it.`
      }
      if (ctx.pathname !== '/') ctx.navigateTo('benchmarks')
      ctx.openStartBenchmark()
      return 'Opened the Start Benchmark wizard. Next: "add node ip 10.0.0.12".'
    },
  },
  {
    name: 'set_benchmark_field',
    description:
      'Fill one field of the Start Benchmark wizard, opening the wizard if needed. Use for "add node ip 10.0.0.12", "select model llama", "add model" (no value lists the choices), or a model configuration key once that step is shown.',
    parameters: {
      type: 'object',
      properties: {
        field: {
          type: 'string',
          description: 'Which field: "nodeIp", "model", or a model configuration key.',
        },
        value: { type: 'string', description: 'The value to put in it. Empty to ask for options.' },
      },
      required: ['field'],
    },
    execute: async ({ field, value }, ctx) => {
      const wizard = await openWizard(ctx)
      if (!wizard) return "I couldn't open the Start Benchmark wizard."
      return (
        (await wizard.fill(field ?? '', value ?? '')) ??
        `The Start Benchmark wizard has no field called "${field}" on this step.`
      )
    },
  },
  {
    name: 'wizard_next',
    description:
      'Go to the next step of the open Start Benchmark wizard, after checking the current step. Never starts the run.',
    parameters: { type: 'object', properties: {} },
    execute: async (_args, ctx) => {
      const wizard = ctx.startBenchmarkWizard?.()
      if (!wizard?.isOpen)
        return `The Start Benchmark wizard isn't open. Say "start a benchmark" first.`
      return wizard.next()
    },
  },
  {
    name: 'set_benchmark_type',
    description: 'Switch the benchmark chart metric.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Metric to chart.', enum: BENCHMARK_TYPE_OPTIONS },
      },
      required: ['type'],
    },
    execute: ({ type }, ctx) => {
      const match = BENCHMARK_TYPE_OPTIONS.find((o) => o.toLowerCase() === type?.toLowerCase())
      if (!match) return `Benchmark type must be one of ${BENCHMARK_TYPE_OPTIONS.join(', ')}.`
      if (ctx.pathname !== '/') ctx.navigateTo('benchmarks')
      ctx.setBenchmarkType(match)
      return `Chart now shows ${match}.`
    },
  },
  {
    name: 'reset_filters',
    description: 'Clear all benchmark table filters.',
    parameters: { type: 'object', properties: {} },
    execute: (_args, ctx) => {
      if (ctx.pathname !== '/') ctx.navigateTo('benchmarks')
      ctx.resetFilters()
      return 'Cleared the benchmark filters.'
    },
  },
  {
    name: 'open_blog_post',
    description: 'Open the blog post that best matches a topic.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Topic or title words, e.g. "pcie topology".' },
      },
      required: ['query'],
    },
    execute: ({ query }, ctx) => {
      const post = findBlogPost(query ?? '')
      if (!post) return `I couldn't find a post about "${query}".`
      ctx.navigatePath(`/blogs/${post.id}`)
      return `Opened "${post.title}".`
    },
  },
  {
    name: 'set_color_scheme',
    description: 'Switch between light and dark mode.',
    parameters: {
      type: 'object',
      properties: {
        scheme: {
          type: 'string',
          description: 'Scheme to apply.',
          enum: ['light', 'dark', 'toggle'],
        },
      },
      required: ['scheme'],
    },
    execute: ({ scheme }, ctx) => {
      const value = scheme === 'light' || scheme === 'dark' ? scheme : 'toggle'
      ctx.setColorScheme(value)
      return value === 'toggle' ? 'Toggled the theme.' : `Switched to ${value} mode.`
    },
  },
  {
    name: 'set_theme',
    description:
      'Customise the whole app theme. Pass only what should change; "default" restores a field.',
    parameters: {
      type: 'object',
      properties: {
        primaryColor: {
          type: 'string',
          description: 'Accent colour: a Mantine palette (teal, grape...) or any CSS colour.',
        },
        fontFamily: { type: 'string', description: 'Font family, e.g. "Roboto".' },
        radius: {
          type: 'string',
          description: 'Corner radius: 0, xs, sm, md, lg, xl or a length.',
        },
        textScale: {
          type: 'string',
          description: 'Text size multiplier (e.g. "1.1"), or "up" / "down" to step it.',
        },
      },
    },
    execute: ({ primaryColor, fontFamily, radius, textScale }, ctx) => {
      const patch: Parameters<typeof ctx.setTheme>[0] = {}
      const done: string[] = []
      if (primaryColor) {
        const color = mantineColorName(primaryColor) ?? toHex(primaryColor)
        if (!color) return `"${primaryColor}" isn't a colour I know.`
        patch.primaryColor = color
        done.push(`primary colour → ${primaryColor}`)
      }
      if (fontFamily) {
        const reset = fontFamily === 'default'
        patch.fontFamily = reset ? undefined : fontFamily
        done.push(reset ? 'font → default' : `font → ${fontFamily}`)
      }
      if (radius) {
        patch.radius = radius
        done.push(`corner radius → ${radius}`)
      }
      if (textScale) {
        const current = ctx.theme.textScale ?? 1
        const step =
          textScale === 'up'
            ? current + 0.1
            : textScale === 'down'
              ? current - 0.1
              : Number(textScale)
        if (!Number.isFinite(step)) return `"${textScale}" isn't a text size I understand.`
        const scale = Math.round(Math.min(1.5, Math.max(0.7, step)) * 100) / 100
        patch.textScale = scale
        done.push(`text size → ${Math.round(scale * 100)}%`)
      }
      if (done.length === 0) return 'Tell me what to change — colour, font, corners or text size.'
      ctx.setTheme(patch)
      return `Theme updated: ${done.join(', ')}. Saved for next time.`
    },
  },
  {
    name: 'reset_theme',
    description: 'Restore the default theme (colour, font, corners, text size).',
    parameters: { type: 'object', properties: {} },
    execute: (_args, ctx) => {
      ctx.resetTheme()
      return 'Restored the default theme.'
    },
  },
  {
    name: 'fill_input',
    description:
      'Type a value into a form field, or pick an option from a dropdown, found by its label or placeholder.',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Field label/placeholder, e.g. "model".' },
        value: { type: 'string', description: 'Text to enter or option to select.' },
      },
      required: ['target', 'value'],
    },
    execute: async ({ target, value }, ctx) => {
      // While the Start Benchmark wizard is open, its own fields win — the
      // page behind it has a "Model" filter with the same label.
      const wizard = ctx.startBenchmarkWizard?.()
      if (wizard?.isOpen) {
        const reply = await wizard.fill(target ?? '', value ?? '')
        if (reply !== null) return reply
      }
      // Any field that signed onto CoreMind's live list (every Core input does).
      const lookup = findField(target ?? '')
      if (lookup.kind === 'match') return fillField(lookup.field, value ?? '')
      if (lookup.kind === 'ambiguous') {
        return `Which field do you mean: ${lookup.fields.map((f) => f.label).join(', ')}?`
      }
      // Last resort: find an input on the page by its label/placeholder.
      const el = findElement(target, 'input')
      if (!el) return `I couldn't find a field called "${target}" on this page.`
      flash(el)
      return fillInput(el, value ?? '')
    },
  },
  {
    name: 'list_fields',
    description: 'List the form fields on screen right now, with their options and current values.',
    parameters: { type: 'object', properties: {} },
    execute: () => {
      const lines = describeFields()
      return lines.length
        ? ['Fields you can fill here:', ...lines.map((line) => `• ${line}`)].join('\n')
        : 'There are no form fields on screen right now.'
    },
  },
  {
    name: 'click_element',
    description: 'Click a button, link, tab or checkbox found by its visible text or label.',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Visible text or label, e.g. "Start Benchmark".' },
      },
      required: ['target'],
    },
    execute: ({ target }) => {
      const el = findElement(target, 'clickable') ?? findElement(target, 'any')
      if (!el) return `I couldn't find "${target}" on this page.`
      flash(el)
      el.click()
      return `Clicked "${el.textContent?.trim() || el.getAttribute('aria-label') || target}".`
    },
  },
  {
    name: 'set_style',
    description:
      'Change how an element or group looks — always, on hover, and/or when active. Regions: sidebar, header, footer, page, body. Groups: sidebar items, buttons, cards, rows.',
    parameters: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Element text/label, a region or a group name.' },
        css: {
          type: 'string',
          description: 'Declarations, e.g. "background-color: red; font-weight: 700".',
        },
        state: {
          type: 'string',
          description: 'Comma-separated states to apply it in: normal, hover, active.',
        },
      },
      required: ['target', 'css'],
    },
    execute: ({ target, css, state }) => {
      const group = findGroup(target ?? '')
      const el = group ? null : findElement(target ?? '')
      if (!group && !el) return `I couldn't find "${target}" on this page.`
      // A bare colour fills buttons, regions and groups, but recolours text elsewhere.
      const fills = !el || isButtonLike(el) || isRegion(el)
      const decls = Object.fromEntries(
        (css ?? '')
          .split(';')
          .map((d) => d.split(':').map((part) => part.trim()))
          .filter(([property, value]) => property && value)
          .map(([property, value]) =>
            property === BARE_COLOR
              ? [fills ? 'background-color' : 'color', value]
              : [property, value],
          ),
      )
      const requested = (state ?? 'normal').split(',').map((s) => s.trim())
      const states = STYLE_STATES.filter((s) => requested.includes(s))
      if (states.length === 0) states.push('normal')
      applyStyle(group ?? el!, decls, states as StyleState[])
      if (el && states.includes('normal')) flash(el)
      const when = states.filter((s) => s !== 'normal')
      const summary = Object.entries(decls)
        .map(([property, value]) => `${property}: ${value}`)
        .join(', ')
      return `Styled "${target}"${when.length ? ` on ${when.join(' & ')}` : ''} — ${summary}.`
    },
  },
  {
    name: 'reset_styles',
    description: 'Undo every style change CoreMind has made.',
    parameters: { type: 'object', properties: {} },
    execute: () => {
      const count = resetStyles()
      return count ? `Reset ${count} style change(s).` : 'There were no style changes to reset.'
    },
  },
  {
    name: 'help',
    description: 'List what CoreMind can do.',
    parameters: { type: 'object', properties: {} },
    execute: () =>
      [
        'Try one of these:',
        '• "go to benchmarks" / "open blogs" / "about us" / "launch jupyter"',
        '• "start a benchmark", then step by step:',
        '    "add node ip 10.0.0.12" → "add model llama" / "select model llama" → "next"',
        '• "show TTFT" / "switch to throughput"',
        '• "reset filters"',
        '• "read the post about pcie topology"',
        '• "dark mode" / "light mode" / "toggle theme"',
        '',
        'Theme (saved across reloads):',
        '• "change theme to teal" / "set primary color to #ff6600"',
        '• "change the font to Roboto" / "font to default"',
        '• "make everything rounded" / "set radius to 0"',
        '• "make the text bigger" / "set text size to 110%" / "zoom out"',
        '• "reset theme"',
        '• "go back"',
        '',
        'On any page:',
        '• "type llama in the model field" / "set gpu type to H100"',
        '• "add concurrency 64" — works for any field on screen',
        '• "what can I fill here?" — lists the fields on screen',
        '• "click start benchmark"',
        '• "make the start benchmark button red on hover"',
        '• "change the background of the sidebar to dark blue"',
        '• "make the blogs link bold" / "set font size of the header to 20px"',
        '• "reset styles"',
      ].join('\n'),
  },
]

export const getClientTool = (name: string) => CLIENT_TOOLS.find((tool) => tool.name === name)
