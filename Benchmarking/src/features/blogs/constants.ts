import {
  IconApps,
  IconGauge,
  IconLayersLinked,
  IconPercentage,
  IconRobot,
  IconStack2,
  IconTopologyStar3,
} from '@tabler/icons-react'
import type { BlogCategory, BlogPost, CategoryStyle, ImpactStat } from './types'
import { POST_CHAPTERS } from './content'

export const BLOG_CATEGORIES: BlogCategory[] = [
  { label: 'All', icon: IconApps },
  { label: 'Benchmarking', icon: IconGauge },
  { label: 'Hardware & Topology', icon: IconTopologyStar3 },
  { label: 'AI Assistant', icon: IconRobot },
  { label: 'Platform Architecture', icon: IconStack2 },
]

// Every category gets its own gradient + accent color, all from the Mantine
// palette. Covers/badges/icons across the page render from this table instead
// of stock photography, so the whole surface stays Mantine-only.
export const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  All: { gradient: { from: 'gray.6', to: 'dark.4', deg: 135 }, color: 'gray' },
  Benchmarking: { gradient: { from: 'indigo.6', to: 'blue.7', deg: 135 }, color: 'indigo' },
  'Hardware & Topology': { gradient: { from: 'teal.6', to: 'cyan.7', deg: 135 }, color: 'teal' },
  'AI Assistant': { gradient: { from: 'grape.6', to: 'violet.7', deg: 135 }, color: 'grape' },
  'Platform Architecture': { gradient: { from: 'cyan.6', to: 'blue.8', deg: 135 }, color: 'cyan' },
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

// Content sourced from the uploaded Corespan articles, one post per article,
// in source order (01–13). Multi-part series — 01/02 (benchmarking), 05/06/07
// (AI Assistant), 08/09 (AI Studio stack) and 11/12/13 (gateway, sandboxes,
// assistant panel) — are separate posts chained via `relatedPostId` rather
// than merged into one read. The 11–13 figures are redrawn natively in
// `components/SeriesDiagrams.tsx`.
// No external image URLs anywhere — every cover and avatar is rendered from
// Mantine primitives (aside from the one architecture diagram in the AI
// Assistant post, which is a real screenshot).
const AUTHOR = 'Corespan Systems'
const AUTHOR_ROLE = 'Corespan Systems'

type PostMeta = Omit<BlogPost, 'chapters' | 'author' | 'authorRole'>

