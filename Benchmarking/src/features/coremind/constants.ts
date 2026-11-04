// CoreMind side panel — docked full-height on the right, like a browser's AI side panel.
/** Panel width in Mantine size units (scaled by the theme, same as NAVBAR_WIDTH). */
export const CHAT_PANEL_WIDTH = 400

/** One-click example commands shown in the empty panel, per mode. */
export const SUGGESTIONS = {
  agent: ['Start a benchmark', 'Compare the latest runs', 'Why is my run slow?', 'Service status'],
  commands: ['Go to benchmarks', 'Start a benchmark', 'Change theme to teal', 'Help'],
} as const
