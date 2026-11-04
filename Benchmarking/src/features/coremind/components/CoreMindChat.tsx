import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  ActionIcon,
  Badge,
  Box,
  CloseButton,
  Group,
  Paper,
  Portal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
  Tooltip,
  Transition,
  UnstyledButton,
} from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import {
  IconArrowUp,
  IconFileText,
  IconMessagePlus,
  IconQuote,
  IconSparkles,
  IconX,
} from '@tabler/icons-react'
import { NAV_GROUPS } from '@/app/constants'
import { CoreIcon } from '@/shared/ui'
import { useToolContext } from '../hooks/useToolContext'
import { runCommand } from '../lib/runCommand'
import { COREMIND_ROOT_ATTR } from '../lib/dom'
import { useCoreMindStore } from '../store/useCoreMindStore'
import { LocalAIToggle } from '../localai/LocalAIToggle'
import { useLocalAIStore } from '../localai/useLocalAIStore'
import { getClientTool } from '../tools/clientTools'
import { AgentRunView, StopIcon } from '../agent/components/AgentRunView'
import { AGENT_TRANSPORT_MODE } from '../agent'
import { isRunActive } from '../agent/runReducer'
import { useAgentStore, type UiActionRunner } from '../agent/useAgentStore'
import type { ChatMessage, CoreMindMode, ToolContext } from '../types'
import { CHAT_PANEL_WIDTH, SUGGESTIONS } from '../constants'
import { SelectionAskButton } from './SelectionAskButton'

const SECTIONS = NAV_GROUPS.flatMap((group) => group.children)

/** "Benchmarks", "Blogs", … — the page the agent is told about. */
const pageLabel = (pathname: string) =>
  (pathname === '/'
    ? SECTIONS.find((s) => s.key === 'benchmarks')
    : SECTIONS.find((s) => s.key !== 'benchmarks' && pathname.startsWith(`/${s.key}`))
  )?.label ?? 'This page'

const MODE_HINT: Record<CoreMindMode, string> = {
  agent: 'Ask about your benchmarks — CoreMind plans the steps and checks with you first.',
  commands: 'Quick commands that run instantly in this page, like "go to blogs".',
}

/**
 * CoreMind: a full-height assistant docked on the right, like a browser's AI
 * side panel. The page shrinks to make room (see AppLayout). Two modes:
 *   - Agent: messages go to the agent platform (mocked until its API is live);
 *   - Commands: the existing rule-based / local-AI client tools.
 * Toggle with the header button or Ctrl/Cmd+K.
 */
