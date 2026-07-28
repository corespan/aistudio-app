import {
  IconApps,
  IconGauge,
  IconLayersLinked,
  IconPercentage,
  IconRobot,
  IconTopologyStar3,
} from '@tabler/icons-react'
import type { BlogCategory, BlogPost, CategoryStyle, ImpactStat } from './types'
import { POST_CHAPTERS } from './content'

export const BLOG_CATEGORIES: BlogCategory[] = [
  { label: 'All', icon: IconApps },
  { label: 'Benchmarking', icon: IconGauge },
  { label: 'Hardware & Topology', icon: IconTopologyStar3 },
  { label: 'AI Assistant', icon: IconRobot },
]

// Every category gets its own gradient + accent color, all from the Mantine
// palette. Covers/badges/icons across the page render from this table instead
// of stock photography, so the whole surface stays Mantine-only.
export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  All: { gradient: { from: 'gray.6', to: 'dark.4', deg: 135 }, color: 'gray' },
  Benchmarking: { gradient: { from: 'indigo.6', to: 'blue.7', deg: 135 }, color: 'indigo' },
  'Hardware & Topology': { gradient: { from: 'teal.6', to: 'cyan.7', deg: 135 }, color: 'teal' },
  'AI Assistant': { gradient: { from: 'grape.6', to: 'violet.7', deg: 135 }, color: 'grape' },
}

export const CATEGORY_ICON_BY_LABEL = Object.fromEntries(
  BLOG_CATEGORIES.map((category) => [category.label, category.icon]),
)

/** Headline figures pulled directly from the Part 1 write-up. */
export const IMPACT_STATS: ImpactStat[] = [
  {
    value: '~35%',
    label: 'Average enterprise GPU utilization',
    detail: 'The rest is capital sitting idle behind bottlenecks nobody profiled.',
    icon: IconPercentage,
    color: 'orange',
  },
  {
    value: '3',
    label: 'Layers of validation we run',
    detail: 'Single-GPU compute, multi-node interconnect, and end-to-end workload fidelity.',
    icon: IconLayersLinked,
    color: 'indigo',
  },
  {
    value: '$M+',
    label: 'Lost to a stalled H100-class cluster',
    detail: 'A multi-month delay from broken pipelines can mean millions in unrealized revenue.',
    icon: IconGauge,
    color: 'grape',
  },
]

// Content sourced from the uploaded Corespan markdown articles: 01-BEN and
// 02-BEN are merged into one combined read; 03-REA and 04-PCI stay separate;
// 05-AI, 06-AI, and 07-AI (Parts 1-3 of one series, per their own frontmatter)
// are merged into one combined read the same way 01/02 are. No external image
// URLs anywhere — every cover and avatar is rendered from Mantine primitives.
const AUTHOR = 'Corespan Systems'
const AUTHOR_ROLE = 'Corespan Systems Engineering'

type PostMeta = Omit<BlogPost, 'chapters' | 'author' | 'authorRole'>

