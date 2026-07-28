import {
  Alert,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Code,
  Divider,
  Group,
  List,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconArrowRight,
  IconBulb,
  IconCalendar,
  IconCircleCheck,
  IconClockHour4,
  IconInfoCircle,
  IconStarFilled,
} from '@tabler/icons-react'
import type { BlogChapter, BlogPost, BlogSection } from '../types'
import { BLOG_POSTS, CATEGORY_ICON_BY_LABEL, CATEGORY_STYLES } from '../constants'
import { formatDate, gradientBackground } from '../utils'

type BlogArticleProps = {
  post: BlogPost
  /** Sibling posts for the prev/next footer, in display order. */
  previous?: BlogPost
  next?: BlogPost
  onBack: () => void
  onNavigate: (id: string) => void
}

/** Full reading view for a single post — gradient masthead, takeaways, chapters, prev/next. */
export const BlogArticle = ({ post, previous, next, onBack, onNavigate }: BlogArticleProps) => {
  const style = CATEGORY_STYLES[post.category] ?? CATEGORY_STYLES.All
  const CategoryIcon = CATEGORY_ICON_BY_LABEL[post.category] ?? IconStarFilled
  const isMultiChapter = post.chapters.length > 1

  return (
    <Stack gap="xl">
      <Button
        variant="subtle"
        color="gray"
        size="sm"
        leftSection={<IconArrowLeft size={15} aria-hidden />}
        onClick={onBack}
        w="fit-content"
      >
        All posts
      </Button>

      {/* Masthead: same gradient language as the cards this was opened from. */}
      <Box
        pos="relative"
        p={{ base: 'lg', sm: 40 }}
        style={{
          borderRadius: 'var(--mantine-radius-lg)',
          overflow: 'hidden',
          background: gradientBackground(style),
        }}
      >
        <CategoryIcon
          size={220}
          stroke={1}
          color="white"
          aria-hidden
          style={{
            opacity: 0.16,
            position: 'absolute',
            top: -40,
            right: -30,
            transform: 'rotate(-10deg)',
            pointerEvents: 'none',
          }}
        />

        <Stack gap="md" pos="relative" maw={760}>
          <Group gap="xs">
            <Badge variant="white" color={style.color} radius="sm" size="sm">
              {post.category}
            </Badge>
            {isMultiChapter && (
              <Badge
                variant="white"
                color={style.color}
                radius="sm"
                size="sm"
                leftSection={<IconStarFilled size={10} aria-hidden />}
              >
                {post.chapters.length}-part read
              </Badge>
            )}
          </Group>

          <Title order={1} fz={{ base: 26, sm: 36 }} lh={1.15} c="white">
            {post.title}
          </Title>

          <Text fz={{ base: 'sm', sm: 'md' }} c="white" opacity={0.85}>
            {post.excerpt}
          </Text>

          <Group gap="lg" mt="xs">
            <Group gap="sm">
              <Avatar name={post.author} color="white" variant="filled" radius="xl" size="md" />
              <Stack gap={0}>
                <Text size="sm" fw={700} c="white">
                  {post.author}
                </Text>
                <Text size="xs" c="white" opacity={0.8}>
                  {post.authorRole}
                </Text>
              </Stack>
            </Group>

            <Group gap="xs" c="white" opacity={0.85}>
              <IconCalendar size={14} aria-hidden />
              <Text size="xs">{formatDate(post.date)}</Text>
            </Group>

            <Group gap="xs" c="white" opacity={0.85}>
              <IconClockHour4 size={14} aria-hidden />
              <Text size="xs">{post.readMinutes} min read</Text>
            </Group>
          </Group>
        </Stack>
      </Box>

      {post.takeaways.length > 0 && (
        <Paper withBorder radius="md" p="lg">
          <Group gap="sm" mb="sm">
            <ThemeIcon variant="light" color={style.color} size={30} radius="md">
              <IconBulb size={16} aria-hidden />
            </ThemeIcon>
            <Text fw={700} fz="sm">
              Key takeaways
            </Text>
          </Group>
          <List
            spacing="xs"
            size="sm"
            icon={
              <ThemeIcon variant="light" color={style.color} size={18} radius="xl">
                <IconCircleCheck size={12} aria-hidden />
              </ThemeIcon>
            }
          >
            {post.takeaways.map((takeaway) => (
              <List.Item key={takeaway}>{takeaway}</List.Item>
            ))}
          </List>
        </Paper>
      )}

      <Stack gap={40} maw={780}>
        {post.chapters.map((chapter, index) => (
          <ArticleChapter
            key={chapter.title || index}
            chapter={chapter}
            accent={style.color}
            index={index}
            showDivider={isMultiChapter && index > 0}
            onNavigate={onNavigate}
          />
        ))}
      </Stack>

      <Group gap="xs">
        <Text size="xs" c="dimmed" fw={600} tt="uppercase">
          Tagged
        </Text>
        {post.tags.map((tag) => (
          <Badge key={tag} variant="outline" color="gray" radius="sm" size="sm">
            {tag}
          </Badge>
        ))}
      </Group>

      <Divider />

      <Group grow align="stretch" wrap="wrap">
        {previous ? (
          <SiblingLink direction="previous" post={previous} onNavigate={onNavigate} />
        ) : (
          <Box />
        )}
        {next ? <SiblingLink direction="next" post={next} onNavigate={onNavigate} /> : <Box />}
      </Group>
    </Stack>
  )
}

