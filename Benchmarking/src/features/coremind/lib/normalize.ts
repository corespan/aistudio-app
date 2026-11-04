/**
 * Synonym + typo normalisation, run before `parseCommand` so its rules only
 * have to know one word per concept. "navigate to the articles", "take me to
 * blgs" and "open blogs" all normalise to "go to the blogs".
 *
 * Multi-word phrases are rewritten first (longest first), then each remaining
 * token is snapped to its canonical word — exactly, or within a small edit
 * distance to absorb typos.
 */

/** Canonical word → the phrases and words that mean the same thing. */
const SYNONYMS: Record<string, string[]> = {
  go: [
    'navigate',
    'goto',
    'move',
    'head',
    'jump',
    'take',
    'bring',
    'visit',
    'open',
    'show',
    'display',
    'view',
    'load',
    'switch',
    'see',
    'find',
    'where is',
  ],
  launch: ['fire up', 'spin up', 'boot'],
  start: [
    'begin',
    'kick off',
    'kickoff',
    'create',
    'new',
    'run',
    'trigger',
    'execute',
    'initiate',
    'schedule',
    'add',
  ],
  reset: ['clear', 'remove', 'wipe', 'erase', 'delete', 'drop', 'undo', 'unset', 'clean'],
  filters: ['filter', 'filtering'],
  back: ['previous', 'prior', 'return', 'last page', 'previous page'],
  benchmarks: [
    'benchmark',
    'benchmarking',
    'bench',
    'benches',
    'performance',
    'perf',
    'dashboard',
    'home',
    'main',
    'landing',
    'results',
    'runs',
    'metrics',
    'homepage',
  ],
  blogs: [
    'blog',
    'articles',
    'article',
    'posts',
    'post',
    'news',
    'writeups',
    'writeup',
    'stories',
    'story',
    'publications',
    'insights',
    'reads',
  ],
  about: [
    'about us',
    'company',
    'team',
    'who are you',
    'who we are',
    'information',
    'info',
    'corespan',
  ],
  jupyter: ['notebook', 'notebooks', 'jupyterlab', 'lab', 'ipython'],
  read: ['read', 'learn about', 'tell me about'],
  dark: ['night', 'black', 'dim'],
  light: ['day', 'white', 'bright'],
  theme: ['mode', 'appearance', 'colors', 'colours', 'scheme', 'color scheme'],
  toggle: ['flip', 'invert', 'change'],
  help: [
    'what can you do',
    'commands',
    'options',
    'how does this work',
    'assist',
    'guide',
    'usage',
  ],
  throughput: ['tokens per second', 'tok s', 'tps'],
  ttft: ['time to first token', 'first token'],
  tpot: ['time per output token', 'per token'],
}

const PHRASES = Object.entries(SYNONYMS)
  .flatMap(([canonical, words]) => words.filter((w) => w.includes(' ')).map((w) => [w, canonical]))
  .sort(([a], [b]) => b.length - a.length)

const WORDS = new Map<string, string>(
  Object.entries(SYNONYMS).flatMap(([canonical, words]) => [
    [canonical, canonical] as [string, string],
    ...words.filter((w) => !w.includes(' ')).map((w) => [w, canonical] as [string, string]),
  ]),
)

/** Whether a word is already part of the synonym vocabulary ("take", "show", ...). */
export const isVocabularyWord = (word: string) => WORDS.has(word.toLowerCase())

/**
 * Damerau (optimal string alignment) distance — like Levenshtein, but swapping
 * two adjacent letters costs 1, since "strat"/"opne" are the commonest typos.
 */
export const editDistance = (a: string, b: string) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

/** Typos tolerated: none for short words (too many false hits), 1 for medium, 2 for long. */
export const maxTypos = (word: string) => (word.length <= 3 ? 0 : word.length <= 6 ? 1 : 2)

const canonicalWord = (token: string) => {
  const exact = WORDS.get(token)
  if (exact) return exact
  const budget = maxTypos(token)
  if (budget === 0) return token
  let best: { canonical: string; distance: number } | undefined
  for (const [word, canonical] of WORDS) {
    if (Math.abs(word.length - token.length) > budget || word.length <= 3) continue
    const distance = editDistance(token, word)
    if (distance <= budget && (!best || distance < best.distance)) best = { canonical, distance }
  }
  return best?.canonical ?? token
}

/** Lowercase, strip punctuation, rewrite synonyms/typos to canonical words. */
export const normalize = (input: string): string => {
  let text = ` ${input
    .toLowerCase()
    .replace(/[^a-z0-9\s?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
  for (const [phrase, canonical] of PHRASES) {
    text = text.replaceAll(` ${phrase} `, ` ${canonical} `)
  }
  return text.trim().split(' ').filter(Boolean).map(canonicalWord).join(' ')
}
