---
title: Autonomy & Edge AI
description: A guided library covering model foundations, sensor intelligence, perception, fusion, world models, and deployment.
---

This section follows the path from mathematical building blocks to deployable intelligence for physical systems. The conceptual articles explain reusable engineering principles, while the nuScenes series provides a stage-by-stage hands-on implementation path.

## Hands-on nuScenes build

1. [nuScenes Autonomy Pipeline: From Raw Sensors to World Model](/articles/nuscenes-autonomy-pipeline/) — the living roadmap from WebRTC and raw sensor contracts through BEV fusion, temporal perception, prediction and planning inputs.
2. [Stage 2: Multi-Sensor Playback and Time Synchronization](/articles/nuscenes-pipeline-stage2/) — six recorded cameras, LiDAR/radar geometric BEV, per-sensor timing offsets, ego-frame transforms, RunPod and WebRTC, with no AI inference yet.

As each new stage is implemented, the pipeline index and this section will be updated so the written architecture stays aligned with the working code.

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
2. [Model Atlas for Physical AI](/articles/model-atlas-physical-ai/) — a curated map of widely used perception, BEV, planning, manipulation, and vision–language–action models for autonomous vehicles and humanoid robots.

Safety-focused material is grouped separately under [Safety & Assurance](/articles/safety-assurance/) so model design and safety arguments remain easy to navigate independently.
