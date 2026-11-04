import { parseCommand } from './parseCommand'
import { runCommand } from './runCommand'
import type { ToolContext } from '../types'

const ctx = {} as ToolContext

describe('parseCommand — page actions', () => {
  it.each([
    ['type llama 3 in the model field', 'model field', 'llama 3'],
    ['enter "Hello World" into the search box', 'search box', 'Hello World'],
    ['set the model to Llama-3.1-70B', 'model', 'Llama-3.1-70B'],
    ['select H100 from the gpu type dropdown', 'gpu type dropdown', 'H100'],
    ['fill concurrency with 64', 'concurrency', '64'],
    // "add the value…" phrasings (node ip / model belong to the wizard — see parseWizard.test)
    ['add the value 64 to concurrency', 'concurrency', '64'],
    ['add H100 in the gpu type', 'gpu type', 'H100'],
    ['use 1024 for input tokens', 'input tokens', '1024'],
    ['the precision should be fp16', 'precision', 'fp16'],
    // "write" is a real word, not a typo of "white"
    ['write 128 into max tokens', 'max tokens', '128'],
  ])('"%s" fills %s with %s', (input, target, value) => {
    expect(parseCommand(input)).toEqual({ tool: 'fill_input', args: { target, value } })
  })

  it('parses click commands', () => {
    expect(parseCommand('click on the Start Benchmark button')).toEqual({
      tool: 'click_element',
      args: { target: 'the Start Benchmark button' },
    })
  })

  it.each([
    [
      'make the start benchmark button red on hover',
      { target: 'start benchmark button', css: '--coremind-color: red', state: 'hover' },
    ],
    [
      'change the background of the sidebar to dark blue',
      { target: 'sidebar', css: 'background-color: darkblue', state: 'normal' },
    ],
    [
      'when i hover over the blogs link make it bold',
      { target: 'blogs link', css: 'font-weight: 700', state: 'hover' },
    ],
    [
      'set font size of the header to 20px',
      { target: 'header', css: 'font-size: 20px', state: 'normal' },
    ],
    [
      'make the about link text green and bigger',
      { target: 'about link', css: 'color: green; transform: scale(1.08)', state: 'normal' },
    ],
    ['hide the footer', { target: 'footer', css: 'display: none', state: 'normal' }],
    ['set the text color to white', { target: 'body', css: 'color: white', state: 'normal' }],
  ])('"%s" → set_style', (input, args) => {
    expect(parseCommand(input)).toEqual({ tool: 'set_style', args })
  })

  it.each([
    ['make the sidebar items green on hover', 'sidebar items', 'hover'],
    ['change the active state to green', 'sidebar items', 'active'],
    ['change the active sidebar item to green', 'sidebar item', 'active'],
    ['make the sidebar links green when hovered or clicked', 'sidebar links', 'hover,active'],
  ])('"%s" → %s (%s)', (input, target, state) => {
    expect(parseCommand(input)).toEqual({
      tool: 'set_style',
      args: { target, css: '--coremind-color: green', state },
    })
  })

  it('repairs typos in command words but not in typed values', () => {
    expect(parseCommand('chnage the sidbar color to gren')?.args).toEqual({
      target: 'sidebar',
      css: '--coremind-color: green',
      state: 'normal',
    })
    expect(parseCommand('tpye mike in the name field')?.args).toEqual({
      target: 'name field',
      value: 'mike',
    })
    expect(parseCommand('take me to the company page')?.tool).toBe('navigate')
    expect(parseCommand('make the button pink')?.args.css).toBe('--coremind-color: pink')
  })

  it('keeps built-in intents ahead of the generic ones', () => {
    expect(parseCommand('change theme to dark')?.tool).toBe('set_color_scheme')
    expect(parseCommand('set benchmark type to ttft')?.tool).toBe('set_benchmark_type')
    expect(parseCommand('reset styles')?.tool).toBe('reset_styles')
  })
})

describe('page tools', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <label for="model">Model name</label><input id="model" />
      <input placeholder="Search runs" />
      <select aria-label="GPU type"><option value="a">A100</option><option value="h">H100</option></select>
      <button id="start">Start Benchmark</button>
      <nav class="mantine-AppShell-navbar"><a href="#">Blogs</a></nav>
      <div data-coremind-root><input placeholder="Message CoreMind" /></div>`
  })

  it('types into a field found by its label', async () => {
    const onInput = vi.fn()
    document.getElementById('model')!.addEventListener('input', onInput)
    const reply = await runCommand('type llama 3 in the model field', ctx)
    expect((document.getElementById('model') as HTMLInputElement).value).toBe('llama 3')
    expect(onInput).toHaveBeenCalled()
    expect(reply.text).toBe('Entered "llama 3".')
  })

  it('finds fields by placeholder and picks native select options', async () => {
    await runCommand('enter h100 into search', ctx)
    expect(document.querySelector<HTMLInputElement>('[placeholder="Search runs"]')!.value).toBe(
      'h100',
    )
    await runCommand('select H100 from the gpu type dropdown', ctx)
    expect(document.querySelector('select')!.value).toBe('h')
  })

  it('never targets its own chat input', async () => {
    const reply = await runCommand('type hi in the message field', ctx)
    expect(reply.text).toMatch(/couldn't find/)
  })

  it('clicks a button by its text', async () => {
    const onClick = vi.fn()
    document.getElementById('start')!.addEventListener('click', onClick)
    await runCommand('click start benchmark', ctx)
    expect(onClick).toHaveBeenCalled()
  })

  it('injects hover styles and resets them', async () => {
    await runCommand('make the start benchmark button red on hover', ctx)
    const button = document.getElementById('start')!
    const id = button.getAttribute('data-coremind-id')
    const css = document.getElementById('coremind-styles')!.textContent
    expect(css).toContain(
      `:is([data-coremind-id="${id}"]):hover { background-color: red !important; }`,
    )

    await runCommand('change the background of the sidebar to dark blue', ctx)
    expect(document.querySelector('nav')!.hasAttribute('data-coremind-id')).toBe(true)

    expect((await runCommand('reset styles', ctx)).text).toBe('Reset 2 style change(s).')
    expect(document.getElementById('coremind-styles')!.textContent).toBe('')
  })

  it('styles every sidebar item on hover and whichever one is active', async () => {
    const reply = await runCommand(
      'when i hover on the sidebar list or click change the active state to green',
      ctx,
    )
    expect(reply.text).toMatch(/on hover & active/)
    const css = document.getElementById('coremind-styles')!.textContent
    const group = '.mantine-AppShell-navbar .mantine-NavLink-root'
    expect(css).toContain(`:is(${group}):hover { background-color: green !important; }`)
    expect(css).toContain(`:is(${group}):is(:active, [data-active]`)
    await runCommand('reset styles', ctx)
  })

  it('colours the whole sidebar despite a typo, instead of toggling the theme', async () => {
    const setColorScheme = vi.fn()
    const reply = await runCommand('chnage the sidebar color to green', {
      ...ctx,
      setColorScheme,
    })
    expect(reply.tool).toBe('set_style')
    expect(setColorScheme).not.toHaveBeenCalled()
    expect(document.getElementById('coremind-styles')!.textContent).toContain(
      'background-color: green',
    )
    await runCommand('reset styles', ctx)
  })

  it('recolours text, not background, for non-button elements', async () => {
    await runCommand('make the blogs link green', ctx)
    expect(document.getElementById('coremind-styles')!.textContent).toContain('color: green')
    expect(document.getElementById('coremind-styles')!.textContent).not.toContain('background')
  })
})
