import { useEffect, useRef, useState } from 'react'
import { Container, Group, Stack, Text, ThemeIcon } from '@mantine/core'
import { IconAlertTriangle, IconLayoutGrid, IconStarFilled } from '@tabler/icons-react'
import { PageShell } from '@/app/layout/PageShell'
import { CoreIcon } from '@/shared/ui'
import { BlogHero } from './components/BlogHero'
import { ImpactStats } from './components/ImpactStats'
import { FeaturedPostCard } from './components/FeaturedPostCard'
import { BlogsGrid } from './components/BlogsGrid'
import { BlogArticle } from './components/BlogArticle'
import { BLOG_POSTS } from './constants'

type SectionHeadingProps = {
  icon: typeof IconStarFilled
  title: string
  subtitle: string
}

/** Icon + title + subtitle heading used to separate the page's sections. */
const SectionHeading = ({ icon: Icon, title, subtitle }: SectionHeadingProps) => (
  <Group gap="sm" wrap="nowrap">
    <ThemeIcon variant="light" color="indigo" size={34} radius="md">
      <CoreIcon icon={<Icon aria-hidden />} size={17} />
    </ThemeIcon>
    <Stack gap={0}>
      <Text fw={700} fz="md" lh={1.2}>
        {title}
      </Text>
      <Text size="xs" c="dimmed">
        {subtitle}
      </Text>
    </Stack>
  </Group>
)

/**
 * Blogs. Two views behind one panel: the index (hero, impact stats, featured
 * post, full grid) and the reading view for a single post. Selecting a card
 * swaps to the article and scrolls back to the top of the panel.
 */
export const BlogsPage = () => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const featured = BLOG_POSTS.find((post) => post.featured) ?? BLOG_POSTS[0]
  const restCount = BLOG_POSTS.length - 1
  const activeIndex = BLOG_POSTS.findIndex((post) => post.id === activeId)
  const activePost = activeIndex === -1 ? undefined : BLOG_POSTS[activeIndex]

  // The panel lives inside the app's ScrollArea, so reset scroll on view change
  // rather than relying on window.scrollTo.
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start' })
  }, [activeId])

  return (
    <PageShell>
      <Container fluid pt="lg" px="lg" pb="xl">
        <div ref={topRef} />

        {activePost ? (
          <BlogArticle
            post={activePost}
            previous={activeIndex > 0 ? BLOG_POSTS[activeIndex - 1] : undefined}
            next={activeIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[activeIndex + 1] : undefined}
            onBack={() => setActiveId(null)}
            onNavigate={setActiveId}
          />
        ) : (
          <Stack gap={40}>
            <BlogHero />

            <Stack gap="md">
              <SectionHeading
                icon={IconAlertTriangle}
                title="Why this matters"
                subtitle="The cost of running an unmeasured cluster, in three numbers"
              />
              <ImpactStats />
            </Stack>

            <Stack gap="md" id="featured-post">
              <SectionHeading
                icon={IconStarFilled}
                title="Start here"
                subtitle="The foundational read before the deep-dives"
              />
              <FeaturedPostCard post={featured} onOpen={setActiveId} />
            </Stack>

            <Stack gap="md" id="all-posts">
              <SectionHeading
                icon={IconLayoutGrid}
                title="All posts"
                subtitle={`${restCount} more ${restCount === 1 ? 'article' : 'articles'} across every topic`}
              />
              <BlogsGrid excludeId={featured.id} onOpen={setActiveId} />
            </Stack>
          </Stack>
        )}
      </Container>
    </PageShell>
  )
}
