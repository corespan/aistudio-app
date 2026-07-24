import { Box, Flex, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { PipelineDiagram } from './PipelineDiagram'
import type { VersionRowProps } from '../types'

export const VersionRow = ({ version }: VersionRowProps) => (
  <Stack gap="md">
    <Flex gap="lg" align="flex-start" wrap="nowrap">
      <ThemeIcon
        size={44}
        radius="md"
        variant="light"
        color="indigo"
        flex="0 0 auto"
        pos="relative"
        style={{ zIndex: 1 }}
      >
        <version.icon size={22} />
      </ThemeIcon>

      <Stack gap={2}>
        <Text size="xs" fw={700} c="indigo" tt="uppercase">
          {version.badge}
        </Text>
        <Title order={3} fz={18}>
          {version.title}
        </Title>
        <Text size="xs" c="dimmed">
          {version.description}
        </Text>
      </Stack>
    </Flex>

    <Box pl={60}>
      <PipelineDiagram stages={version.stages} />
    </Box>
  </Stack>
)
