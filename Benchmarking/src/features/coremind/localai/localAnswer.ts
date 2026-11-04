import { getLocalEngine } from './localEngine'

/** What the local model knows about the app, so answers stay on topic. */
export const ANSWER_SYSTEM_PROMPT = [
  'You are CoreMind, the assistant inside CoreSpan AI Studio — a web app for running and',
  'comparing AI model benchmarks on GPUs, launching Jupyter notebooks, and reading CoreSpan blog posts.',
  'Useful terms: TTFT = time to first token (how fast a reply starts); TPOT = time per output token',
  '(how fast each next word comes); throughput = tokens generated per second.',
  '',
  'Answer the question briefly (2–4 sentences) in plain, simple language.',
  'You cannot perform actions in this answer. If the user asked you to do something in the app,',
  'say you cannot do that from chat yet and suggest typing "help".',
  'If you do not know the answer, say so — never invent facts.',
].join('\n')

/**
 * Answer a free-form question with the local model, e.g. "what is a GPU?".
 * `onPartial` receives the growing reply so the chat can show it word by word.
 */
export const localAnswer = async (
  question: string,
  pathname: string,
  onPartial?: (textSoFar: string) => void,
): Promise<string> => {
  const engine = await getLocalEngine()
  const stream = await engine.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `${ANSWER_SYSTEM_PROMPT}\nThe user is on the page "${pathname}".`,
      },
      { role: 'user', content: question },
    ],
    stream: true,
    temperature: 0.3, // focused, not random
    max_tokens: 300, // hard stop, so it can never ramble on
    extra_body: { enable_thinking: false }, // Qwen3: skip the slow "thinking" step
  })
  let text = ''
  for await (const chunk of stream) {
    text += chunk.choices[0]?.delta?.content ?? ''
    onPartial?.(text)
  }
  return text.trim()
}
