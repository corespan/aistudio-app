import { useState } from 'react'
import { Button, Group, Progress, Select, Stack, Text, TextInput } from '@mantine/core'
import { CreateMLCEngine, type MLCEngine } from '@mlc-ai/web-llm'

/** Models to try. Bigger = smarter but bigger download. */
const MODELS = [
  { value: 'SmolLM2-360M-Instruct-q4f16_1-MLC', label: 'SmolLM2 360M — tiny, rambles (~0.4 GB)' },
  {
    value: 'Qwen3-1.7B-q4f16_1-MLC',
    label: 'Qwen3 1.7B — good, the one CoreMind will use (~2 GB)',
  },
]

/** Throwaway page to feel how WebLLM works. Delete it afterwards. */
export const WebLLMPlayground = () => {
  const [model, setModel] = useState(MODELS[1].value)
  const [engine, setEngine] = useState<MLCEngine | null>(null)
  const [loadedModel, setLoadedModel] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Not loaded')
  const [question, setQuestion] = useState('Explain what a GPU is in one sentence.')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setBusy(true)
    setStatus('Downloading model… (first time only)')
    try {
      const onProgress = (report: { progress: number; text: string }) => {
        setProgress(report.progress)
        setStatus(report.text)
      }
      if (engine) {
        // Already have an engine: just swap the brain
        engine.setInitProgressCallback(onProgress)
        await engine.reload(model)
        setEngine(engine)
      } else {
        setEngine(await CreateMLCEngine(model, { initProgressCallback: onProgress }))
      }
      setLoadedModel(model)
      setStatus('Ready!')
    } catch (error) {
      setStatus(`Failed: ${(error as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const ask = async () => {
    if (!engine) return
    setAnswer('')
    setBusy(true)
    try {
      const chunks = await engine.chat.completions.create({
        messages: [
          // Instructions for the AI: keep it short and honest
          {
            role: 'system',
            content:
              'You are a helpful assistant. Answer briefly and clearly. If you do not know, say so.',
          },
          { role: 'user', content: question },
        ],
        stream: true,
        max_tokens: 200, // hard stop: never write more than ~150 words
        temperature: 0.3, // low = focused, high = creative/random
        ...(loadedModel?.startsWith('Qwen3') ? { extra_body: { enable_thinking: false } } : {}),
      })
      for await (const chunk of chunks) {
        setAnswer((previous) => previous + (chunk.choices[0]?.delta?.content ?? ''))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack maw={600} p="md">
      <Select label="Model" data={MODELS} value={model} onChange={(v) => v && setModel(v)} />
      <Button
        onClick={load}
        loading={busy && !loadedModel}
        disabled={busy || loadedModel === model}
      >
        1. Load model
      </Button>
      <Progress value={progress * 100} />
      <Text size="sm" c="dimmed">
        {status} {loadedModel && `(loaded: ${loadedModel})`}
      </Text>
      <TextInput value={question} onChange={(e) => setQuestion(e.currentTarget.value)} />
      <Group>
        <Button onClick={ask} disabled={!engine || busy}>
          2. Ask
        </Button>
        <Button
          variant="light"
          color="red"
          onClick={() => engine?.interruptGenerate()}
          disabled={!busy || !engine}
        >
          Stop
        </Button>
      </Group>
      <Text style={{ whiteSpace: 'pre-wrap' }}>{answer}</Text>
    </Stack>
  )
}
