import { buildTheme } from '@/app/theme/buildTheme'
import { shadesOf } from '@/app/theme/colors'
import { parseCommand } from './parseCommand'
import { runCommand } from './runCommand'
import type { ToolContext } from '../types'

describe('parseCommand — theme', () => {
  it.each([
    ['change theme to blue', { primaryColor: 'blue' }],
    ['chnage the theme to teal', { primaryColor: 'teal' }],
    ['set primary color to #ff6600', { primaryColor: '#ff6600' }],
    ['make the accent purple', { primaryColor: 'purple' }],
    ['dark blue theme', { primaryColor: 'darkblue' }],
    ['change the font to roboto', { fontFamily: 'Roboto' }],
    ['use the Inter font', { fontFamily: 'Inter' }],
    ['font to default', { fontFamily: 'default' }],
    ['set radius to xl', { radius: 'xl' }],
    ['make everything rounded', { radius: 'lg' }],
    ['square corners everywhere', { radius: '0' }],
    ['set the app radius to 12px', { radius: '12px' }],
    ['make the text bigger', { textScale: 'up' }],
    ['zoom out', { textScale: 'down' }],
    ['set text size to 110%', { textScale: '1.1' }],
  ])('"%s" → set_theme %o', (input, args) => {
    expect(parseCommand(input)).toEqual({ tool: 'set_theme', args })
  })

  it('leaves light/dark mode and element styling alone', () => {
    expect(parseCommand('change theme to dark')?.tool).toBe('set_color_scheme')
    expect(parseCommand('light theme')?.tool).toBe('set_color_scheme')
    expect(parseCommand('set font size of the header to 20px')?.tool).toBe('set_style')
    expect(parseCommand('make the start button rounded')?.tool).toBe('set_style')
    expect(parseCommand('set the text color to white')?.tool).toBe('set_style')
  })

  it.each(['reset theme', 'restore the default theme'])('"%s" resets the theme', (input) => {
    expect(parseCommand(input)?.tool).toBe('reset_theme')
  })
})

describe('theme tools', () => {
  const stub = (textScale?: number) =>
    ({ theme: { textScale }, setTheme: vi.fn(), resetTheme: vi.fn() }) as unknown as ToolContext

  it('saves a named or hex primary colour', async () => {
    const ctx = stub()
    await runCommand('make the accent purple', ctx)
    expect(ctx.setTheme).toHaveBeenCalledWith({ primaryColor: 'grape' })
    await runCommand('set primary color to #f60', ctx)
    expect(ctx.setTheme).toHaveBeenCalledWith({ primaryColor: '#ff6600' })
  })

  it('steps text size from the current value, within bounds', async () => {
    const ctx = stub(1.45)
    await runCommand('make the text bigger', ctx)
    expect(ctx.setTheme).toHaveBeenCalledWith({ textScale: 1.5 })
  })

  it('builds a Mantine theme from overrides', () => {
    const theme = buildTheme({ primaryColor: '#ff6600', fontFamily: 'Roboto', radius: 'xl' })
    expect(theme.primaryColor).toBe('custom')
    expect(theme.colors?.custom?.[6]).toBe('#ff6600')
    expect(theme.fontFamily).toMatch(/^"Roboto", /)
    expect(theme.defaultRadius).toBe('xl')
    expect(buildTheme({ primaryColor: 'teal' }).primaryColor).toBe('teal')
    expect(shadesOf('#000000')[0]).toBe('#e6e6e6')
  })
})
