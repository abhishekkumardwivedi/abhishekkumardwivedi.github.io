---
title: Articles
description: Engineering notes on embedded platforms, automotive systems, autonomy, edge AI, safety, and technical leadership.
---

import { CardGrid, LinkCard } from '@astrojs/starlight/components';

This is a structured engineering library rather than a chronological blog. The technical sections are organized around system contracts, architecture boundaries, failure modes and deployment behavior rather than introductory definitions.

<CardGrid>
  <LinkCard title="Autonomy & Edge AI" description="Sensor physics and encoders, localization, BEV, temporal state, world models, prediction and deployment." href="/articles/autonomy-edge-ai/" />
  <LinkCard title="Embedded & Automotive" description="Heterogeneous vehicle compute, memory/data movement, security boundaries, deterministic control and BSP integration." href="/articles/embedded-automotive/" />
  <LinkCard title="Safety & Assurance" description="SOTIF, functional safety, AI assurance, cybersecurity, systems engineering, and release evidence." href="/articles/safety-assurance/" />
  <LinkCard title="Algorithms & Problem Solving" description="Reusable algorithm patterns, data structures, complexity reasoning, and concise solution notes." href="/articles/algorithms/" />
  <LinkCard title="Business, Product & Leadership" description="Product strategy, entrepreneurship, engineering management, organisational design, and innovation." href="/articles/business-leadership/" />
</CardGrid>

## Recommended autonomy path

For a system-level reading sequence, begin with [From Sensor Measurement to Vehicle Motion](/articles/camera-to-driving-decision/). Then move through the camera/LiDAR/radar encoder articles, [IMU & GNSS Models](/articles/imu-gnss-models/), [BEV Model Selection](/articles/bev-model-selection/), [Spatial–Temporal Models](/articles/spatial-temporal-models/), and [World Models](/articles/world-models/). Use [Anatomy of a Perception Model](/articles/anatomy-of-a-perception-model/) and [Math Behind Modern AI](/articles/math-behind-modern-ai/) as model-internal references where useful.

The [nuScenes Autonomy Pipeline](/articles/nuscenes-autonomy-pipeline/) is the staged implementation companion. [Stage 2](/articles/nuscenes-pipeline-stage2/) establishes sensor identity, asynchronous timing and coordinate geometry before inference; [Stage 3](/articles/nuscenes-pipeline-stage3/) introduces camera preprocessing, shared learned encoding and an explicit feature-tensor contract.

## Complete classification

### Autonomy & Edge AI

- **System architecture:** [From Sensor Measurement to Vehicle Motion](/articles/camera-to-driving-decision/)
- **Staged implementation:** [nuScenes Autonomy Pipeline](/articles/nuscenes-autonomy-pipeline/), [Stage 2: Multi-Sensor Playback and Time Synchronization](/articles/nuscenes-pipeline-stage2/), and [Stage 3: From RGB Pixels to Learned Camera Features](/articles/nuscenes-pipeline-stage3/)
- **Model internals:** [Math Behind Modern AI](/articles/math-behind-modern-ai/) and [Anatomy of a Perception Model](/articles/anatomy-of-a-perception-model/)
- **Sensor representations:** [RGB camera](/articles/rgb-camera-encoders/), [event camera](/articles/event-camera-encoders/), [LiDAR](/articles/lidar-encoders/), [radar](/articles/radar-encoders/), [IMU & GNSS](/articles/imu-gnss-models/), and [ultrasonic](/articles/ultrasonic-parking-models/)
- **Localization & maps:** [HD Maps & RTK Localization](/articles/hd-maps-rtk-localization/)
- **Spatial, temporal and world state:** [BEV Model Selection](/articles/bev-model-selection/), [Spatial–Temporal Models](/articles/spatial-temporal-models/), and [World Models](/articles/world-models/)
- **Deployment:** [PyTorch Export & Compile](/articles/pytorch-export-compile/) and [Model Atlas for Physical AI](/articles/model-atlas-physical-ai/)

### Embedded & Automotive

- **SoC/system view:** [Compute, Memory and Trust Boundaries](/articles/qualcomm-soc-compute-map/)
- **Remote/accelerated execution:** [DSP Domains](/articles/qualcomm-dsp-domains/) and [Hexagon NPU / HTP](/articles/qualcomm-npu-htp/)
- **Security:** [TrustZone & TEE](/articles/qualcomm-trustzone-tee/)
- **Pixel/display pipelines:** [Camera ISP](/articles/qualcomm-camera-isp/) and [Display Processing / DPU](/articles/qualcomm-display-dpu/)
- **Data movement:** [DMA, SMMU & Shared Buffers](/articles/qualcomm-dma-smmu/)
- **Vehicle control:** [AURIX for Vehicle Control: Building a Deterministic Safety Island](/articles/aurix-vehicle-control/)

### Safety & Assurance

- **Intended functionality:** [SOTIF in Practice: Finding the Unsafe Without a Fault](/articles/sotif-autonomous-driving/)
- **Malfunctioning behaviour:** [Functional Safety in Practice: From Hazard to Fault-Tolerant Control](/articles/functional-safety-av/)
- **Learning-enabled systems:** [AI Safety in the Vehicle: From Dataset to Runtime Guardrails](/articles/automotive-ai-safety/)

## Publishing a new article

Create a Markdown file under `src/content/docs/articles/`, add a title and description at the top, and add it to the appropriate section in the site navigation. GitHub Actions rebuilds and publishes the site automatically.
