import { Group, Paper } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { StageBox } from './StageBox'
import type { PipelineDiagramProps } from '../types'
import { CoreIcon } from '@/shared/ui'

export const PipelineDiagram = ({ stages }: PipelineDiagramProps) => (
  <Paper withBorder radius="md" p="md" style={{ overflowX: 'auto' }}>
    <Group gap={6} wrap="nowrap" align="center">
      {stages.map((stage, i) => (
        <Group key={stage.label} gap={6} wrap="nowrap" align="center">
          <StageBox {...stage} />
          {i < stages.length - 1 && (
            <CoreIcon icon={<IconArrowRight />} size={16} color="var(--mantine-color-dimmed)" />
          )}
        </Group>
      ))}
    </Group>
  </Paper>
)
