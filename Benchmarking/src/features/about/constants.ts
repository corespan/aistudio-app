import {
  IconAdjustmentsHorizontal,
  IconBolt,
  IconBrain,
  IconChartDots,
  IconCloudNetwork,
  IconCpu,
  IconDatabase,
  IconRocket,
  IconRoute,
  IconServer,
  IconServerBolt,
  IconSitemap,
  IconStack2,
  IconUser,
  IconWorld,
} from '@tabler/icons-react'
import type { Version } from './types'

// AboutHero
export const BRAND_GRADIENT = { from: 'indigo', to: 'cyan', deg: 135 } as const

export const HIGHLIGHTS = [
  { label: 'Multi-node orchestration', icon: IconCloudNetwork },
  { label: 'Real-time metrics', icon: IconBolt },
  { label: 'GPU-aware scheduling', icon: IconServerBolt },
]

export const ORBIT_ICONS = [IconCloudNetwork, IconDatabase, IconChartDots, IconServerBolt]

// PlatformEvolutionTimeline
export const PLATFORM_EVOLUTION_VERSIONS: Version[] = [
  {
    badge: 'Version 1',
    title: 'Foundation',
    description: 'Single-node benchmarking with core AI workloads and basic metrics.',
    icon: IconDatabase,
    stages: [
      { icon: IconUser, label: 'Client' },
      { icon: IconRoute, label: 'API Gateway' },
      { icon: IconAdjustmentsHorizontal, label: 'Scheduler' },
      { icon: IconServer, label: 'Worker Node', sub: ['GPU'] },
      { icon: IconDatabase, label: 'Metrics Store' },
    ],
  },
  {
    badge: 'Version 2',
    title: 'Scale & Orchestration',
    description: 'Multi-node orchestration with parallel workloads and advanced reporting.',
    icon: IconStack2,
    stages: [
      { icon: IconUser, label: 'Client' },
      { icon: IconRoute, label: 'API Gateway' },
      { icon: IconSitemap, label: 'Orchestrator', sub: ['Scheduler', 'Allocator'] },
      { icon: IconServer, label: 'Worker Nodes', sub: ['GPU', 'GPU', 'GPU', 'GPU'] },
      { icon: IconDatabase, label: 'Metrics Store' },
    ],
  },
  {
    badge: 'Version 3',
    title: 'Intelligence & Optimization',
    description: 'AI-powered insights, GPU-aware scheduling, and cost performance modeling.',
    icon: IconBrain,
    stages: [
      { icon: IconUser, label: 'Client' },
      { icon: IconRoute, label: 'API Gateway' },
      { icon: IconBrain, label: 'AI Engine' },
      { icon: IconAdjustmentsHorizontal, label: 'Smart Scheduler' },
      { icon: IconCpu, label: 'GPU Pool', sub: ['GPU', 'GPU', 'GPU', 'GPU'] },
      { icon: IconDatabase, label: 'Metrics Store', sub: ['Feature Store'] },
    ],
  },
  {
    badge: 'Future Vision',
    title: 'Autonomous Infrastructure',
    description: 'Self-optimizing infrastructure with autonomous scaling and remediation.',
    icon: IconRocket,
    stages: [
      { icon: IconUser, label: 'Client' },
      { icon: IconBrain, label: 'Intelligent Control Plane', sub: ['Predict', 'Decide', 'Act'] },
      { icon: IconWorld, label: 'Global Orchestrator' },
      { icon: IconCpu, label: 'Dynamic GPU Fabric', sub: ['GPU', 'GPU', 'GPU', 'GPU', 'GPU'] },
      { icon: IconChartDots, label: 'Observability', sub: ['Data Lake'] },
    ],
  },
]
