import { SimpleGrid } from '@mantine/core'
import { BlogCard } from './BlogCard'
import { BLOG_POSTS } from '../constants'

type BlogsGridProps = {
  excludeId?: string
  onOpen: (id: string) => void
}

/** Every non-featured post, rendered as a plain card grid — no filtering. */
export const BlogsGrid = ({ excludeId, onOpen }: BlogsGridProps) => {
  const posts = BLOG_POSTS.filter((post) => post.id !== excludeId)

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" verticalSpacing="xl">
      {posts.map((post, index) => (
        <BlogCard key={post.id} post={post} index={index + 1} onOpen={onOpen} />
      ))}
    </SimpleGrid>
  )
}
