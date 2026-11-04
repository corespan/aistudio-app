import { BLOG_POSTS } from '@/features/blogs/constants'
import type { BlogPost } from '@/features/blogs/types'

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'on',
  'about',
  'of',
  'to',
  'and',
  'in',
  'for',
  'with',
  'how',
  'me',
  'post',
  'blog',
  'article',
])

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token))

/**
 * Best-matching blog post for a free-text query, scored by token overlap —
 * title words count double, tags/id once. Returns undefined when nothing overlaps.
 */
export const findBlogPost = (query: string): BlogPost | undefined => {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return undefined

  let best: { post: BlogPost; score: number } | undefined
  for (const post of BLOG_POSTS) {
    const title = new Set(tokenize(post.title))
    const meta = new Set(tokenize([post.id, ...post.tags].join(' ')))
    const score = queryTokens.reduce(
      (sum, token) => sum + (title.has(token) ? 2 : meta.has(token) ? 1 : 0),
      0,
    )
    if (score > 0 && (!best || score > best.score)) best = { post, score }
  }
  return best?.post
}
