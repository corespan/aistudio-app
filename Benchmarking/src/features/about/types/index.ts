import type { ComponentType } from 'react'
import type { IconProps } from '@tabler/icons-react'

// StatTile
export type StatTileProps = {
  icon: ComponentType<IconProps>
  label: string
  value: string
  delta?: string
}

// StageBox / PipelineDiagram / VersionRow
export type Stage = {
  icon: ComponentType<IconProps>
  label: string
  /** Small chips rendered inside the stage box for multi-part stages (e.g. GPU x4). */
  sub?: string[]
}

export type Version = {
  badge: string
  title: string
  description: string
  icon: ComponentType<IconProps>
  stages: Stage[]
}

export type PipelineDiagramProps = {
  stages: Stage[]
}

export type VersionRowProps = {
  version: Version
}
