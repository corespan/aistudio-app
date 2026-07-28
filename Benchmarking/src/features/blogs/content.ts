import type { BlogChapter } from './types'

/**
 * Article bodies, keyed by post id. Sourced from the uploaded Corespan
 * markdown articles (01-BEN, 02-BEN combined into one post; 03-REA and
 * 04-PCI kept as their own posts). Kept separate from `constants.ts` so post
 * metadata stays scannable while the prose lives on its own.
 */
export const POST_CHAPTERS: Record<string, BlogChapter[]> = {
  'benchmarking-gpu-clusters': [
    {
      title: 'Part 1 — Why It Matters and How to Do It Right',
      sections: [
        {
          heading: 'The question every AI budget has to answer',
          paragraphs: [
            'High-performance GPU infrastructure is expensive, and the capital commitment is immense. The question that follows every purchase order is simple: how do you validate actual performance against the promised spec?',
            'Benchmarking answers it. At its core, benchmarking means running specific, resource-controlled workloads on GPUs to measure two things quantifiably: how much computation the accelerator can push, and how efficiently it can move data. That measurement is the foundation of any honest return-on-investment calculation. If a cluster underperforms because of sub-optimal configuration or a hidden bottleneck, you are not just losing speed, you are leaving capital on the table.',
          ],
        },
        {
          heading: 'The real cost of GPU underutilization',
          paragraphs: [
            'When data loading, network fabric, or scheduling bottleneck a pipeline, expensive hardware quietly turns into an expensive space heater. Industry analyses of AI infrastructure put the scale of the problem in stark terms.',
          ],
          points: [
            {
              text: 'Average enterprise GPU utilization sits around 35%, which translates to an estimated tens of billions of dollars in wasted GPU spend globally each year.',
            },
            {
              text: 'Even during active ML workloads, GPUs spend a meaningful share of their in-execution time in a low-activity state, waiting on data or network synchronization.',
            },
            {
              text: 'For a large H100-class cluster, a multi-month delay caused by bottlenecked pipelines or broken dependencies can represent millions of dollars in lost utility and unrealized revenue.',
            },
          ],
          callout: {
            title: 'The takeaway',
            text: 'The exact figure matters less than the shape of the problem: idle GPUs are pure waste, and you cannot fix what you cannot measure. Catching these bottlenecks before they drain a budget means testing hardware rigorously at every level of the stack.',
          },
        },
        {
          heading: 'Three layers of validation',
          paragraphs: [
            'We structure hardware validation across three layers, each isolating a different dimension of performance.',
          ],
        },
        {
          heading: '1. Single-GPU performance',
          paragraphs: ['Validating an isolated GPU focuses on two throughput vectors.'],
          points: [
            {
              term: 'Compute',
              text: 'Measured in FLOPS, the rate at which the accelerator executes dense math.',
            },
            {
              term: 'Memory bandwidth',
              text: 'Measured in GB/s, the speed at which the GPU can pull data from its high-bandwidth memory (HBM).',
            },
          ],
          callout: {
            title: 'The key principle',
            text: 'A GPU with enormous compute but inadequate memory bandwidth is memory bound. It burns cycles idling while it waits for data. Raw FLOPS alone tell you almost nothing about real-world behavior.',
          },
        },
        {
          heading: '2. Multi-node interconnect',
          paragraphs: [
            'Modern large language models do not fit on a single GPU. Running a 70B-class model means distributing it across devices and nodes, which introduces network-level complexity and makes interconnect bandwidth and latency first-class concerns.',
            'Once you scale beyond the PCIe bus, data has to be serialized and moved across high-speed network interfaces, and benchmarking collective operations like All-Reduce becomes essential.',
          ],
          points: [
            { term: 'Data parallelism', text: 'For near-linear throughput.' },
            {
              term: 'Pipeline parallelism',
              text: 'For splitting a model into sequential stages.',
            },
            {
              term: 'Tensor parallelism',
              text: 'For splitting individual matrix operations across devices to reduce latency.',
            },
          ],
          callout: {
            title: 'The determining factor',
            text: 'At this point, interconnect efficiency, not raw GPU speed, is often the dominant performance determinant.',
          },
        },
        {
          heading: '3. End-to-end workload fidelity',
          paragraphs: [
            'Raw metrics have to be validated against real applications. Industry-standard suites like MLPerf run complete, production-representative tasks rather than isolated math kernels.',
            'The reason this matters: it does not help if your GPU finishes its math in one second but takes ten seconds to load the data. Real AI tasks involve data loading, CPU pre-processing, and constant movement in and out of GPU memory. End-to-end benchmarking is the only way to see the whole pipeline behave the way it will in production.',
          ],
        },
        {
          heading: 'Profiling: finding the actual bottleneck',
          paragraphs: [
            'When performance is off, a profiler is the core diagnostic tool. It records a micro-temporal timeline of activity across every subsystem, CPU, GPU cores, and interconnect, to isolate exactly which component is responsible for the slowdown.',
          ],
          callout: {
            title: 'From telemetry to strategy',
            text: 'If the profiler shows the network is the bottleneck, the informed move is to invest the next budget cycle in faster interconnect, not in more GPUs that will simply sit idle behind the same choke point.',
          },
        },
        {
          heading: 'Why reproducible benchmarking is genuinely hard',
          paragraphs: [
            'Benchmarking sounds straightforward until you deploy it. You spend weeks getting a benchmark to run perfectly on a workstation, move it to a production cluster, and it crashes on the first run. Welcome to "it works on my machine," at data-center scale.',
          ],
          points: [
            {
              term: 'The dependency matrix',
              text: "AI software is unforgiving about versions. Your framework has to match the exact driver and toolkit on the host. A mismatch between a framework build and the installed CUDA version, and the GPU simply can't talk to the software.",
            },
            {
              term: 'Fragile scaling scripts',
              text: 'Scaling a test to hundreds or thousands of GPUs with hand-rolled scripts is brittle. If a single node drops its connection, the whole run collapses.',
            },
            {
              term: 'The hardware-specific trap',
              text: "A benchmark tuned for one vendor's GPU with vendor-specific code will run poorly, or not at all, on another. Engineers end up rewriting benchmark code for every architecture.",
            },
            {
              term: 'A fast-moving ecosystem',
              text: 'Drivers, libraries, and compilers change constantly. A custom benchmark that ran perfectly last month can break today because one underlying library moved.',
            },
          ],
          callout: {
            title: 'Not edge cases',
            text: "These aren't edge cases, they're the default experience. Solving them is exactly why a one-off script isn't enough, and why we built a platform around the problem.",
          },
        },
      ],
    },
    {
      title: 'Part 2 — Building AI Studio',
      sections: [
        {
          heading: 'It started as a script',
          paragraphs: [
            'What became AI Studio began as a Python script running in a terminal. One ResNet training workload, two nodes, an NVIDIA GPU, and PyTorch. The workflow was exactly what you would expect: SSH into the machine, set up the environment by hand, and fire off the job from the command line.',
            'It worked, right up until testing teams, hardware teams, and customers wanted to run benchmarks themselves. They had no interest in SSH flags. They needed a UI, persistent storage for results, and a way to see trends over time. That feedback was the founding problem statement for AI Studio.',
          ],
        },
        {
          heading: 'Version 1: the first real platform',
          paragraphs: [
            'The mandate was to turn a terminal script into a proper orchestration platform, with no more results lost in spreadsheets. We built it as an embedded workbench on top of our existing bare-metal platform UI.',
          ],
          points: [
            {
              term: 'Control plane (Django + PostgreSQL)',
              text: 'Django handled API endpoints and business logic, but never ran jobs itself, to keep the interface responsive. It wrote a run record to PostgreSQL, marked it PENDING, and immediately handed the job off.',
            },
            {
              term: 'Fault-tolerant async execution (Celery + RabbitMQ)',
              text: 'RabbitMQ sat between Django and Celery as the message broker. Django dropped a job on the queue and a Celery worker picked it up. Crucially, if a worker crashed mid-run, RabbitMQ held the message and redelivered it.',
            },
            {
              term: 'Infrastructure as code (Ansible)',
              text: 'Before anything executed, an Ansible playbook reached the target node and installed the GPU drivers and container runtime. Within minutes the machine was benchmark-ready with zero configuration drift.',
            },
            {
              term: 'Containerized execution (Docker)',
              text: 'Every workload and its dependencies were frozen into a Docker image in a private registry. The NVIDIA Container Toolkit let the container address the physical GPU on the host directly — this is how we started dismantling the dependency matrix from Part 1.',
            },
            {
              term: 'Shared storage (NFS)',
              text: 'For multi-node runs, a single dataset was mounted across all nodes over NFS, so we did not have to copy gigabytes to every machine before each run.',
            },
          ],
        },
        {
          heading: 'Version 2: hardening for enterprise',
          paragraphs: ['Version 1 proved the concept. Version 2 made it production-ready.'],
          points: [
            {
              term: 'Orchestration upgrade (Kubernetes)',
              text: 'Celery was built for short web tasks, not multi-hour GPU benchmarks. We moved execution to Kubernetes, where workloads became proper cluster jobs with resource requests, GPU scheduling, and lifecycle tracking.',
            },
            {
              term: 'Registry resilience',
              text: 'Every workload image was mirrored to a secondary container registry. If the primary was unreachable, the platform failed over automatically, removing a single point of failure.',
            },
            {
              term: 'Hardware agnosticism (AMD + NVIDIA)',
              text: "We added AMD support, maintaining parallel image sets built with ROCm for AMD and CUDA for NVIDIA. Ansible detected the host's GPU vendor, installed the right kernel-level drivers, and pulled the container image matching the silicon.",
            },
            {
              term: 'Advanced workloads (vLLM)',
              text: 'LLM inference introduced new demands, so we integrated vLLM as our inference engine. Its PagedAttention mechanism manages GPU memory like OS virtual-memory pages, cutting fragmentation and letting us split models across devices efficiently.',
            },
            {
              term: 'Auto-generated reporting',
              text: 'On completion, the platform generates an HTML benchmark run manifest — a permanent, shareable record of hardware details, run configuration, final metrics, and profiler summaries.',
            },
            {
              term: 'Power observability (Prometheus + Grafana)',
              text: 'We needed to know how expensive our speed was. Prometheus scraped GPU power draw to compute throughput-per-watt efficiency, and Grafana provided deep live telemetry.',
            },
          ],
        },
        {
          heading: 'Version 3: automating the platform',
          paragraphs: [
            'The remaining gap was operational. Every run still needed an engineer to click "Run." There was no concept of a run that scheduled, executed, and reported itself.',
          ],
          points: [
            {
              term: 'Dedicated MLOps control plane (Kubeflow + K3s)',
              text: 'We migrated to Kubeflow, built specifically to orchestrate ML pipelines. To avoid the overhead of a full Kubernetes install on compute nodes, we ran K3s, a lightweight distribution, with the GPU Operator handling hardware detection and Kubeflow driving pipeline execution.',
            },
            {
              term: 'Next-gen execution kernels (JAX/Flax)',
              text: "For ResNet inference we replaced PyTorch with JAX/Flax. JAX's XLA compiler optimizes the computation graph ahead of execution, and its native data-parallel sharding distributes batches across GPUs far more efficiently for this workload.",
            },
            {
              term: 'High-throughput API (FastAPI)',
              text: 'We added FastAPI alongside Django to feed a new historical dashboard. Backed by Pydantic for strict validation, it handled request throughput with very low overhead.',
            },
            {
              term: 'The historical dashboard',
              text: 'A dedicated frontend where every automated run appears with its full result set and timeline. Runs can be compared across hardware types, models, and configurations, finally delivering complete trend visibility.',
            },
          ],
        },
        {
          heading: 'Under the hood: three core workloads',
          paragraphs: [
            'A platform is only as valuable as the workloads it runs. We standardized on three pipelines, each designed to stress a different dimension of the cluster.',
          ],
        },
        {
          heading: 'LLM inference (vLLM)',
          paragraphs: [
            'LLM inference is the most demanding workload on the platform. Models like Llama 3.1 70B and DeepSeek R1 Distill exceed the memory of a single GPU, so distributing the model is not an optimization, it is a prerequisite to start at all.',
            'We benchmark at multiple concurrency levels (for example 32, 64, and 128 simultaneous requests) using the OpenOrca dataset to find where the system breaks. We capture p99 Time to First Token (TTFT), Time Per Output Token (TPOT), end-to-end latency, and throughput, while Prometheus scrapes power draw to compute our ultimate ROI metric, throughput per watt.',
          ],
          points: [
            {
              term: 'PagedAttention',
              text: 'Manages the KV cache in non-contiguous memory blocks, drastically reducing fragmentation and letting us serve more concurrent requests on the same hardware.',
            },
            {
              term: 'Native tensor parallelism',
              text: "Splits each transformer layer's weight matrices across GPUs, so every device participates in every forward pass simultaneously instead of handing off sequentially.",
            },
          ],
          callout: {
            title: 'Reading the bottleneck signature',
            text: "If throughput plateaus while latency spikes, you're compute-bound. If throughput collapses early, you're memory-bandwidth-bound — the KV cache fills faster than it evicts. If utilization is low but latency is high, the culprit is usually CPU pre-processing or network overhead.",
          },
        },
        {
          heading: 'ResNet inference (JAX/Flax)',
          paragraphs: [
            "For image-classification throughput and latency (ResNet18 and ResNet50) we stepped away from PyTorch and built the workload in JAX with Flax. The driver for that choice is JAX's XLA compiler, which performs ahead-of-time compilation of the whole computation graph, fusing operations and generating optimized kernels for the target hardware. That eliminates the operator-dispatch overhead of eager execution and produces consistent, predictable throughput.",
            "For multi-GPU runs we use JAX's native data-parallel sharding: weights are replicated, the image batch is partitioned, and throughput scales close to linearly with GPU count as long as the per-GPU batch is large enough to keep devices compute-bound. We track images/sec, TFLOPS, p95/p99 batch latency, and storage read throughput, and use the TensorBoard profiler to visualize the XLA execution timeline and expose gaps between kernel dispatches.",
          ],
        },
        {
          heading: 'ResNet training (PyTorch DDP)',
          paragraphs: [
            'Training exercises the full forward and backward pass, gradient computation, and weight updates — a fundamentally heavier workload than inference. We use PyTorch with Distributed Data Parallel (DDP) across multiple GPUs and nodes. DDP replicates the full model on every GPU, partitions the dataset, and after each pass the NCCL backend runs an All-Reduce to synchronize gradients before the optimizer steps. We capture loss-convergence curves, training throughput (samples/sec), time per epoch, and per-GPU utilization and power.',
          ],
          callout: {
            title: 'The network is the bottleneck',
            text: 'Gradient synchronization travels the data-center fabric, not the internal PCIe bus. A well-tuned run overlaps computation with communication, starting the All-Reduce on early-layer gradients while later layers are still computing. When that overlap breaks down, GPUs sit idle waiting on the network and throughput collapses despite high theoretical availability.',
          },
        },
        {
          heading: 'From scripts to strategy',
          paragraphs: [
            'Benchmarking at enterprise scale is no longer a problem you solve with a terminal, an SSH session, and a few duct-taped scripts. When you are operating clusters that cost millions, "works on my machine" is not an engineering headache, it is a financial liability. By building AI Studio, we turned hardware validation from a fragile manual chore into a resilient, automated MLOps pipeline: workloads decoupled from hardware through containers, provisioning automated with Ansible, execution orchestrated by Kubernetes and Kubeflow, and every millisecond of telemetry captured through Prometheus, Grafana, and FastAPI.',
            'Ultimately, benchmarking is about truth — stripping away the spec-sheet marketing and proving what a cluster can actually do under real-world load. Whether you are chasing the lowest TTFT on a 70B model or optimizing gradient sync across a training cluster, you cannot improve what you cannot measure.',
          ],
        },
      ],
    },
  ],

  'reading-pcie-enumeration-tree': [
    {
      title: '',
      sections: [
        {
          heading: 'What the tree represents',
          paragraphs: [
            'The PCIe enumeration tree is one of the most useful, and most overlooked, diagnostic views on any GPU server. Before you run a single benchmark, it tells you how your GPUs, NVMe drives, and NICs are wired together, which pairs can talk fast, and whether features like GPU Direct Storage are even architecturally possible.',
            'A PCIe enumeration tree is the logical topology as seen by the OS. It describes connectivity, not physical slot layout.',
          ],
          table: {
            headers: ['Component', 'Meaning'],
            rows: [
              ['Root Complex', 'The PCIe controller inside the CPU'],
              ['Root Port', 'A PCIe controller / slot group branching off the root complex'],
              [
                'PCIe Bridge / Switch',
                'A fan-out device connecting one uplink to multiple endpoints',
              ],
              ['Endpoint', 'A GPU, NVMe SSD, NIC, RAID card, and so on'],
            ],
          },
          code: [
            {
              label: 'A simplified tree',
              lines: [
                'CPU (Root Complex)',
                ' |',
                ' +-- Root Port',
                ' |     |',
                ' |     +-- PCIe Switch',
                ' |           |',
                ' |           +-- GPU0',
                ' |           +-- GPU1',
                ' |           +-- NVMe',
              ],
            },
          ],
        },
        {
          heading: 'Locating devices',
          paragraphs: ['Start with the tree, then find your endpoints by vendor.'],
          code: [
            {
              lines: [
                'lspci -tv',
                'lspci | grep -i nvidia   # GPUs',
                'lspci | grep -i nvme     # NVMe (also look for the drive vendor name)',
              ],
            },
          ],
          points: [
            { term: 'NVIDIA', text: '→ GPUs' },
            { term: 'Non-Volatile memory controller, or a drive vendor name', text: '→ NVMe' },
            { term: 'Broadcom / LSI', text: '→ PCIe switches or storage controllers' },
          ],
          callout: {
            title: 'Two quick parsing rules',
            text: 'Anything ending in a device name is an endpoint (e.g. "8b:00.0 NVIDIA ..."). Anything like "01.0-[84-94]" is a bridge/switch port creating a new bus range. The deeper the indentation, the more hops — slightly more latency, more chance of oversubscription.',
          },
        },
        {
          heading: 'Reading relationships between devices',
          paragraphs: [
            'Where two devices sit relative to each other determines how fast they can communicate.',
          ],
          code: [
            {
              label: 'Same PCIe switch — best case for peer-to-peer',
              lines: ['GPU0 -> Switch -> GPU1'],
            },
            {
              label: 'Same root complex, different switches — still fine, a bit more latency',
              lines: ['GPU0 -> Switch -> Root Port -> CPU -> Root Port -> Switch -> GPU1'],
            },
            {
              label: 'Different CPU sockets — the slowest case',
              lines: ['GPU0 -> CPU0 -> UPI/QPI -> CPU1 -> GPU1'],
            },
          ],
        },
        {
          heading: 'Determining PCIe generation and link width',
          paragraphs: ['The tree alone does not show speed. For that, query the device directly.'],
          code: [
            { lines: ['lspci -s <bus-id> -vv | grep -E "LnkCap|LnkSta"'] },
            {
              label: 'Example: lspci -s 8b:00.0 -vv',
              lines: ['LnkCap: Speed 16GT/s, Width x16', 'LnkSta: Speed 16GT/s, Width x16'],
            },
          ],
          table: {
            headers: ['Speed', 'PCIe Generation'],
            rows: [
              ['8 GT/s', 'Gen3'],
              ['16 GT/s', 'Gen4'],
              ['32 GT/s', 'Gen5'],
            ],
          },
          callout: {
            title: 'LnkCap vs LnkSta',
            text: 'LnkCap is what the link is capable of; LnkSta is what it actually negotiated. When those two disagree, you have found a problem.',
          },
        },
        {
          heading: 'Estimating bandwidth',
          paragraphs: ['Approximate usable bandwidth per direction at x16.'],
          table: {
            headers: ['PCIe Gen', 'x16 bandwidth (approx.)'],
            rows: [
              ['Gen3', '~16 GB/s'],
              ['Gen4', '~31.5 GB/s'],
              ['Gen5', '~63 GB/s'],
            ],
          },
          callout: {
            title: 'The rule that matters',
            text: 'End-to-end bandwidth equals the minimum bandwidth of all links in the path. One Gen4 hop in an otherwise Gen5 path caps the whole path at Gen4.',
          },
        },
        {
          heading: 'Worked example: GPU-to-GPU bandwidth',
          paragraphs: [
            'Take a two-GPU system where GPU0 is 8b:00.0, GPU1 is 8e:00.0, and both sit behind the same PCIe switch and root port. The path is simply:',
          ],
          code: [{ lines: ['GPU0 -> PCIe Switch -> GPU1'] }, { lines: ['nvidia-smi topo -m'] }],
          callout: {
            title: 'Expected numbers',
            text: 'If both links negotiate Gen4 x16, expect roughly 31.5 GB/s theoretical, around 26–28 GB/s practical, with latency in the ~1–2 µs range. A PIX label between the two GPUs confirms they share the same root complex with at most one bridge hop — exactly what the tree told you.',
          },
        },
        {
          heading: 'GPU-to-NVMe path (for GDS analysis)',
          paragraphs: [
            'GPU Direct Storage (GDS) lets NVMe feed a GPU directly, bypassing the CPU. Its basic architectural requirement is that the NVMe endpoint sits in the same PCIe subtree as the GPU.',
          ],
          code: [
            {
              label: 'Check the tree',
              lines: ['PCIe Switch', ' |-- GPU0', ' |-- GPU1', ' +-- NVMe'],
            },
          ],
          callout: {
            title: 'Reading the verdict',
            text: 'When the NVMe endpoint shares the switch with the GPUs, you have same root complex, same switch, and a peer-to-peer path, so GDS is architecturally possible. If instead the NVMe shows up under the chipset/SATA controller or a different root complex, GDS will not work and transfers fall back to CPU-staged copies.',
          },
        },
        {
          heading: 'A repeatable workflow for any machine',
          ordered: true,
          points: [
            { text: 'Get the topology: lspci -tv' },
            {
              text: 'Identify GPU and NVMe BDFs: lspci | grep -i nvidia and lspci | grep -i nvme',
            },
            { text: 'Get link speeds: lspci -s <bus> -vv | grep -E "LnkCap|LnkSta"' },
            { text: 'Confirm GPU locality: nvidia-smi topo -m' },
            { text: 'Sketch a simplified tree' },
            {
              text: 'Conclude on GPU-to-GPU bandwidth, GPU-to-NVMe feasibility, GDS support, and likely bottlenecks',
            },
          ],
          code: [
            {
              label: 'Simplified tree',
              lines: [
                'CPU',
                ' +-- Root Port',
                '      +-- Switch',
                '           |-- GPU(s)',
                '           +-- NVMe',
              ],
            },
          ],
        },
        {
          heading: 'Key takeaways',
          points: [
            { text: 'lspci -tv gives you structure, not speed.' },
            { text: 'lspci -vv gives you speed and width (LnkCap vs LnkSta).' },
            { text: 'nvidia-smi topo -m confirms GPU locality.' },
            {
              text: 'Same switch is the best case; same root complex is acceptable; different sockets is the slowest.',
            },
            { text: 'For GDS, the NVMe must be a PCIe endpoint in the same subtree as the GPU.' },
          ],
          relatedPostId: 'pcie-topology-in-practice',
          relatedLabel: 'Apply this method to a real composed GPU node',
        },
      ],
    },
  ],

  'pcie-topology-in-practice': [
    {
      title: '',
      sections: [
        {
          heading: 'What this post answers',
          paragraphs: [
            'Using the OS-visible topology of a real composed GPU node, this post puts the enumeration-tree method to work and answers the questions that actually affect performance.',
          ],
          points: [
            { text: 'Where do the GPUs and NVMe sit in the PCIe fabric?' },
            { text: 'Are the GPUs close enough for efficient peer-to-peer (P2P)?' },
            { text: 'Is the NVMe close enough to the GPUs for GPU Direct Storage (GDS)?' },
            { text: 'Are there uplink bottlenecks or oversubscription risks?' },
            { text: 'Is the system Gen4 or Gen5, and how does that affect model load time?' },
          ],
          relatedPostId: 'reading-pcie-enumeration-tree',
          relatedLabel: 'Read the companion tutorial on reading the tree',
        },
        {
          heading: 'GPU locality: what PIX, PXB, PHB, and SYS mean',
          paragraphs: [
            'The fastest way to sanity-check GPU locality is nvidia-smi topo -m, which labels the path between any two devices, from fastest to slowest.',
          ],
          points: [
            { term: 'PIX', text: 'Peer-to-peer across a single PCIe switch. The fast path.' },
            {
              term: 'PXB',
              text: 'Traversing multiple PCIe bridges/switches, but not the CPU host bridge.',
            },
            {
              term: 'PHB',
              text: 'Traversing the PCIe host bridge (i.e. through the CPU). Slower than PIX.',
            },
            {
              term: 'SYS',
              text: 'The slowest path, crossing the CPU-to-CPU interconnect between NUMA nodes.',
            },
          ],
          callout: {
            title: 'What to look for',
            text: 'These labels are how you quickly judge whether a system supports high-performance P2P transfers like GPUDirect RDMA. A PIX between two GPUs is exactly what you want to see.',
          },
        },
        {
          heading: 'Gen4 vs Gen5, in practical terms',
          table: {
            headers: ['Link speed', 'PCIe generation'],
            rows: [
              ['16 GT/s', 'Gen4'],
              ['32 GT/s', 'Gen5'],
            ],
          },
        },
        {
          heading: 'Usable bandwidth per direction at x16',
          table: {
            headers: ['PCIe Gen', 'x16 bandwidth (approx.)'],
            rows: [
              ['Gen4', '~31.5 GB/s'],
              ['Gen5', '~63 GB/s'],
            ],
          },
          callout: {
            title: 'Two assumptions to confirm',
            text: 'Gen5 is roughly 2× Gen4, assuming the link actually negotiates Gen5 and runs at full x16 width. Both assumptions need to be confirmed with lspci -vv; the enumeration tree alone will not tell you.',
          },
        },
        {
          heading: 'How link speed shapes model load time',
          paragraphs: ['Model load is a data-movement problem, and the path matters.'],
          code: [
            { label: 'Without GDS', lines: ['NVMe -> CPU RAM -> GPU VRAM'] },
            {
              label: 'With GDS — the CPU staging step disappears',
              lines: ['NVMe -> GPU VRAM (direct)'],
            },
          ],
          points: [
            {
              term: 'A Gen5 GPU does not automatically speed up model load if storage is Gen4',
              text: 'If the NVMe negotiates Gen4 while the GPU runs Gen5, load time stays capped by the NVMe. Mixed-generation systems are extremely common, and the slowest link in the path wins.',
            },
            {
              term: 'If NVMe and GPU share a switch uplink, load traffic can contend with GPU traffic',
              text: 'Good locality enables GDS, but it also means storage reads and GPU DMA can compete for the same uplink bandwidth.',
            },
          ],
        },
        {
          heading: 'Worked example: a composed two-GPU node',
          paragraphs: [
            'Consider a composed node with two data-center GPUs and an NVMe endpoint. Reading its captured lspci -tv tree, we find all three endpoints behind the same PCIe switch hierarchy.',
          ],
          code: [
            {
              lines: [
                'CPU Root Complex',
                ' +-- Root Port',
                '      +-- PCIe Switch Fabric (Broadcom/LSI, multi-hop)',
                '           |-- GPU0',
                '           |-- GPU1',
                '           |-- NVMe',
                '           |-- Storage/HBA endpoints',
                '           +-- Switch management endpoints',
              ],
            },
          ],
          points: [
            {
              term: 'GPU-to-GPU PCIe P2P',
              text: 'The GPUs are as close as PCIe-only wiring allows.',
            },
            {
              term: 'GPU-to-NVMe locality',
              text: 'The storage sits on the same fabric as the compute.',
            },
            {
              term: 'Future GDS enablement',
              text: 'The NVMe is a peer of the GPUs, satisfying the core architectural requirement for direct storage-to-GPU transfers.',
            },
          ],
          callout: {
            title: 'Structurally, an excellent topology',
            text: 'Both GPUs and the NVMe share a single switch subtree — the best-case arrangement for P2P, locality, and future GDS.',
          },
        },
        {
          heading: 'Structural bottlenecks to watch for',
          ordered: true,
          points: [
            {
              term: 'Shared uplink oversubscription',
              text: "Two GPUs plus an NVMe behind the same switch means the switch's uplink to the CPU can become a choke point. Even if each GPU has its own x16 link, the shared uplink may not sustain full concurrent traffic from all three.",
            },
            {
              term: 'NVMe contention',
              text: 'The same locality that makes GDS possible also means model loading and GPU DMA reads can contend with active GPU traffic on the shared path.',
            },
            {
              term: 'Multi-hop switch cascade',
              text: 'A deep hierarchy of bridges adds hop count, complicates P2P routing, and raises the chance of ACS/IOMMU configuration issues that can silently block P2P.',
            },
          ],
        },
        {
          heading: 'GDS readiness assessment',
          paragraphs: [
            'From the topology alone, the verdict is clear: because the NVMe endpoint sits in the same subtree as both GPUs, the node is GDS-ready at the fabric level. The remaining requirements are software and firmware, not wiring.',
          ],
          points: [
            { text: 'ACS / IOMMU routing configured to allow P2P' },
            { text: 'NVIDIA driver support for the GPUs and storage in use' },
            { text: 'A correctly configured cuFile / GDS software stack' },
          ],
        },
        {
          heading: 'What topology can and cannot tell you',
          paragraphs: [
            'It is worth being precise about the boundary between a structural claim and a measured one. From an enumeration tree you can state confidently that devices share a switch subtree and that the topology is favorable for P2P and GDS.',
          ],
          points: [
            { text: 'The negotiated PCIe generation (Gen4 vs Gen5) and link width (x16 vs x8)' },
            { text: 'Real, measured P2P bandwidth' },
            { text: 'Whether ACS/IOMMU actually permits P2P in practice' },
          ],
          callout: {
            title: 'What that cannot be claimed without lspci -vv and live benchmarking',
            text: 'Topology analysis is structurally correct, bottleneck-aware, and GDS-feasibility-correct, but link-speed-specific numbers should be treated as expected ranges until confirmed on live hardware — roughly 31.5 GB/s for Gen4 x16, ~63 GB/s for Gen5 x16.',
          },
        },
        {
          heading: 'Turning this into automated checks: topology checks',
          paragraphs: ['From the tree alone, no link-speed data required.'],
          points: [
            { text: 'GPU and NVMe behind the same PCIe switch → GDS possible' },
            { text: 'GPU and NVMe on different root complexes → GDS not possible' },
            { text: 'Multiple GPUs sharing one uplink → oversubscription risk' },
            { text: 'Switch cascade deeper than a set threshold → elevated hop count' },
          ],
        },
        {
          heading: 'Turning this into automated checks: link checks',
          paragraphs: ['These require lspci -vv.'],
          points: [
            { text: 'GPU is Gen5-capable but negotiated Gen4' },
            { text: 'GPU link width is x8 where x16 was expected' },
            { text: 'Gen4 NVMe present in a Gen5 system → model load time capped by storage' },
          ],
        },
        {
          heading: 'Bottom line',
          paragraphs: [
            'For the composed node above, both GPUs and the NVMe endpoint sit under the same PCIe switch subtree — the best-case topology for GPU-to-GPU P2P and a strong foundation for GDS. The most likely bottleneck is oversubscription at the switch uplink when GPUs and NVMe are all active at once. Exact generation and width need lspci -vv to confirm, but the topology itself is clearly favorable, and that is a conclusion you can reach in minutes, before running a single benchmark.',
          ],
        },
      ],
    },
  ],
}
