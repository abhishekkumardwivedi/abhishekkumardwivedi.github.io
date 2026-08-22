---
title: Articles
description: Notes and tutorials on embedded platforms, automotive architecture, edge AI, and engineering leadership.
---

import { CardGrid, LinkCard } from '@astrojs/starlight/components';

This is a structured engineering library rather than a chronological blog. Choose a domain below, or follow the suggested learning path if you are beginning with autonomy and edge AI.

<CardGrid>
  <LinkCard title="Autonomy & Edge AI" description="Model foundations, sensor encoders, perception, BEV, temporal reasoning, world models, and deployment." href="/articles/autonomy-edge-ai/" />
  <LinkCard title="Embedded & Automotive" description="Vehicle compute, deterministic control, embedded platforms, interfaces, and software-defined vehicle architecture." href="/articles/embedded-automotive/" />
  <LinkCard title="Safety & Assurance" description="SOTIF, functional safety, AI assurance, cybersecurity, systems engineering, and release evidence." href="/articles/safety-assurance/" />
  <LinkCard title="Algorithms & Problem Solving" description="Reusable algorithm patterns, data structures, complexity reasoning, and concise solution notes." href="/articles/algorithms/" />
  <LinkCard title="Business, Product & Leadership" description="Product strategy, entrepreneurship, engineering management, organisational design, and innovation." href="/articles/business-leadership/" />
</CardGrid>

## Recommended autonomy learning path

Start with [Math Behind Modern AI](/articles/math-behind-modern-ai/) for the foundations. Continue to [Anatomy of a Perception Model](/articles/anatomy-of-a-perception-model/) to see how backbones, necks, heads, encoders, and decoders fit together. Then read [From Camera Frame to Driving Decision](/articles/camera-to-driving-decision/) for the system-level view.

From there, explore sensor-specific encoders, move into spatial–temporal modelling and BEV, then finish with world models and deployment. The [Autonomy & Edge AI section](/articles/autonomy-edge-ai/) provides the complete sequence.

## Complete classification

### Autonomy & Edge AI

- **Foundations:** [Math Behind Modern AI](/articles/math-behind-modern-ai/) and [Anatomy of a Perception Model](/articles/anatomy-of-a-perception-model/)
- **System view:** [From Camera Frame to Driving Decision](/articles/camera-to-driving-decision/)
- **Sensor intelligence:** [RGB camera](/articles/rgb-camera-encoders/), [event camera](/articles/event-camera-encoders/), [LiDAR](/articles/lidar-encoders/), [radar](/articles/radar-encoders/), [IMU & GNSS](/articles/imu-gnss-models/), and [ultrasonic](/articles/ultrasonic-parking-models/)
- **Fusion and reasoning:** [Spatial–Temporal Models](/articles/spatial-temporal-models/), [BEV Model Selection](/articles/bev-model-selection/), and [World Models](/articles/world-models/)
- **Deployment:** [PyTorch Export & Compile](/articles/pytorch-export-compile/)

### Embedded & Automotive

- **Vehicle control:** [AURIX for Vehicle Control: Building a Deterministic Safety Island](/articles/aurix-vehicle-control/)

### Safety & Assurance

- **Intended functionality:** [SOTIF in Practice: Finding the Unsafe Without a Fault](/articles/sotif-autonomous-driving/)
- **Malfunctioning behaviour:** [Functional Safety in Practice: From Hazard to Fault-Tolerant Control](/articles/functional-safety-av/)
- **Learning-enabled systems:** [AI Safety in the Vehicle: From Dataset to Runtime Guardrails](/articles/automotive-ai-safety/)

## Publishing a new article

Create a Markdown file under `src/content/docs/articles/`, add a title and description at the top, and add it to the appropriate section in the site navigation. GitHub Actions will rebuild and publish the site automatically.