export const CoreMindChat = () => {
  const isOpen = useCoreMindStore((s) => s.isOpen)
  const mode = useCoreMindStore((s) => s.mode)
  const setMode = useCoreMindStore((s) => s.setMode)
  const messages = useCoreMindStore((s) => s.messages)
  const toggle = useCoreMindStore((s) => s.toggle)
  const close = useCoreMindStore((s) => s.close)
  const addMessage = useCoreMindStore((s) => s.addMessage)
  const clear = useCoreMindStore((s) => s.clear)
  const runs = useAgentStore((s) => s.runs)
  const attachment = useAgentStore((s) => s.attachment)
  const clearAttachment = useAgentStore((s) => s.clearAttachment)
  const startRun = useAgentStore((s) => s.startRun)
  const cancelRun = useAgentStore((s) => s.cancel)
  const resetAgent = useAgentStore((s) => s.reset)
  const ctx = useToolContext()
  const localAIEnabled = useLocalAIStore((s) => s.enabled)
  const localAIStatus = useLocalAIStore((s) => s.status)
  const turnOnLocalAI = useLocalAIStore((s) => s.turnOn)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  /** The local AI's answer while it is still being written, shown word by word. */
  const [streaming, setStreaming] = useState('')
  const viewportRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Agent runs outlive this render; UI actions must use the latest router/stores.
  const ctxRef = useRef<ToolContext>(ctx)
  useEffect(() => {
    ctxRef.current = ctx
  })

  useHotkeys([['mod+K', toggle]], [])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen, attachment])

  // Local AI was switched on in an earlier visit: reload the model (from the
  // browser cache, so no second download) the first time Commands mode opens.
  useEffect(() => {
    if (isOpen && mode === 'commands' && localAIEnabled && localAIStatus === 'off') turnOnLocalAI()
  }, [isOpen, mode, localAIEnabled, localAIStatus, turnOnLocalAI])

  useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streaming, runs])

  const activeRunId = [...messages]
    .reverse()
    .find((m) => m.agentRun && runs[m.id] && isRunActive(runs[m.id].status))?.id
  const isWorking = busy || Boolean(activeRunId)
  const conversation = messages.filter((m) => m.id !== 'greeting')

  /** ui.action from the agent → one of CoreMind's own client tools, nothing else. */
  const runUiAction: UiActionRunner = async (tool, args) => {
    const clientTool = getClientTool(tool)
    if (!clientTool) return `Skipped a page action I don't support ("${tool}").`
    return clientTool.execute(args, ctxRef.current)
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isWorking) return
    const quote = attachment ?? undefined
    addMessage({ role: 'user', text: trimmed, ...(quote && { quote }) })
    setDraft('')
    clearAttachment()

    if (mode === 'agent') {
      const replyId = addMessage({ role: 'assistant', text: '', agentRun: true })
      startRun(
        replyId,
        { input: trimmed, context: { page: ctx.pathname, ...(quote && { selection: quote }) } },
        runUiAction,
      )
      return
    }

    setBusy(true)
    try {
      const reply = await runCommand(trimmed, ctx, { onPartial: setStreaming })
      addMessage({ role: 'assistant', ...reply })
    } finally {
      setStreaming('')
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  const newChat = () => {
    resetAgent()
    clear()
    inputRef.current?.focus()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    send(draft)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') close()
    // Enter sends, Shift+Enter adds a line — as in most chat apps.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send(draft)
    }
  }

  return (
    <>
      <SelectionAskButton />
      <Portal>
        <Transition mounted={isOpen} transition="slide-left" duration={250} timingFunction="ease">
          {(styles) => (
            <Box
              component="aside"
              aria-label="CoreMind assistant"
              {...{ [COREMIND_ROOT_ATTR]: true }}
              pos="fixed"
              top={0}
              right={0}
              w={{ base: '100%', sm: CHAT_PANEL_WIDTH }}
              bg="var(--core-surface-0)"
              style={{
                ...styles,
                bottom: 'var(--app-shell-footer-height, 0px)',
                zIndex: 150,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid var(--app-shell-border-color)',
              }}
            >
              <PanelHeader onNewChat={newChat} onClose={close} />

              <Box px="sm" pt="xs">
                <SegmentedControl
                  fullWidth
                  size="xs"
                  value={mode}
                  onChange={(value) => setMode(value as CoreMindMode)}
                  data={[
                    { label: 'Agent', value: 'agent' },
                    { label: 'Commands', value: 'commands' },
                  ]}
                  aria-label="CoreMind mode"
                />
              </Box>
              {mode === 'commands' && <LocalAIToggle />}

              <ScrollArea flex={1} viewportRef={viewportRef} px="md" py="sm" type="scroll">
                {conversation.length === 0 && !streaming ? (
                  <EmptyState mode={mode} onPick={send} />
                ) : (
                  <Stack gap="lg" pb="sm">
                    {conversation.map((message) => (
                      <MessageItem key={message.id} message={message} />
                    ))}
                    {streaming && (
                      <AssistantRow>
                        <Badge size="xs" variant="light" color="grape" mb={4}>
                          local AI
                        </Badge>
                        <Text size="sm" style={{ whiteSpace: 'pre-line' }} aria-live="polite">
                          {streaming}
                        </Text>
                      </AssistantRow>
                    )}
                  </Stack>
                )}
              </ScrollArea>

              <Box px="sm" pb="xs">
                <Paper
                  component="form"
                  onSubmit={handleSubmit}
                  withBorder
                  radius="lg"
                  p={8}
                  bg="var(--core-surface-1)"
                >
                  {attachment && (
                    <Group
                      gap={6}
                      wrap="nowrap"
                      align="flex-start"
                      mb={6}
                      p={6}
                      style={{
                        borderRadius: 'var(--mantine-radius-sm)',
                        background: 'var(--core-surface-0)',
                      }}
                    >
                      <CoreIcon
                        icon={<IconQuote />}
                        size={14}
                        color="var(--mantine-color-dimmed)"
                      />
                      <Text size="xs" c="dimmed" lineClamp={3} flex={1}>
                        {attachment}
                      </Text>
                      <CloseButton
                        size="xs"
                        aria-label="Remove selected text"
                        onClick={clearAttachment}
                      />
                    </Group>
                  )}
                  <Textarea
                    ref={inputRef}
                    variant="unstyled"
                    autosize
                    minRows={1}
                    maxRows={6}
                    size="sm"
                    px={4}
                    placeholder={
                      attachment
                        ? 'Ask about the selected text…'
                        : mode === 'agent'
                          ? 'Ask CoreMind'
                          : 'Try "go to benchmarks"'
                    }
                    aria-label="Message CoreMind"
                    value={draft}
                    onChange={(event) => setDraft(event.currentTarget.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Group justify="space-between" mt={4} wrap="nowrap">
                    <Tooltip label="CoreMind is told which page you're on">
                      <Badge
                        variant="default"
                        size="sm"
                        radius="xl"
                        tt="none"
                        fw={500}
                        leftSection={<CoreIcon icon={<IconFileText />} size={12} />}
                      >
                        {pageLabel(ctx.pathname)}
                      </Badge>
                    </Tooltip>
                    {activeRunId ? (
                      <Tooltip label="Stop">
                        <ActionIcon
                          radius="xl"
                          size="md"
                          variant="filled"
                          color="gray"
                          aria-label="Stop"
                          onClick={() => cancelRun(activeRunId)}
                        >
                          <StopIcon />
                        </ActionIcon>
                      </Tooltip>
                    ) : (
                      <ActionIcon
                        type="submit"
                        radius="xl"
                        size="md"
                        aria-label="Send"
                        loading={busy}
                        disabled={!draft.trim()}
                      >
                        <CoreIcon icon={<IconArrowUp />} size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                </Paper>
                <Text size="10px" c="dimmed" ta="center" mt={6}>
                  CoreMind can make mistakes — check important results.
                  {mode === 'agent' && AGENT_TRANSPORT_MODE === 'mock' && ' Demo backend.'}
                </Text>
              </Box>
            </Box>
          )}
        </Transition>
      </Portal>
    </>
  )
}

/** Header-bar button that opens and closes the panel. */
export const CoreMindToggleButton = () => {
  const isOpen = useCoreMindStore((s) => s.isOpen)
  const toggle = useCoreMindStore((s) => s.toggle)
  return (
    <Tooltip label={isOpen ? 'Close CoreMind (Ctrl+K)' : 'Ask CoreMind (Ctrl+K)'}>
      <ActionIcon
        {...{ [COREMIND_ROOT_ATTR]: true }}
        variant={isOpen ? 'light' : 'subtle'}
        size="lg"
        radius="xl"
        aria-label={isOpen ? 'Close CoreMind' : 'Open CoreMind'}
        aria-pressed={isOpen}
        onClick={toggle}
      >
        <CoreIcon icon={<IconSparkles />} size={20} />
      </ActionIcon>
    </Tooltip>
  )
}

const PanelHeader = ({ onNewChat, onClose }: { onNewChat: () => void; onClose: () => void }) => (
  <Group
    justify="space-between"
    px="sm"
    style={{
      minHeight: 'calc(52px * var(--mantine-scale))',
      borderBottom: '1px solid var(--app-shell-border-color)',
    }}
  >
    <Group gap={8}>
      <CoreIcon icon={<IconSparkles />} size={18} color="var(--mantine-primary-color-filled)" />
      <Text fw={600} size="md">
        CoreMind
      </Text>
    </Group>
    <Group gap={2}>
      <Tooltip label="New chat">
        <ActionIcon variant="subtle" color="gray" aria-label="New chat" onClick={onNewChat}>
          <CoreIcon icon={<IconMessagePlus />} size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Close">
        <ActionIcon variant="subtle" color="gray" aria-label="Close CoreMind" onClick={onClose}>
          <CoreIcon icon={<IconX />} size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  </Group>
)

const EmptyState = ({ mode, onPick }: { mode: CoreMindMode; onPick: (text: string) => void }) => (
  <Stack gap="lg" pt="xl">
    <Box>
      <Text
        fz={28}
        fw={600}
        lh={1.2}
        variant="gradient"
        gradient={{ from: 'indigo.4', to: 'cyan.4', deg: 90 }}
      >
        Hello
      </Text>
      <Text fz={22} fw={500} c="dimmed" lh={1.3}>
        How can I help today?
      </Text>
      <Text size="sm" c="dimmed" mt="sm">
        {MODE_HINT[mode]}
      </Text>
    </Box>
    <Stack gap={8}>
      {SUGGESTIONS[mode].map((suggestion) => (
        <UnstyledButton
          key={suggestion}
          onClick={() => onPick(suggestion)}
          px="sm"
          py={10}
          style={{
            borderRadius: 'var(--mantine-radius-md)',
            border: '1px solid var(--app-shell-border-color)',
            background: 'var(--core-surface-1)',
          }}
        >
          <Text size="sm">{suggestion}</Text>
        </UnstyledButton>
      ))}
    </Stack>
    {mode === 'agent' && (
      <Text size="xs" c="dimmed">
        Tip: highlight any text on the page and click “Ask CoreMind” to ask about it.
      </Text>
    )}
  </Stack>
)

const AssistantRow = ({ children }: { children: ReactNode }) => (
  <Group gap={10} wrap="nowrap" align="flex-start">
    <Box pt={2} style={{ flexShrink: 0 }}>
      <CoreIcon icon={<IconSparkles />} size={18} color="var(--mantine-primary-color-filled)" />
    </Box>
    <Box miw={0} flex={1}>
      {children}
    </Box>
  </Group>
)

const MessageItem = ({ message }: { message: ChatMessage }) => {
  if (message.role === 'user') {
    return (
      <Box
        maw="85%"
        px="sm"
        py={8}
        style={{
          alignSelf: 'flex-end',
          borderRadius: 'var(--mantine-radius-lg)',
          background: 'var(--core-surface-1)',
        }}
      >
        {message.quote && (
          <Text
            size="xs"
            c="dimmed"
            lineClamp={3}
            mb={4}
            pl={8}
            style={{ borderLeft: '2px solid var(--mantine-primary-color-filled)' }}
          >
            {message.quote}
          </Text>
        )}
        <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
          {message.text}
        </Text>
      </Box>
    )
  }

  if (message.agentRun) {
    return (
      <AssistantRow>
        <AgentRunView messageId={message.id} />
      </AssistantRow>
    )
  }

  const showToolBadge = message.tool && message.tool !== 'help'
  return (
    <AssistantRow>
      {(showToolBadge || message.source === 'local-ai') && (
        <Group gap={4} mb={4}>
          {showToolBadge && (
            <Badge size="xs" variant="light">
              {message.tool}
            </Badge>
          )}
          {message.source === 'local-ai' && (
            <Badge size="xs" variant="light" color="grape">
              local AI
            </Badge>
          )}
        </Group>
      )}
      <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
        {message.text}
      </Text>
    </AssistantRow>
  )
}