const POST_META: PostMeta[] = [
  {
    id: 'benchmarking-gpu-clusters',
    title: 'Benchmarking GPU Clusters, Part 1: Why It Matters and How to Do It Right',
    excerpt:
      'GPU infrastructure is one of the largest line items in any AI budget. Benchmarking is the only way to prove you are actually getting what you paid for — and doing it well means validating single-GPU compute, the multi-node interconnect, and real end-to-end workloads.',
    category: 'Benchmarking',
    tags: ['benchmarking', 'gpu', 'mlperf', 'ai-infrastructure', 'profiling'],
    date: '2026-07-22',
    readMinutes: 8,
    featured: true,
    takeaways: [
      'Average enterprise GPU utilization sits near 35% — idle GPUs are pure waste, and you cannot fix what you cannot measure.',
      'Validation runs at three layers: single-GPU compute, multi-node interconnect, and end-to-end workload fidelity via suites like MLPerf.',
      'Raw FLOPS alone say little: a GPU with huge compute but too little memory bandwidth sits idle waiting for data.',
      "Reproducible benchmarking is hard by default, which is why a one-off script isn't enough and a platform is needed.",
    ],
  },
  {
    id: 'building-ai-studio',
    title: 'Benchmarking GPU Clusters, Part 2: Building AI Studio',
    excerpt:
      'How a terminal script became a cloud-native benchmarking platform — three versions of AI Studio, from Django and Celery to Kubernetes, vLLM, Kubeflow and JAX — and the three core workloads it runs to isolate compute, memory and network bottlenecks.',
    category: 'Benchmarking',
    tags: ['benchmarking', 'mlops', 'kubernetes', 'kubeflow', 'vllm', 'jax', 'pytorch'],
    date: '2026-07-22',
    readMinutes: 10,
    takeaways: [
      'AI Studio evolved through three versions — from Django and Celery, to Kubernetes and vLLM, to Kubeflow and JAX — turning a terminal script into an automated MLOps platform.',
      'Three core workloads — vLLM LLM inference, JAX/Flax ResNet inference, and PyTorch DDP training — isolate compute, memory, and network bottlenecks independently.',
      'In distributed training, gradient sync crosses the data-center fabric; when compute and communication stop overlapping, GPUs sit idle on the network.',
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
    title: 'Building the Corespan AI Assistant, Part 1: Getting Knowledge In',
    excerpt:
      'How the Corespan AI Assistant turns product docs, code, and the website into a searchable knowledge base — split along real structure, tagged, and stored two ways so it can find information by meaning and by connection.',
    category: 'AI Assistant',
    tags: ['ai-assistant', 'rag', 'ingestion', 'knowledge-base'],
    date: '2026-07-28',
    readMinutes: 4,
    takeaways: [
      'Ingestion loads content from code, docs, and the website, splits it along real structural boundaries (functions, sections, endpoints), and stores it two ways — a search index for meaning and a relationship map for connections.',
      'Ingestion runs automatically: changed code is re-indexed and the website is re-crawled on a schedule, so the knowledge base stays current.',
    ],
  },
  {
    id: 'ai-assistant-how-it-answers',
    title: 'Building the Corespan AI Assistant, Part 2: How the Assistant Answers',
    excerpt:
      'Following a question from the moment it is asked to the grounded, sourced answer that comes back — a short, structured workflow where every step has one job and nothing is answered without searching first.',
    category: 'AI Assistant',
    tags: ['ai-assistant', 'rag', 'retrieval', 'answers', 'guardrails'],
    date: '2026-07-28',
    readMinutes: 4,
    takeaways: [
      "Every question is checked, then always searched, before the assistant writes an answer — nothing is ever answered from the model's general memory alone.",
      'Retrieved material is filtered for relevance before it reaches the answer step, and the assistant can loop back for another search when a first pass is not enough.',
    ],
  },
  {
    id: 'ai-assistant-measuring-quality',
    title: 'Building the Corespan AI Assistant, Part 3: Measuring Answer Quality',
    excerpt:
      'How we check whether the assistant’s answers are actually good — measuring search and answering separately, grading answers automatically, and tracking every run over time so each change has a clear before-and-after.',
    category: 'AI Assistant',
    tags: ['ai-assistant', 'evaluation', 'quality', 'llm-as-judge'],
    date: '2026-07-28',
    readMinutes: 4,
    takeaways: [
      'Search quality and answer quality are measured separately and continuously, so a regression traces back to a specific cause instead of a vague "it feels worse."',
      'An AI grader scores answers for grounding, relevance and coverage — directional rather than exact, and most useful run against run.',
      'Checks run automatically on a schedule and record to a dashboard, so every change gets a clear before-and-after.',
    ],
  },
  {
    id: 'ai-studio-stack-backbone',
    title: 'Inside the Corespan AI Studio Stack, Part 1: The Backbone That Runs the Work',
    excerpt:
      'A plain-English look at the technology that powers Corespan AI Studio. Part 1 covers the orchestration backbone — the system that takes a request, runs it on the right GPU machine, and keeps track of every result.',
    category: 'Platform Architecture',
    tags: ['ai-studio', 'tech-stack', 'orchestration', 'infrastructure'],
    date: '2026-07-29',
    readMinutes: 7,
    takeaways: [
      'A FastAPI front door hands out a ticket immediately and streams live updates back, instead of making a request wait on the full job.',
      'RabbitMQ queues the work and Celery workers pick it up, so a restart or hiccup mid-job never loses the work in flight.',
      'Workers reach GPU machines over SSH and run every workload in a Docker container, so results are repeatable on any box, NVIDIA or AMD.',
      'Every run, setting, measurement, and log lands in PostgreSQL, powering a searchable, comparable leaderboard instead of a terminal scrollback.',
    ],
  },
  {
    id: 'ai-studio-stack-frameworks',
    title: 'Inside the Corespan AI Studio Stack, Part 2: The AI Frameworks and Workloads',
    excerpt:
      'A plain-English look at the AI tools behind Corespan AI Studio and the kinds of jobs it runs, from large language models and image recognition to interactive notebooks, all measured with industry-standard benchmarks.',
    category: 'Platform Architecture',
    tags: ['ai-studio', 'tech-stack', 'machine-learning', 'workloads'],
    date: '2026-07-29',
    readMinutes: 6,
    takeaways: [
      'PyTorch is the workhorse framework; JAX/Flax is reached for specifically where compiled-ahead speed matters most.',
      'Hugging Face supplies the models themselves, and vLLM (with SGLang planned) serves language models efficiently under concurrent load.',
      'MLPerf gives every benchmark a common, industry-standard yardstick instead of a made-up test.',
      'Workloads range from LLM inference benchmarking to full Jupyter notebooks with a built-in AI assistant, all run in the same Docker containers from Part 1, with Kubernetes next for running them at scale.',
    ],
  },
  {
    id: 'rtx-5090-vs-h100-inference-node',
    title: 'The 4× RTX 5090 Inference Node: From 860 to 5,345 tok/s, and Past a Single H100',
    excerpt:
      'We benchmarked Qwen2.5-32B on vLLM on a 4× RTX 5090 PRU 2500 node, then tuned it. Pipeline parallel, FP8, and chunked prefill delivered a 6.2× throughput jump — pushing the node past a fully-optimized single H100, at roughly one-tenth the cost per million tokens.',
    category: 'Benchmarking',
    tags: [
      'benchmarking',
      'rtx-5090',
      'h100',
      'vllm',
      'llm-inference',
      'cost-performance',
      'pru-2500',
    ],
    date: '2026-07-29',
    readMinutes: 10,
    takeaways: [
      'Switching from tensor parallel to pipeline parallel, adding FP8, and using chunked prefill took the same 4× RTX 5090 node from ~860 to ~5,345 tok/s — a 6.2× gain from configuration alone, no hardware change.',
      'On aggregate throughput, the tuned node beat a single fully-optimized H100 SXM (5,345 vs. 4,285 tok/s) on the same 32B model class, running on vLLM rather than a hand-tuned TRT-LLM stack.',
      "Per GPU the H100 still wins by roughly 3.2× (HBM3, NVLink, far more memory bandwidth) — the 5090 node's case is aggregate throughput per dollar, not single-GPU performance.",
      'At roughly $0.04 per million tokens versus $0.30–0.60 for an H100, and about one-ninth the GPU hardware cost of a 4× H100 SXM node, the economics scale further at 8–10 GPUs per chassis.',
    ],
  },
  // 11, 12, 13 — a three-part "Engineering, explained simply" series, kept as
  // separate posts in their original order and chained via `relatedPostId`.
  {
    id: 'ai-gateway-smarter-front-door',
    title: 'Why an AI Agent Needs a Smarter Front Door',
    excerpt:
      'How Corespan keeps an AI assistant from ever doing something it shouldn’t — starting at the door. A normal API gateway checks your badge; an AI gateway checks who you are, what you’re about to do, whether you’re allowed to do that, and whether anyone is trying to trick you.',
    category: 'Platform Architecture',
    tags: ['ai-gateway', 'security', 'agents', 'prompt-injection', 'rbac', 'audit'],
    date: '2026-11-05',
    readMinutes: 6,
    takeaways: [
      'A normal API gateway judges traffic; an AI agent needs a gateway that judges intent — reading a report and powering off a server look identical from outside.',
      'An identity proxy confirms the real person behind every request and stamps a short-lived signed pass.',
      'The agent gateway allows tools per role (viewer ▸ operator ▸ admin) and hides the tools you can’t use, so the AI never sees a button it can’t press.',
      'The AI Studio door re-checks the pass, fences off hidden prompt-injection tricks, logs every action — and risky actions need a password plus a one-time code.',
    ],
  },
  {
    id: 'agent-sandboxes-license-to-ship',
    title: 'A Safe Place to Work, and a License to Ship',
    excerpt:
      'How we let AI agents run real code and use real tools — without letting a mistake spread, and without shipping one that misbehaves. Two answers: a sealed sandbox for every task, and a driving test every agent must pass before release.',
    category: 'Platform Architecture',
    tags: ['agents', 'sandboxing', 'microvm', 'evaluation', 'ci-cd', 'security'],
    date: '2026-11-05',
    readMinutes: 6,
    takeaways: [
      'Plain containers share the host’s core — fine for trusted code, not for agent code nobody reviewed and a cleverly worded message can steer.',
      'Isolation is a ladder: plain container ▸ guarded container ▸ lightweight VM ▸ a fresh, locked-down room per task with no open network door.',
      'One shared agent engine powers every product; agents, tools and models plug in as config, and sub-agents each get one job, their own room and a narrow contract.',
      'Every agent must pass hard gates — zero unsafe tool calls and zero prompt-injection actions — at both the pull-request gate and the release gate.',
    ],
  },
  {
    id: 'assistant-asks-before-it-acts',
    title: 'The AI Assistant That Asks Before It Acts',
    excerpt:
      'A helper that lives inside AI Studio — it can analyse, diagnose and fix, but it always shows you the plan first. Plus: the live host and fabric topology maps it draws for you automatically.',
    category: 'AI Assistant',
    tags: ['ai-assistant', 'human-in-the-loop', 'topology', 'design-system', 'gpu', 'nt2'],
    date: '2026-11-05',
    readMinutes: 5,
    takeaways: [
      'The assistant builds its panels from an approved component kit, so everything it shows is on-brand and safe by construction.',
      'It never acts on its own: it proposes a plan, you approve it, and only then does it run — with results streaming back live.',
      'Risky actions like powering off a node need a second lock: your password and a one-time code.',
      'It draws two live maps automatically — a host view of each server’s GPUs and a fabric view of how NT2 switches wire hosts together.',
    ],
  },
]

export const BLOG_POSTS: BlogPost[] = POST_META.map((meta) => ({
  ...meta,
  author: AUTHOR,
  authorRole: AUTHOR_ROLE,
  chapters: POST_CHAPTERS[meta.id] ?? [],
}))