const POST_META: PostMeta[] = [
  {
    id: 'benchmarking-gpu-clusters',
    title: 'Benchmarking GPU Clusters: Why It Matters, and How We Built AI Studio',
    excerpt:
      'GPU infrastructure is one of the largest line items in any AI budget. Benchmarking is the only way to prove you are actually getting what you paid for — and the story of how a terminal script became a cloud-native orchestration platform.',
    category: 'Benchmarking',
    tags: [
      'benchmarking',
      'gpu',
      'mlperf',
      'ai-infrastructure',
      'mlops',
      'kubernetes',
      'vllm',
      'jax',
    ],
    date: '2026-07-22',
    readMinutes: 18,
    featured: true,
    takeaways: [
      'Average enterprise GPU utilization sits near 35% — idle GPUs are pure waste, and you cannot fix what you cannot measure.',
      'Validation runs at three layers: single-GPU compute, multi-node interconnect, and end-to-end workload fidelity via suites like MLPerf.',
      'AI Studio evolved through three versions — from Django and Celery, to Kubernetes and vLLM, to Kubeflow and JAX — turning a terminal script into an automated MLOps platform.',
      'Three core workloads — vLLM LLM inference, JAX/Flax ResNet inference, and PyTorch DDP training — isolate compute, memory, and network bottlenecks independently.',
    ],
  },
  {
    id: 'reading-pcie-enumeration-tree',
    title: 'How to Read a PCIe Enumeration Tree (with Examples)',
    excerpt:
      'A practical guide to interpreting lspci -tv output: how to locate GPUs, NVMe, and NICs, read device relationships, determine PCIe generation and link width, estimate bandwidth, and decide whether GPU Direct Storage is even possible.',
    category: 'Hardware & Topology',
    tags: ['pcie', 'gpu', 'nvme', 'gpudirect-storage', 'topology', 'tutorial'],
    date: '2026-07-10',
    readMinutes: 9,
    takeaways: [
      'lspci -tv gives you structure, not speed; lspci -vv gives you speed and width via LnkCap vs LnkSta.',
      'Same PCIe switch is the best case for peer-to-peer; different CPU sockets is the slowest.',
      'For GPU Direct Storage, the NVMe endpoint must sit in the same PCIe subtree as the GPU.',
    ],
  },
  {
    id: 'pcie-topology-in-practice',
    title: 'PCIe Topology in Practice: Bottlenecks, Gen4 vs Gen5, and GDS Readiness',
    excerpt:
      'Applying PCIe topology analysis to a real composed GPU node — how device placement determines peer-to-peer performance, where structural bottlenecks hide, and how to assess GPU Direct Storage readiness from the topology alone.',
    category: 'Hardware & Topology',
    tags: ['pcie', 'gpu', 'nvme', 'gpudirect-storage', 'topology', 'gen5'],
    date: '2026-07-15',
    readMinutes: 9,
    takeaways: [
      'Both GPUs and the NVMe sharing one PCIe switch subtree is the best-case topology for P2P and GDS.',
      'A Gen5 GPU does not speed up model load if the NVMe is stuck on Gen4 — the slowest link in the path always wins.',
      'The likely bottleneck on a shared-switch node is uplink oversubscription when GPUs and NVMe are all active at once.',
      'Topology tells you structure and feasibility; lspci -vv and live benchmarking confirm the actual numbers.',
    ],
  },
  {
    id: 'building-corespan-ai-assistant',
    title: 'Building the Corespan AI Assistant: From Ingestion to Measured Answers',
    excerpt:
      'A three-part inside look at how the Corespan AI Assistant turns product docs, code, and the website into a searchable knowledge base, always grounds its answers in real sources, and is measured end-to-end so every change can be shown to help.',
    category: 'AI Assistant',
    tags: [
      'ai-assistant',
      'rag',
      'ingestion',
      'knowledge-base',
      'retrieval',
      'answers',
      'evaluation',
      'quality',
    ],
    date: '2026-07-28',
    readMinutes: 12,
    takeaways: [
      'Ingestion loads content from code, docs, and the website, splits it along real structural boundaries (functions, sections, endpoints), and stores it two ways — a search index for meaning and a relationship map for connections.',
      "Every question is checked, then always searched, before the assistant writes an answer — nothing is ever answered from the model's general memory alone.",
      'Retrieved material is filtered for relevance before it reaches the answer step, and the assistant can loop back for another search when a first pass is not enough.',
      'Search quality and answer quality are measured separately and continuously, so a regression traces back to a specific cause instead of a vague "it feels worse."',
    ],
  },
]

export const BLOG_POSTS: BlogPost[] = POST_META.map((meta) => ({
  ...meta,
  author: AUTHOR,
  authorRole: AUTHOR_ROLE,
  chapters: POST_CHAPTERS[meta.id] ?? [],
}))
