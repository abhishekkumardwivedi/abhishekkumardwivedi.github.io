---
title: Autonomy & Edge AI
description: A guided library covering model foundations, sensor intelligence, perception, fusion, world models, and deployment.
---

This section follows the path from mathematical building blocks to deployable intelligence for physical systems. The articles are intentionally generic: they explain reusable engineering principles without revealing a specific product implementation.

## 1. Foundations

1. [Math Behind Modern AI](/articles/math-behind-modern-ai/) — linear algebra, probability, optimisation, convolution, recurrence, attention, graphs, and state-space models.
2. [Anatomy of a Perception Model](/articles/anatomy-of-a-perception-model/) — how stems, backbones, encoders, necks, heads, decoders, losses, and post-processing fit together.
3. [From Camera Frame to Driving Decision](/articles/camera-to-driving-decision/) — the complete path through perception, fusion, prediction, planning, and control.

## 2. Sensor intelligence

1. [RGB Camera Encoders](/articles/rgb-camera-encoders/)
2. [Event Camera Encoders](/articles/event-camera-encoders/)
3. [LiDAR Encoders](/articles/lidar-encoders/)
4. [Radar Encoders](/articles/radar-encoders/)
5. [IMU & GNSS Models](/articles/imu-gnss-models/)
6. [Ultrasonic Parking Models](/articles/ultrasonic-parking-models/)

Each starts from the sensor contract, compares suitable representation and model families, and ends with practical selection criteria.

## 3. Fusion, time, and world understanding

1. [Spatial–Temporal Models](/articles/spatial-temporal-models/) — memory, motion, and temporal context.
2. [BEV Model Selection](/articles/bev-model-selection/) — geometry-based, depth-lifted, query-based, voxel, and hybrid representations.
3. [World Models](/articles/world-models/) — learned state, dynamics, uncertainty, possible futures, and planning interfaces.

## 4. Deployment

1. [PyTorch Export & Compile](/articles/pytorch-export-compile/) — export, compilation, quantisation, lowering, packaging, and on-device runtime flow.

Safety-focused material is grouped separately under [Safety & Assurance](/articles/safety-assurance/) so model design and safety arguments remain easy to navigate independently.
