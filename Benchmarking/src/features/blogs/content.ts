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
  'building-corespan-ai-assistant': [
    {
      title: 'Part 1 — Getting Knowledge In',
      sections: [
        {
          heading: 'Why ingestion comes first',
          paragraphs: [
            'The Corespan AI Assistant answers questions about our products, documentation, and codebase right on our site. Before it can answer anything, it needs a well-organized knowledge base to draw from — a process we call ingestion.',
            'An assistant is only as good as the information it can find. If the knowledge going in is messy or badly organized, the answers coming out will be too, so we put real care into this step and it pays off everywhere downstream.',
          ],
        },
        {
          heading: 'The shape of the pipeline',
          paragraphs: [
            'At a high level, information flows in one direction, from raw sources to searchable knowledge. Every piece of content ends up in two places: a search index that finds information by meaning, and a relationship map that tracks how things connect — the two work together to give better answers than either could alone.',
          ],
          code: [
            {
              lines: [
                'Sources (code, docs, website)',
                '      -> Load the content',
                '      -> Split it into small, meaningful pieces',
                '      -> Tag each piece with useful labels',
                '      -> Store it two ways:',
                '           - a search index (to find pieces by meaning)',
                '           - a relationship map (to find how pieces connect)',
              ],
            },
          ],
        },
        {
          heading: 'Where the knowledge comes from',
          paragraphs: [
            'We pull from three kinds of source, and keep them separate so the assistant can search the right one for a given question:',
          ],
          points: [
            { text: 'Code repositories' },
            { text: 'Technical documentation' },
            { text: 'Our website' },
          ],
          callout: {
            title: 'Always current',
            text: 'Ingestion happens automatically. When code changes, that content is re-indexed; scheduled jobs re-crawl the website so the knowledge base keeps up with the live site. Nothing is a one-time load — the pipeline is designed to run regularly and stay current.',
          },
        },
        {
          heading: 'The full picture',
          paragraphs: [
            'Zooming out, here is the whole system end to end: the ingestion pipeline on the right turning raw sources into the two stores described above, and the agent execution flow on the left that a live question travels through — guardrail check, mandatory retrieval, the hybrid retriever, and the agent loop that decides whether it has enough to answer or needs another search pass.',
          ],
          diagram: 'agent-architecture',
        },
        {
          heading: 'Splitting content the smart way',
          paragraphs: [
            'Before content can be searched, it has to be broken into smaller pieces. This is where a lot of assistants quietly lose quality. A naive approach just cuts every so many characters, which can slice a paragraph in half or split a heading from the text it belongs to. We split along the natural structure of the content instead:',
          ],
          points: [
            {
              term: 'Code',
              text: 'is split along real boundaries, like whole functions and classes, so a piece is a complete, understandable unit rather than a random fragment.',
            },
            {
              term: 'Documentation and web pages',
              text: 'are split by section and topic, so each piece stays about one thing.',
            },
            {
              term: 'API references',
              text: 'are split so each endpoint becomes its own self-contained piece.',
            },
          ],
          callout: {
            title: 'Why structure beats size',
            text: 'Splitting by structure means each piece is far more likely to be a complete thought, which is exactly what leads to a good answer later on.',
          },
        },
        {
          heading: 'Tagging each piece',
          paragraphs: [
            'Once the content is split, each piece is passed through a language model that reads it and adds a few useful labels. It pulls out the key names mentioned in the text — people, tools, concepts, and so on — and notes what the piece is really about (for example, whether it describes something Corespan offers versus general background).',
            'These labels do two things: they make search more precise, and they feed the relationship map described below.',
          ],
        },
        {
          heading: 'Storing it two ways',
          paragraphs: ['Each labeled piece is saved into two complementary indexes.'],
          points: [
            {
              term: 'A search index (find by meaning)',
              text: 'Lets the assistant search by meaning rather than exact words, so it can match a question to the right content even when the wording is completely different, while still catching exact terms like product names and error codes when they matter. Documentation is also tagged with its version, so the assistant can answer about a specific release instead of blending versions together.',
            },
            {
              term: 'A relationship map (find by connection)',
              text: 'Links each piece and the names it mentions into a map of points and connections. It gives the assistant the ability to follow connections — answering things like "what else references this?" or "where else is this mentioned?" — questions about how things relate, not just what they resemble.',
            },
          ],
          callout: {
            title: 'Search finds alike; the map finds linked',
            text: 'This "best of both" search is what makes retrieval reliable, and it is the foundation for Part 2.',
          },
        },
        {
          heading: 'Kept current, automatically',
          paragraphs: [
            'The whole pipeline runs as a set of automated jobs, one for each kind of source, with each step — load, split, tag, store — handled separately. That gives us repeatable, observable runs and, most importantly, a knowledge base that refreshes itself as our products, docs, and code change. No one has to remember to update it.',
          ],
        },
        {
          heading: 'Why this matters',
          paragraphs: [
            'Every later decision about answer quality traces back to ingestion. Splitting by structure keeps ideas whole. Tagging makes search sharper and the relationship map possible. Storing content two ways means the assistant can search by meaning and by connection. And because it all runs automatically, the knowledge stays honest as Corespan evolves.',
          ],
          callout: {
            title: 'Next in the series',
            text: 'Part 2 — How the Assistant Answers, where we follow a question from the moment it is asked to the grounded, sourced answer that comes back.',
          },
        },
      ],
    },
    {
      title: 'Part 2 — How the Assistant Answers',
      sections: [
        {
          heading: 'From knowledge base to answer',
          paragraphs: [
            'Part 1 covered how we build the knowledge base. This post is about what happens when someone actually asks a question — how it travels through the assistant and comes back as a clear, sourced answer.',
            'The assistant is not a single step. It is a short, structured workflow where each step has one job, and the answer only moves forward when it is ready. That structure is what lets the assistant stay accurate and, just as importantly, admit when it does not know something instead of guessing.',
          ],
        },
        {
          heading: 'The steps at a glance',
          paragraphs: ['Every question follows the same path:'],
          code: [
            {
              lines: [
                'Question',
                '   -> Check the question (is it something we can help with?)',
                '        - off-topic or a greeting -> a quick, direct reply',
                '        - on-topic -> search the knowledge base',
                '                        -> think about what was found',
                '                             - need more? -> look deeper, then think again',
                '                             - enough?    -> write the answer',
                '                                              -> stream it back with sources',
              ],
            },
          ],
          callout: {
            title: 'Two ideas that shape everything',
            text: 'The assistant always searches before it answers, and it is never allowed to answer from thin air.',
          },
        },
        {
          heading: 'Staying in its lane',
          paragraphs: [
            'The assistant runs in a few different places — the public site, the documentation, the code view — and each version is focused on just that area. A documentation question searches only the documentation, for example. Keeping each version focused makes answers more on-point and faster, because there is less to search through.',
          ],
        },
        {
          heading: 'Checking the question first',
          paragraphs: ['Every question is checked before anything else happens:'],
          points: [
            {
              term: 'A greeting or an empty message',
              text: '("hi", "thanks") gets a friendly, direct reply — no search needed.',
            },
            {
              term: 'An off-topic question',
              text: 'gets a polite redirect. The assistant decides whether the question has anything to do with Corespan, our products, or our field, and is smart about phrasing, so questions like "who are you?" or "how do you compare to others?" are correctly treated as fair game.',
            },
            { term: 'An on-topic question', text: 'moves on to search.' },
          ],
          callout: {
            title: 'When unsure',
            text: 'The assistant leans toward being helpful — it would rather attempt a borderline question than wrongly turn someone away.',
          },
        },
        {
          heading: 'Always search before answering',
          paragraphs: [
            "Every real question goes through a search of the knowledge base before the assistant writes anything. This is the single most important rule: the answer is built from information we actually have, not from the model's general memory.",
            'The search works in two complementary ways at once — matching by meaning and matching by exact terms — then a second pass re-sorts the results so the most relevant material rises to the top. For documentation, the search also sticks to the right version so answers do not mix releases. And if someone asks a vague follow-up like "tell me more" while reading a page, the assistant uses the page they are on to figure out what "this" refers to.',
          ],
        },
        {
          heading: 'Keeping only what is relevant',
          paragraphs: [
            'Search returns the closest matches, but closest is not always useful. So before anything reaches the answer step, the assistant takes a second look and keeps only the pieces that genuinely help with the specific question — anything off-target is dropped.',
          ],
          callout: {
            title: 'The main safeguard',
            text: "This check is the assistant's main defense against confident-but-wrong answers. If nothing survives the check, the assistant does not improvise — it clearly says it does not have that information.",
          },
        },
        {
          heading: 'Thinking, and digging deeper when needed',
          paragraphs: [
            "The relevant material goes to the assistant's reasoning step, which decides one of two things:",
          ],
          points: [
            { term: 'This is enough', text: 'write the answer.' },
            { term: 'I need more', text: 'go look further.' },
          ],
          callout: {
            title: 'Digging deeper',
            text: 'When it needs more, it can run another targeted search, or follow the relationship map from Part 1 to answer connection-style questions like "what else references this?" To keep responses quick, the assistant limits how many times it will loop before it has to give an answer.',
          },
        },
        {
          heading: 'Answering, with sources',
          paragraphs: [
            'When the assistant is ready, it writes the answer and streams it back word by word so it feels responsive. Alongside the answer, it attaches a few sources — links to the material the answer was based on — so the reader can verify it. If the assistant could not actually answer, it drops the sources rather than attaching links to a non-answer.',
          ],
        },
        {
          heading: 'The throughline: never answer ungrounded',
          paragraphs: [
            'Every design choice points the same way. The assistant always searches first. It re-sorts and filters for what is genuinely relevant. It can dig deeper when a simple match is not enough. It keeps responses quick. And when there is nothing solid to stand on, it says so instead of guessing.',
          ],
          callout: {
            title: 'Next in the series',
            text: 'That discipline is what makes an assistant safe to put in front of customers, and it is exactly what we measure in Part 3, where we cover how we check answer quality and track it over time.',
          },
        },
      ],
    },
    {
      title: 'Part 3 — Measuring Answer Quality',
      sections: [
        {
          heading: 'Why measuring is its own discipline',
          paragraphs: [
            'Part 1 built the knowledge base and Part 2 built the assistant that answers from it. This post covers the question that decides whether any of it is working: how good are the answers, and how do we know when a change makes them better or worse?',
            'AI assistants are easy to demo and surprisingly hard to trust. A tweak that improves one kind of question can quietly break another, and reading a handful of answers will not tell you which. So we treat quality-checking as a built-in, automated part of the system rather than something we do by hand now and then.',
          ],
        },
        {
          heading: 'Two things to measure, not one',
          paragraphs: [
            'An answer can go wrong in two very different places, and a good check has to separate them:',
          ],
          ordered: true,
          points: [
            {
              text: 'Did we find the right information? If the relevant material never shows up in the search results, no amount of clever wording can produce a good answer.',
            },
            {
              text: 'Did we answer well with what we found? Even with the right information in hand, an assistant can still drift, over-explain, or answer a slightly different question.',
            },
          ],
          callout: {
            title: 'Why separate them',
            text: 'Lumping these together hides problems. If answers are weak, we need to know whether to improve the search or the answering — so we measure each separately.',
          },
        },
        {
          heading: 'Checking the search',
          paragraphs: [
            'We keep a set of test questions, each paired with a known-good answer. For every one, we ask the live assistant and check what it found:',
          ],
          points: [
            {
              text: 'Did a relevant result show up near the top? The most important signal — if the right material is not in the top few results, nothing else matters.',
            },
            {
              text: 'How highly was it ranked? We reward putting the right answer at the top, not just somewhere in the list.',
            },
            { text: 'How much of the needed material was found at all?' },
          ],
          callout: {
            title: 'Speed, too',
            text: 'We also track practical things on the same run, like how long answers take, so we watch quality and speed together.',
          },
        },
        {
          heading: 'Checking the answer',
          paragraphs: [
            "Search scores say nothing about the answer itself. For that, we use an automated approach where one AI model acts as a neutral grader of another's answers. It looks at four things, each catching a different kind of mistake:",
          ],
          points: [
            {
              text: 'Is the answer backed by the sources? Our main guard against the assistant making things up.',
            },
            {
              text: 'Does it actually answer the question that was asked, rather than a nearby one?',
            },
            { text: 'Was the useful material ranked above the noise?' },
            { text: 'Did the sources actually cover what a good answer needs?' },
          ],
          callout: {
            title: 'One honest caveat',
            text: 'Grades from an AI grader are directional, not exact. A high score does not mean an answer is provably "correct" — it means the grader found it well-supported and on-point. The real value is in comparison: run against run, change against change, on the same set of questions.',
          },
        },
        {
          heading: 'What a result looks like',
          paragraphs: [
            'Every check produces a simple scoreboard plus a question-by-question breakdown. The numbers below are illustrative examples to show how it reads, not real results:',
          ],
          table: {
            headers: ['What we measure', 'Area', 'Example score'],
            rows: [
              ['Found a relevant result near the top', 'Search', '88%'],
              ['Ranked it highly', 'Search', '0.79'],
              ['Found enough of the needed material', 'Search', '0.83'],
              ['Answer backed by the sources', 'Answer', '0.91'],
              ['Answered the actual question', 'Answer', '0.87'],
              ['Useful material ranked above noise', 'Answer', '0.84'],
              ['Sources covered the answer', 'Answer', '0.80'],
              ['Average response time', 'Speed', '2.1 s'],
            ],
          },
          callout: {
            title: 'Reading the numbers',
            text: "Higher is better across the board (scores run from 0 to 1, except the top row, a percentage, and response time in seconds). The detailed breakdown then shows, for each question, whether the search hit, the assistant's actual answer, the known-good answer, and the sources it used — so a low score always traces back to a specific question and a specific cause.",
          },
        },
        {
          heading: 'Tracked over time, run automatically',
          paragraphs: [
            'The whole check runs automatically on a schedule and records its results to a dashboard, so we build up a history rather than a one-off snapshot. Each run also notes the setup it was measured under, so when we change something, we can line the new run up against the previous one and see exactly which numbers moved. A regression shows up as a dropped score right away, instead of surfacing weeks later as vague complaints.',
            "Every run also posts a short, plain-language summary to the team's chat, each number explained in a few words, so people see results without opening anything.",
          ],
        },
        {
          heading: 'Why measuring closes the loop',
          paragraphs: [
            'Ingestion decides what the assistant can know. The answering workflow decides how it uses what it knows. Measuring is how we find out whether any given change actually helped, and it is what makes improving the first two safe. Separating search from answering tells us where a problem lives. The answer grades tell us whether responses are well-supported and on-target. And the run-to-run history gives every change a clear before-and-after.',
          ],
          callout: {
            title: 'The throughline',
            text: 'Together, they turn "the assistant feels better" into something we can actually show — which is the only honest way to improve something people rely on. This concludes the Corespan AI Assistant series: a knowledge base that keeps itself current, an assistant that always grounds its answers, and automated quality checks that catch every change. Measure it, ground it, and never ship on a hunch.',
          },
        },
      ],
    },
  ],
  'ai-studio-stack-backbone': [
    {
      title: '',
      sections: [
        {
          heading: 'What the backbone has to do',
          paragraphs: [
            "People often ask what Corespan AI Studio is built on. It's a fair question, and the honest answer is that it's not one magic tool — it's a carefully chosen set of well-understood, mostly open-source pieces, each doing one job well. This post is about the backbone: the part that takes a request like \"run this benchmark on that GPU machine,\" makes it actually happen, and records the result. (This piece is open source — you can read the code yourself.) Part 2 covers the AI frameworks and the workloads that run on top.",
            'Imagine you want to benchmark a model on a specific GPU server. Behind that one click, a lot has to go right: the request has to be accepted, the job has to run on the correct machine, it might take a long time, logs need to stream back live, and the results have to be saved so you can compare them later. The backbone coordinates all of it. Here are the pieces.',
          ],
        },
        {
          heading: 'The front door: the API',
          paragraphs: [
            "Every request comes in through an API (built with FastAPI, a popular Python web framework). Think of it as the front desk. You hand it a request, it immediately gives you a ticket number so you're not left waiting, and it can stream live updates back to your screen while the work runs. It doesn't do the heavy lifting itself — it takes the order and passes it along.",
          ],
        },
        {
          heading: 'The waiting line: a job queue',
          paragraphs: [
            "GPU jobs can run for minutes or hours, so they can't run inside a quick web request. Instead, each job goes into a queue and a worker picks it up when it's ready. We use a broker (RabbitMQ) to hold the line of jobs and workers (Celery) to do the actual running.",
          ],
          callout: {
            title: 'Why a queue matters',
            text: "The big benefit is reliability. If a worker restarts or something hiccups mid-job, the queue still holds the work so it isn't lost, rather than the whole thing collapsing. Long jobs run in the background without freezing anything up front.",
          },
        },
        {
          heading: 'Reaching the GPU machines',
          paragraphs: [
            "The workers don't run the benchmark on themselves — they run it on the GPU servers. To do that, a worker securely logs into the target machine (over SSH, the standard secure way to control a remote computer) and starts the workload there.",
            'This is what lets one central system drive many different GPU boxes, whether that is a server full of NVIDIA cards or AMD cards, without anyone manually logging in and typing commands.',
          ],
        },
        {
          heading: 'Running things the same way everywhere: containers',
          paragraphs: [
            'Every workload ships as a container (using Docker). A container packages the program together with everything it needs to run, so it behaves the same on every machine — no "it worked on my computer" surprises. When a job starts, the machine pulls the right container and the model\'s files, then runs it. This is a big part of what makes results trustworthy and repeatable.',
          ],
        },
        {
          heading: 'Remembering everything: the database',
          paragraphs: [
            "Every run, its settings, its measurements, and its logs are saved into a database (PostgreSQL, a reliable open-source database). That stored history powers a leaderboard you can filter and sort, and lets you put two runs side by side to compare them. Nothing lives only in someone's terminal — it is all kept and searchable.",
          ],
        },
        {
          heading: 'Putting it together',
          paragraphs: ['Here is the whole flow in one picture:'],
          code: [
            {
              lines: [
                'You (in the browser)',
                '      -> API (takes the request, streams logs back)',
                '           -> Job queue (holds the work)',
                '                -> Worker (logs into the GPU machine)',
                '                     -> GPU machine runs the workload in a container',
                '                          -> results & logs saved to the database',
                '                               -> Dashboard you can search and compare',
              ],
            },
          ],
        },
        {
          heading: 'Why the pieces, not the parts, matter',
          paragraphs: [
            'None of these pieces is exotic on its own. The value is in how they fit together: a simple front door, a reliable waiting line, a safe way to reach many machines, containers for consistency, and a database that never forgets. That combination is what turns a pile of GPU servers into something you can actually run, trust, and learn from.',
          ],
          callout: {
            title: 'Next in the series',
            text: 'Part 2 — The AI Frameworks and Workloads, where we look at the tools that do the actual machine-learning work, and the different kinds of jobs AI Studio can run.',
          },
          relatedPostId: 'ai-studio-stack-frameworks',
          relatedLabel: 'Read Part 2: The AI Frameworks and Workloads',
        },
      ],
    },
  ],
  'ai-studio-stack-frameworks': [
    {
      title: '',
      sections: [
        {
          heading: 'What runs on top of the backbone',
          paragraphs: [
            'Part 1 covered the backbone — the system that takes a request, runs it on the right GPU machine, and saves the result. This post is about what actually runs on top: the AI tools that do the real work, and the different kinds of jobs AI Studio can handle.',
            "There's no single framework that does everything well, so we use the right tool for each job. Here's the toolkit, in plain terms.",
          ],
          relatedPostId: 'ai-studio-stack-backbone',
          relatedLabel: 'Read Part 1: The Backbone That Runs the Work',
        },
        {
          heading: 'The frameworks that run the models',
          points: [
            {
              term: 'PyTorch',
              text: 'is the workhorse. It is the most widely used framework for building and running AI models, and it powers most of our workloads, from image recognition to language model fine-tuning.',
            },
            {
              term: 'JAX (with a library called Flax)',
              text: 'is a second framework we use where raw speed matters most. For some image-recognition work, it compiles the math ahead of time so it runs especially fast and predictably on the GPU — a good example of choosing a specialized tool for a specific job rather than forcing one framework everywhere.',
            },
            {
              term: 'Hugging Face',
              text: "is where the models themselves come from. It is the industry's main hub for open models and their files; AI Studio pulls the requested model from there and caches it on the machine. Its Transformers library is also what a lot of the model code is built on.",
            },
          ],
        },
        {
          heading: 'Serving language models efficiently',
          paragraphs: [
            'Running a large language model quickly, especially for many requests at once, is its own challenge. We use vLLM, a serving engine designed to make LLMs run efficiently on GPUs and to handle lots of simultaneous requests without wasting memory. It is what sits behind our language-model benchmarks. (We are also planning to make use of other serving tools such as SGLang where they fit.)',
          ],
        },
        {
          heading: 'Measuring with a common yardstick',
          paragraphs: [
            "To make results meaningful and comparable, we lean on MLPerf, the industry-standard benchmark suite. Instead of a made-up test, MLPerf runs the same well-defined tasks the whole industry uses, for both language models and image recognition, so our numbers can be compared fairly against everyone else's.",
          ],
        },
        {
          heading: 'The workloads themselves',
          paragraphs: [
            'The platform is not tied to one kind of AI. It runs different kinds of workloads, each packaged to run on demand:',
          ],
          points: [
            {
              term: 'Language model inference and benchmarking',
              text: 'measuring how fast and efficiently a model answers.',
            },
            {
              term: 'Jupyter Notebook',
              text: 'a full interactive notebook environment launched right on a GPU machine, for hands-on experiments, custom tests, and open-ended exploration. It also includes a built-in AI assistant that helps you write, run, and understand code as you go.',
            },
          ],
        },
        {
          heading: 'Running at scale, and keeping an eye on things',
          paragraphs: [
            'Individual jobs are one thing; running many of them reliably is another. For now the backend runs on Docker — the same containers from Part 1 that keep every workload consistent from one machine to the next — and we are moving toward Kubernetes to run those containers at scale.',
          ],
        },
        {
          heading: 'The takeaway',
          paragraphs: [
            'The stack is deliberately broad and mostly open-source: proven frameworks for building and running models, an efficient engine for serving language models, a standard yardstick for measuring them, a variety of real workloads, and the automation to run it all at scale. None of it is locked to a single vendor or a single kind of AI.',
          ],
          callout: {
            title: 'The throughline',
            text: 'Paired with the backbone from Part 1, it is what lets AI Studio take almost any AI job, run it on the right hardware, and give you a result you can trust and compare.',
          },
        },
      ],
    },
  ],
  'rtx-5090-vs-h100-inference-node': [
    {
      title: '',
      sections: [
        {
          heading: 'Can consumer GPUs compete with data-center hardware?',
          paragraphs: [
            'Can a PCIe-attached consumer-GPU node actually compete with data-center hardware on real inference workloads? We put a 4× RTX 5090 node (a Corespan PRU 2500) to the test on a 32B-parameter model, and the answer turned out to hinge almost entirely on configuration. With the right setup, the node not only held its own, it out-throughput a single fully-optimized H100 on the same model class, at roughly one-tenth the cost per million tokens.',
            'Here is the run, the tuning that unlocked it, how it stacks up against published H100 numbers, and why the economics matter.',
          ],
        },
        {
          heading: 'The setup',
          points: [
            { term: 'Model', text: 'Qwen2.5-32B-Instruct' },
            { term: 'Serving', text: 'vLLM (OpenAI-compatible API on Uvicorn)' },
            { term: 'Hardware', text: '4× RTX 5090 in a PRU 2500' },
            {
              term: 'Load',
              text: '20 concurrent requests, 200 total, up to 1,024 output tokens each, generated with ApacheBench',
            },
          ],
          callout: {
            title: 'Two runs',
            text: 'We ran this twice: once with a straightforward baseline configuration, and once tuned for the specific quirks of consumer GPUs.',
          },
        },
        {
          heading: 'Run 1 — the baseline',
          paragraphs: [
            'Our first run used tensor parallel across all four GPUs (TP=4) at BF16 precision:',
          ],
          points: [
            { text: '~860 tok/s aggregate decode throughput (~215 tok/s per GPU)' },
            { text: '0.84 req/s' },
            { text: 'P50 ≈ 21.7 s, P95 ≈ 24.5 s' },
            { text: '0 failures across 200 requests' },
          ],
          callout: {
            title: 'Respectable, but not fast',
            text: "Per-GPU, ~215 tok/s sits right inside the 160–220 tok/s/GPU envelope that Qwen, vLLM, and SGLang report for full-precision 32B serving. Tail latency was tight (P95 only ~13% above P50) with zero failures or out-of-memory errors, a sign the configuration was stable. But it wasn't fast — and the reason points directly at how to fix it.",
          },
        },
        {
          heading: 'Why the baseline left performance on the table',
          paragraphs: [
            'The RTX 5090 has no NVLink. That single fact drives the whole tuning story. With tensor parallel, every layer\'s math is split across GPUs, which means the GPUs must constantly exchange partial results (an "all-reduce") — and on a 5090 node, all that traffic has to cross the PCIe bus. That cross-GPU chatter becomes the bottleneck.',
            'So we changed three things at once:',
          ],
          points: [
            {
              term: 'Pipeline parallel (PP=4) instead of tensor parallel',
              text: 'Instead of splitting each layer across GPUs, pipeline parallel gives each GPU a different stage of the model and passes work down the line. It largely avoids the PCIe-bound all-reduce that was throttling the baseline. On consumer GPUs without NVLink, this is the single biggest win.',
            },
            {
              term: 'FP8 precision',
              text: "The 5090's Blackwell architecture supports FP8 natively, worth roughly 1.3–1.5× over BF16 for this kind of work.",
            },
            {
              term: 'Chunked prefill with a large token budget',
              text: 'Using `--max-num-batched-tokens 65536` keeps all four pipeline stages full instead of stalling.',
            },
          ],
        },
        {
          heading: 'Run 2 — the tuned configuration',
          paragraphs: ['Same model, same hardware, same load. Only the configuration changed:'],
          points: [
            { text: '~5,345 tok/s aggregate (~1,336 tok/s per GPU)' },
            { text: '5.22 req/s' },
            { text: 'P50 = 127 ms, P95 ≈ 7.0 s' },
            { text: '0 failures across 200 requests' },
          ],
        },
        {
          heading: 'Before and after',
          table: {
            headers: [
              'Metric',
              'Baseline (TP=4, BF16)',
              'Tuned (PP=4, FP8, chunked prefill)',
              'Change',
            ],
            rows: [
              ['Aggregate throughput', '~860 tok/s', '~5,345 tok/s', '~6.2×'],
              ['Per-GPU throughput', '~215 tok/s', '~1,336 tok/s', '~6.2×'],
              ['Requests/sec', '0.84', '5.22', '~6.2×'],
              ['Median latency (P50)', '21.7 s', '127 ms', '~170× faster'],
              ['P95 latency', '24.5 s', '7.0 s', '~3.5× faster'],
              ['Failures', '0 / 200', '0 / 200', 'unchanged'],
            ],
          },
          callout: {
            title: 'A 6.2× gain from configuration alone',
            text: 'No hardware change. The latency collapse is the tell: with the all-reduce bottleneck gone, most requests clear the pipeline near-instantly because first-token time and decode are no longer serialized behind synchronous cross-GPU communication.',
          },
        },
        {
          heading: 'How it compares to an H100',
          paragraphs: [
            "The most useful yardstick is a single H100 SXM running the same 32B model class at FP8, as published in GPUStack's H100 performance lab:",
          ],
          table: {
            headers: ['Configuration', 'Total throughput', 'Per-GPU'],
            rows: [
              ['1× H100 SXM, vLLM, BF16', '2,352 tok/s', '2,352 tok/s'],
              ['1× H100 SXM, vLLM, FP8', '~4,005 tok/s', '~4,005 tok/s'],
              [
                '1× H100 SXM, TRT-LLM FP8 + chunked prefill (optimized)',
                '4,285 tok/s',
                '4,285 tok/s',
              ],
              [
                '4× RTX 5090, vLLM FP8 + PP + chunked prefill (this test)',
                '~5,345 tok/s',
                '~1,336 tok/s/GPU',
              ],
            ],
          },
          points: [
            {
              term: 'On aggregate throughput, the 4× 5090 node wins',
              text: 'It out-throughputs a single fully-optimized H100 SXM on the same model class (5,345 vs. 4,285 tok/s), and it does so on vLLM rather than a hand-optimized TRT-LLM stack, so there is still headroom.',
            },
            {
              term: 'Per GPU, the H100 still wins, by roughly 3.2×',
              text: "That is expected: the H100 has HBM3, NVLink, and far more memory bandwidth (~3.35 TB/s vs. the 5090's ~1.79 TB/s GDDR7). The 5090's case was never single-GPU performance.",
            },
          ],
          callout: {
            title: 'The real comparison',
            text: "The 5090's case is aggregate throughput per dollar.",
          },
        },
        {
          heading: 'The cost story',
          paragraphs: [
            'At sustained utilization, a 4× RTX 5090 PRU 2500 node delivers Qwen-32B-class FP8 inference at roughly $0.04 per million tokens, against roughly $0.30–0.60 per million tokens for an H100 on cloud pricing depending on the provider. That is not a marginal improvement; it is 7.5×–15× cheaper for the same model class at comparable throughput. Over a production deployment serving billions of tokens a month, that gap is the difference between an inference workload that pencils out and one that does not.',
          ],
        },
        {
          heading: 'Where the savings start: hardware acquisition cost',
          paragraphs: [
            'The cloud-cost gap is downstream of an even more basic one, the raw cost of the GPUs. At current list pricing an RTX 5090 is about $4,000 per card, an H100 PCIe runs $25,000–30,000, and an H100 SXM (the variant in the throughput comparison above) runs $35,000–40,000 and only ships inside complete HGX systems. Per node:',
          ],
          table: {
            headers: ['Node', 'Approx. GPU cost'],
            rows: [
              ['4× RTX 5090', '~$16,000'],
              ['4× H100 PCIe', '~$110,000'],
              ['4× H100 SXM', '~$150,000'],
              ['8× H100 SXM (typical HGX)', '~$300,000'],
            ],
          },
          callout: {
            title: 'The underlying reason',
            text: 'The 4× 5090 node beats a fully-optimized single H100 SXM on aggregate throughput while costing roughly one-ninth as much in GPU hardware as a 4× H100 SXM node, and about one-nineteenth as much as the 8× H100 SXM HGX systems customers usually benchmark against — before you even add the chassis, NVLink switching, networking, and cooling that HGX systems require. That is the underlying reason cost-per-token collapses: the hardware is roughly an order of magnitude cheaper to acquire and delivers equal or better throughput on the workloads that matter.',
          },
        },
        {
          heading: 'What happens at 8 and 10 GPUs',
          paragraphs: [
            'The 4× number is the floor, not the ceiling. A PRU 2500 can hold 8 or 10 RTX 5090s, which opens two deployment modes:',
          ],
          points: [
            {
              term: 'Pipeline-parallel one big model (PP=8 or PP=10)',
              text: 'For 32B-class models at FP8, deeper pipelines give the scheduler more stages to fill. Throughput scales meaningfully (though not perfectly linearly, since pipeline-bubble overhead grows with depth), putting an 8× 5090 node into dual-H100-SXM territory on aggregate throughput at a fraction of the cost.',
            },
            {
              term: 'Replica parallelism for models that fit per-GPU',
              text: 'Running one independent model instance per GPU has zero inter-GPU traffic on the critical path, so it scales almost linearly. A published 4× RTX 5090 benchmark of a 30B model at INT4, one instance per GPU, hit 12,744 tok/s (CloudRift); extrapolated to 8–10 GPUs in a single chassis, that is roughly 25,000–32,000 tok/s for models that fit in 32 GB VRAM at INT4.',
            },
          ],
          callout: {
            title: 'In practice',
            text: 'Most production deployments will run a mix: pipeline-parallel for the large models served externally, replica-parallel for smaller specialized models behind internal tools.',
          },
        },
        {
          heading: 'Why the chassis matters',
          paragraphs: [
            'Benchmark numbers only translate to production if the node can sustain them. The PRU 2500 running 5090s is fully liquid-cooled, which is what makes continuous full-power operation on 5090-class silicon practical — air-cooled multi-5090 nodes throttle under sustained load well before they reach their published numbers.',
            'Its split-side design supports up to 5× liquid-cooled RTX 5090 on one side while the other side can host another 5× 5090 (for a 10-GPU node), RTX 6000 PRO cards (96 GB VRAM each, for larger models or fine-tuning), AMD Instinct MI350 accelerators (for ROCm/dual-vendor strategies), or up to 600 TB of SSD for RAG, vector search, or model caching. That composability, mixing accelerator families and storage in one chassis, is the real product.',
            'On stability, the tuned run recorded zero failures across 200 requests and no out-of-memory events at the 64K batched-token budget, with the cooling loop keeping every GPU inside its thermal envelope for the full run.',
          ],
        },
        {
          heading: 'A note on the latency numbers',
          paragraphs: [
            'The tuned P50 of 127 ms deserves a caveat, because it is strikingly low for a 1,024-token decode.',
          ],
          callout: {
            title: 'A mixed workload, not instability',
            text: 'Many requests finish well short of the 1,024-token cap (the model emits an end-of-sequence token early on short prompts) and now stream out in tens of milliseconds, while the genuinely long completions still take a few seconds. The mean was 3.83 s, P95 was 7.0 s, and the max was 30.1 s — exactly what ~1,336 tok/s/GPU implies for a full 1,024-token decode. Most requests clear the pipeline almost instantly and a few long ones decode the full window.',
          },
        },
        {
          heading: 'Takeaways',
          points: [
            {
              term: 'Configuration matters more than most people assume',
              text: 'The same hardware went 6.2× faster with no silicon change, just the right parallelism, precision, and scheduling.',
            },
            {
              term: 'On NVLink-less consumer GPUs, pipeline parallel beats tensor parallel',
              text: 'Avoiding PCIe-bound all-reduce is the key unlock; FP8 and chunked prefill stack cleanly on top.',
            },
            {
              term: 'A 4× RTX 5090 node is a serious inference option',
              text: 'It can match or beat a single optimized H100 on aggregate 32B throughput, at roughly one-tenth the cost per token and one-ninth the hardware cost, and it scales well past that at 8–10 GPUs.',
            },
          ],
          callout: {
            title: 'The headline',
            text: "The headline isn't that consumer GPUs beat data-center GPUs — they don't, per chip. It's that with the right configuration and the right chassis, a well-chosen consumer node delivers data-center-class aggregate throughput at a cost structure that's hard to argue with.",
          },
          relatedPostId: 'benchmarking-gpu-clusters',
          relatedLabel:
            'Read: Benchmarking GPU Clusters — Why It Matters, and How We Built AI Studio',
        },
        {
          heading: 'Sources',
          points: [
            {
              term: 'Corespan Systems',
              text: '"Why the PRU 2500 With RTX 5090s Is the Smartest Inference Node You Can Buy Right Now" (corespan.ai/resources/blog)',
            },
            {
              term: 'GPUStack',
              text: 'Optimizing Qwen-32B on H100 (docs.gpustack.ai)',
            },
            {
              term: 'CloudRift',
              text: 'RTX 5090 LLM inference benchmarks and cost figures (cloudrift.ai/gpu-benchmarks)',
            },
            {
              term: 'vLLM',
              text: '32B FP8 serving benchmark (GitHub Issue #17788)',
            },
            {
              term: 'Jarvislabs',
              text: '32B scaling curves on H100 (jarvislabs.ai)',
            },
            {
              term: 'Community benchmark',
              text: '4× RTX 5090 tensor-parallel vs. pipeline-parallel (r/LocalLLaMA, Oct 2025)',
            },
          ],
          callout: {
            title: 'A note on comparisons',
            text: 'External comparisons use the same 32B model class at FP8 but differing exact models, datasets, and concurrency profiles, so they are best read as order-of-magnitude reference points rather than exact head-to-head numbers.',
          },
        },
      ],
    },
  ],
}