type BlogSectionAccent = (typeof CATEGORY_STYLES)[string]['color']

const ArticleChapter = ({
  chapter,
  accent,
  index,
  showDivider,
  onNavigate,
}: {
  chapter: BlogChapter
  accent: BlogSectionAccent
  index: number
  showDivider: boolean
  onNavigate: (id: string) => void
}) => (
  <Stack gap={28}>
    {showDivider && <Divider />}
    {chapter.title && (
      <Group gap="sm" wrap="nowrap">
        <Badge variant="filled" color={accent} radius="sm" size="sm">
          Part {index + 1}
        </Badge>
        <Title order={2} fz={{ base: 20, sm: 24 }} lh={1.25}>
          {chapter.title}
        </Title>
      </Group>
    )}
    {chapter.sections.map((section) => (
      <ArticleSection
        key={section.heading}
        section={section}
        accent={accent}
        onNavigate={onNavigate}
      />
    ))}
  </Stack>
)

const ArticleSection = ({
  section,
  accent,
  onNavigate,
}: {
  section: BlogSection
  accent: BlogSectionAccent
  onNavigate: (id: string) => void
}) => {
  const relatedPost = section.relatedPostId
    ? BLOG_POSTS.find((post) => post.id === section.relatedPostId)
    : undefined

  return (
    <Stack gap="sm">
      <Title order={3} fz={{ base: 17, sm: 20 }} lh={1.3}>
        {section.heading}
      </Title>

      {section.paragraphs?.map((paragraph) => (
        <Text key={paragraph} fz="sm" lh={1.7} c="var(--mantine-color-text)">
          {paragraph}
        </Text>
      ))}

      {section.table && (
        <ScrollArea type="auto" mt={2}>
          <Table withTableBorder withColumnBorders striped highlightOnHover w="100%">
            <Table.Thead>
              <Table.Tr>
                {section.table.headers.map((header) => (
                  <Table.Th key={header}>{header}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {section.table.rows.map((row) => (
                <Table.Tr key={row.join('|')}>
                  {row.map((cell, cellIndex) => (
                    <Table.Td key={cellIndex}>{cell}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}

      {section.code?.map((block, blockIndex) => (
        <Stack key={blockIndex} gap={4}>
          {block.label && (
            <Text size="xs" c="dimmed" fw={600}>
              {block.label}
            </Text>
          )}
          <Code block>{block.lines.join('\n')}</Code>
        </Stack>
      ))}

      {section.points && section.points.length > 0 && (
        <List
          type={section.ordered ? 'ordered' : 'unordered'}
          spacing="sm"
          size="sm"
          mt={4}
          withPadding
        >
          {section.points.map((point) => (
            <List.Item key={point.text}>
              {point.term && (
                <Text component="span" fw={700} inherit>
                  {point.term}:{' '}
                </Text>
              )}
              <Text component="span" inherit lh={1.7}>
                {point.text}
              </Text>
            </List.Item>
          ))}
        </List>
      )}

      {section.callout && (
        <Alert
          variant="light"
          color={accent}
          radius="md"
          mt={4}
          title={section.callout.title}
          icon={<IconInfoCircle size={16} aria-hidden />}
        >
          <Text fz="sm" lh={1.65}>
            {section.callout.text}
          </Text>
        </Alert>
      )}

      {relatedPost && (
        <Anchor
          component="button"
          type="button"
          fz="sm"
          fw={600}
          c={accent}
          onClick={() => onNavigate(relatedPost.id)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          {section.relatedLabel ?? `Read: ${relatedPost.title}`}
          <IconArrowRight size={14} aria-hidden />
        </Anchor>
      )}
    </Stack>
  )
}

const SiblingLink = ({
  direction,
  post,
  onNavigate,
}: {
  direction: 'previous' | 'next'
  post: BlogPost
  onNavigate: (id: string) => void
}) => {
  const isNext = direction === 'next'

  return (
    <Card withBorder padding="md" radius="md" ta={isNext ? 'right' : 'left'}>
      <Stack gap={6}>
        <Group gap={6} justify={isNext ? 'flex-end' : 'flex-start'} c="dimmed">
          {!isNext && <IconArrowLeft size={13} aria-hidden />}
          <Text size="xs" fw={600} tt="uppercase">
            {isNext ? 'Next' : 'Previous'}
          </Text>
          {isNext && <IconArrowRight size={13} aria-hidden />}
        </Group>
        <Anchor
          component="button"
          type="button"
          fw={600}
          fz="sm"
          onClick={() => onNavigate(post.id)}
        >
          {post.title}
        </Anchor>
      </Stack>
    </Card>
  )
}
