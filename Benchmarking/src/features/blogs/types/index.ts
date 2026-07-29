import type { ComponentType } from 'react'
import type { MantineColor, MantineGradient } from '@mantine/core'
import type { IconProps } from '@tabler/icons-react'

/** Drives `CATEGORY_ICON_BY_LABEL` — the icon shown per category on cards/covers. */
export type BlogCategory = {
  label: string
  icon: ComponentType<IconProps>
}

/** Visual identity for a category — drives cover gradients, badges, icons. All Mantine tokens, no external assets. */
export type CategoryStyle = {
  gradient: MantineGradient
  color: MantineColor
}

/** A headline figure pulled out of a post and shown as a large stat. */
export type ImpactStat = {
  value: string
  label: string
  detail: string
  icon: ComponentType<IconProps>
  color: MantineColor
}

/** A labelled point within a section — `term` renders bold, ahead of `text`. */
export type BlogPoint = {
  term?: string
  text: string
}

/** A fenced code / shell / ASCII-diagram block within a section. */
export type BlogCodeBlock = {
  label?: string
  lines: string[]
}

/** A markdown table within a section. */
export type BlogTable = {
  headers: string[]
  rows: string[][]
}

/** A supporting diagram/screenshot within a section. Path is relative to `public/`. */
export type BlogImage = {
  src: string
  alt: string
  /** Small eyebrow label shown above the frame, e.g. "System Architecture". */
  eyebrow?: string
  caption?: string
  /** Optional legend chips below the caption, e.g. naming the halves of a diagram. */
  legend?: { label: string; color: MantineColor }[]
}

/** One heading-level chunk of an article body. */
export type BlogSection = {
  heading: string
  paragraphs?: string[]
  points?: BlogPoint[]
  /** Render `points` as a numbered list instead of a checklist. */
  ordered?: boolean
  code?: BlogCodeBlock[]
  table?: BlogTable
  image?: BlogImage
  /** Key into the named-diagram registry (e.g. 'agent-architecture') for a native, non-raster flow diagram. */
  diagram?: string
  /** Highlighted aside rendered as an Alert. */
  callout?: { title: string; text: string }
  /** Post this section should link out to (e.g. "next in the series"). */
  relatedPostId?: string
  relatedLabel?: string
}

/** One named part of a combined multi-source article (e.g. two original posts merged into one read). */
export type BlogChapter = {
  title: string
  sections: BlogSection[]
}

/** A single blog post. Content is sourced from the uploaded Corespan markdown articles. */
export type BlogPost = {
  id: string
  title: string
  excerpt: string
  category: string
  tags: string[]
  author: string
  authorRole: string
  date: string
  readMinutes: number
  featured?: boolean
  /** Short bullets shown above the article body. */
  takeaways: string[]
  /** Chapters making up the article. A single-source post has exactly one, untitled chapter. */
  chapters: BlogChapter[]
}
