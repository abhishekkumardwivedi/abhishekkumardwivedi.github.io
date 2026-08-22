---
title: Articles
description: Notes and tutorials on embedded platforms, automotive architecture, edge AI, and engineering leadership.
---

This section will grow into a practical library of tutorials, architecture explanations, design notes, and lessons learned.

## Topics

- Android, AAOS, Linux, Yocto, BSP, and system internals
- Qualcomm automotive compute and heterogeneous acceleration
- Edge AI, PyTorch compilation, ExecuTorch, GPU/NPU concepts
- Autonomous-driving perception, fusion, planning, and simulation
- Functional safety, SOTIF, cybersecurity, and systems engineering
- Product architecture, technical leadership, and innovation

Start with [Math Behind Modern AI](/articles/math-behind-modern-ai/) for the foundations. Continue to [Anatomy of a Perception Model](/articles/anatomy-of-a-perception-model/) to see how backbones, necks, heads, encoders, and decoders fit together. Then read [From Camera Frame to Driving Decision](/articles/camera-to-driving-decision/) for a system-level view.

## Perception and deployment series

1. [RGB Camera Encoders](/articles/rgb-camera-encoders/)
2. [Event Camera Encoders](/articles/event-camera-encoders/)
3. [LiDAR Encoders](/articles/lidar-encoders/)
4. [Radar Encoders](/articles/radar-encoders/)
5. [IMU & GNSS Models](/articles/imu-gnss-models/)
6. [Ultrasonic Parking Models](/articles/ultrasonic-parking-models/)
7. [Spatial–Temporal Models](/articles/spatial-temporal-models/)
8. [BEV Model Selection](/articles/bev-model-selection/)
9. [World Models](/articles/world-models/)
10. [PyTorch Export & Compile](/articles/pytorch-export-compile/)

Each article starts from the sensor or representation contract, compares appropriate model families, shows a generic architecture diagram and code example, and finishes with practical selection criteria. The series is educational and intentionally does not describe a specific product implementation.

## Publishing a new article

Create a Markdown file under `src/content/docs/articles/`, add a title and description at the top, then push it to `main`. GitHub Actions will rebuild and publish the site automatically.
