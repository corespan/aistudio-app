import { useEffect, useState } from 'react'
import { Button, Portal } from '@mantine/core'
import { IconSparkles } from '@tabler/icons-react'
import { CoreIcon } from '@/shared/ui'
import { useAgentStore } from '../agent/useAgentStore'
import { COREMIND_ROOT_ATTR } from '../lib/dom'
import { useCoreMindStore } from '../store/useCoreMindStore'

type Anchor = { text: string; top: number; left: number }

/** Shortest selection worth offering — skips stray double-click fragments. */
const MIN_CHARS = 2
const BUTTON_HALF_WIDTH = 70

/** Where to show the button for the current selection, or null to hide it. */
const readSelection = (): Anchor | null => {
  const selection = window.getSelection()
  const text = selection?.toString().trim() ?? ''
  if (!selection || selection.isCollapsed || selection.rangeCount === 0 || text.length < MIN_CHARS)
    return null

  const node = selection.anchorNode
  const element = node instanceof Element ? node : node?.parentElement
  // Not CoreMind's own text, and never form fields (passwords, drafts).
  if (
    !element ||
    element.closest(`[${COREMIND_ROOT_ATTR}]`) ||
    element.closest('input, textarea, [contenteditable="true"]')
  )
    return null

  const rect = selection.getRangeAt(0).getBoundingClientRect()
  if (!rect.width && !rect.height) return null
  const left = Math.min(
    Math.max(rect.left + rect.width / 2, BUTTON_HALF_WIDTH),
    window.innerWidth - BUTTON_HALF_WIDTH,
  )
  return { text, top: rect.bottom + 8, left }
}

/**
 * Floating "Ask CoreMind" button under highlighted page text. Clicking it
 * attaches the text to the composer and opens the panel in Agent mode.
 */
export const SelectionAskButton = () => {
  const [anchor, setAnchor] = useState<Anchor | null>(null)
  const attach = useAgentStore((s) => s.attach)
  const open = useCoreMindStore((s) => s.open)
  const setMode = useCoreMindStore((s) => s.setMode)

  useEffect(() => {
    // Wait a tick: the selection isn't final until after mouseup.
    const update = () => setTimeout(() => setAnchor(readSelection()), 0)
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.shiftKey || event.key === 'Shift') update()
    }
    const hide = () => setAnchor(null)
    const onSelectionChange = () => {
      if (window.getSelection()?.isCollapsed) hide()
    }

    document.addEventListener('mouseup', update)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('selectionchange', onSelectionChange)
    // Capture phase: also hears the app's inner ScrollAreas scrolling.
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
    return () => {
      document.removeEventListener('mouseup', update)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('selectionchange', onSelectionChange)
      window.removeEventListener('scroll', hide, true)
      window.removeEventListener('resize', hide)
    }
  }, [])

  if (!anchor) return null

  const ask = () => {
    attach(anchor.text)
    setMode('agent')
    open()
    window.getSelection()?.removeAllRanges()
    setAnchor(null)
  }

  return (
    <Portal>
      <Button
        {...{ [COREMIND_ROOT_ATTR]: true }}
        size="compact-sm"
        radius="xl"
        variant="filled"
        leftSection={<CoreIcon icon={<IconSparkles />} size={14} />}
        // Raw px in `style`: Mantine's numeric top/left would be scaled by the theme.
        style={{
          position: 'fixed',
          top: anchor.top,
          left: anchor.left,
          transform: 'translateX(-50%)',
          zIndex: 400,
          boxShadow: 'var(--mantine-shadow-md)',
        }}
        // Keep the selection alive while the button is pressed.
        onMouseDown={(event) => event.preventDefault()}
        onClick={ask}
      >
        Ask CoreMind
      </Button>
    </Portal>
  )
}
