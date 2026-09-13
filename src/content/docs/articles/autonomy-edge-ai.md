---
title: Autonomy & Edge AI
description: A systems-oriented autonomy library covering measurement contracts, learned sensor representations, metric BEV, temporal state, prediction, world models and deployment.
---

This section treats autonomy as a **state-estimation, representation and control problem implemented with learned and classical components**, not as a catalogue of neural-network names.

The recurring questions are deliberately system-level:

```text
What was physically measured?
At what time and in which coordinate frame?
What information did the encoder preserve or discard?
How is evidence transferred into metric space?
How does past state align with current state?
What uncertainty survives into prediction/planning?
What is the runtime/memory cost on the target compute?
What resets or degrades when a sensor/model/subsystem fails?
```

A technically credible autonomy architecture becomes much easier to reason about when each article answers those questions at one boundary.

## A useful autonomy decomposition

```mermaid
flowchart LR
    M["Timed sensor measurements"] --> E["Sensor encoders"]
    E --> B["Metric BEV / spatial state"]
    B --> T["Temporal state"]
    T --> I["Objects / occupancy / map state"]
    I --> P["Future prediction"]
    P --> W["World state / dynamics"]
    W --> PL["Planning"]
    PL --> C["Control + supervision"]
```

This sequence is not intended to prescribe one production architecture. End-to-end models can merge several boxes. The decomposition remains useful because **time, geometry, uncertainty, memory and authority do not disappear when modules are merged into one network**.

## 1. Start with measurement and model anatomy

1. [Math Behind Modern AI](/articles/math-behind-modern-ai/) — the mathematical operators behind modern learned models.
2. [Anatomy of a Perception Model](/articles/anatomy-of-a-perception-model/) — tensor contracts across stem, backbone, neck, head and decoder.
3. [From Sensor Measurement to Vehicle Motion](/articles/camera-to-driving-decision/) — the full systems path from timestamped observations through BEV, temporal state, prediction, planning and control.

The third article is the system map for everything that follows. It makes a critical distinction: **a feature tensor is evidence, a BEV is a coordinate representation, a world state is an estimate, a prediction is a distribution, and a plan is an action proposal**.

## 2. Sensor representation: preserve what is physically distinctive

Different sensors should not be reduced prematurely to a common generic tensor if that destroys their useful measurement semantics.

- [Camera Encoder: ResNet-50 + FPN](/articles/rgb-camera-encoders/) — image-space feature hierarchy, activation memory, stride and camera-geometry handoff.
- [Event Camera Encoders](/articles/event-camera-encoders/) — asynchronous contrast events, temporal windowing, time surfaces/voxels, sparse state and high-rate RGB fusion.
- [LiDAR Encoders](/articles/lidar-encoders/) — per-point time/deskew, pillars, sparse voxels, range view, multi-sweep accumulation and sparsity economics.
- [Radar Encoders](/articles/radar-encoders/) — FMCW range/Doppler/angle products, CFAR information loss, radial velocity semantics, multipath and temporal radar.
- [IMU & GNSS Models](/articles/imu-gnss-models/) — strapdown propagation, error-state estimation, RTK quality, frames, lever arms and learned residuals.
- [Ultrasonic Parking Models](/articles/ultrasonic-parking-models/) — acoustic time-of-flight, beam uncertainty, no-return semantics, multipath and local occupancy.

The design principle across all six is the same:

> **Use geometry and physics for what is known; use learning for ambiguity that remains.**

## 3. Localization and map context

[HD Maps & RTK Localization](/articles/hd-maps-rtk-localization/) connects global positioning, inertial state, map topology, perception landmarks and degradation behavior.

Localization is an upstream dependency of almost every later stage. A 1° yaw error at 50 m is close to a meter of lateral BEV error. Therefore camera/LiDAR/radar model accuracy cannot be discussed independently from the pose and timestamp used to place their evidence in metric space.

## 4. BEV: create a common metric state

[BEV Model Selection](/articles/bev-model-selection/) is the central spatial-representation article.

It compares:

```text
inverse perspective mapping
explicit depth lift-and-splat
query/deformable BEV
LiDAR pillar/voxel BEV
radar BEV
multi-modal common-BEV fusion
```

The important topics are not only architecture names. The article treats:

- BEV bounds/cell resolution as a metric contract;
- camera depth ambiguity;
- depth-bin and frustum-memory cost;
- query projection through intrinsics/extrinsics;
- visibility/unknown semantics;
- multi-camera overlap and skew;
- height collapse;
- localization sensitivity;
- scatter/gather deployment cost.

That provides the foundation for understanding BEVFusion/BEVFormer-style systems without treating them as black boxes.

## 5. Temporal perception: a learned state-estimation problem

[Spatial–Temporal Models](/articles/spatial-temporal-models/) explains what happens once the system has more than one observation.

The core operation is not “attention over frames.” It is:

```text
past evidence
   -> ego-motion alignment
   -> distinguish static vs dynamic residual motion
   -> age/visibility-aware memory update
   -> current temporal state
```

The article compares aligned fixed windows, temporal convolution, recurrent BEV/ConvGRU, attention and state-space models while keeping state reset, variable `Δt`, missing frames and causal evaluation explicit.

## 6. Scene interpretation versus world state

Detection, occupancy, lanes and tracks are different representations of the same environment.

Object state is compact and useful for interaction/prediction. Occupancy preserves unknown or irregular obstacles. Map/topology represents road constraints. Dense learned BEV retains information that explicit heads may discard.

A robust autonomy system often keeps several of these states simultaneously rather than forcing everything into one object list.

## 7. Prediction and world models

[World Models](/articles/world-models/) defines a world model precisely as:

> a time-indexed, uncertainty-aware belief state plus a model of how that state can evolve under ego action and external-agent behavior.

The article separates:

```text
observation update
state/belief
forward dynamics
multimodal agent futures
future occupancy
action-conditioned rollout
planning interface
```

This avoids two common confusions:

- temporal perception is not automatically a world model;
- realistic future-video generation is not automatically useful vehicle dynamics.

For planning, state and future predictions must remain metric, action-sensitive and calibrated.

## 8. Deployment is part of model architecture

[PyTorch Export & Compile](/articles/pytorch-export-compile/) covers graph capture, `torch.compile` versus `torch.export`, quantization, partitioning, ExecuTorch and backend lowering.

For vehicle deployment, the important extension is to ask what the graph becomes on the target SoC:

```text
preprocessing
 -> exported graph
 -> supported accelerator partitions
 -> fallback boundaries
 -> tensor layout/precision changes
 -> runtime buffers
 -> sustained latency / thermal behavior
```

The companion [Qualcomm HTP/NPU article](/articles/qualcomm-npu-htp/) goes deeper into graph partitioning, layout, memory registration and sustained inference on an automotive heterogeneous SoC.

## 9. Hands-on staged nuScenes build

The [nuScenes Autonomy Pipeline](/articles/nuscenes-autonomy-pipeline/) is the implementation companion to these conceptual articles.

The purpose of the staged build is not to document a cloud environment. It is to make each architecture boundary **observable before the next one is added**.

Current sequence:

1. transport/visualization substrate;
2. [sensor playback, synchronization and geometry](/articles/nuscenes-pipeline-stage2/);
3. [camera encoder and feature inspection](/articles/nuscenes-pipeline-stage3/);
4. camera features -> BEV;
5. LiDAR/radar learned encoding;
6. multi-sensor BEV fusion;
7. temporal BEV;
8. scene interpretation/tracking;
9. prediction;
10. world state;
11. planner inputs.

The conceptual articles explain the general engineering problem. The staged build then makes those contracts concrete with real tensor shapes, sensor timestamps, transforms, feature maps and runtime measurements.

## 10. Model atlas: use models as references, not architecture substitutes

[Model Atlas for Physical AI](/articles/model-atlas-physical-ai/) maps representative open models to actual jobs: DINO/RT-DETR/Depth Anything for perception tooling, BEVFormer/BEVFusion/MapTR/UniAD/VAD for driving research, and ACT/Diffusion Policy/VLA families for robotics.

Its role is selection/navigation after the architecture is understood. A model name should never replace a defined sensor, state, timing and safety contract.

## Recommended reading order for an experienced engineer

If the objective is to understand an autonomy system rather than study ML chronologically:

```text
From Sensor Measurement to Vehicle Motion
        ↓
Camera + LiDAR + Radar encoder articles
        ↓
IMU/GNSS + HD maps/localization
        ↓
BEV Model Selection
        ↓
Spatial–Temporal Models
        ↓
World Models
        ↓
PyTorch Export & Compile
        ↓
nuScenes staged implementation as concrete verification
```

Use [Anatomy of a Perception Model](/articles/anatomy-of-a-perception-model/) or [Math Behind Modern AI](/articles/math-behind-modern-ai/) as references when a model-internal concept needs refreshing rather than as mandatory prerequisites.

## The unifying idea

The sophistication of an autonomy stack is not measured by how many models it contains. It is measured by whether increasingly strong claims about the world are justified by increasingly well-structured evidence:

```text
measurement
  -> learned feature
  -> metric spatial evidence
  -> temporal belief
  -> objects/occupancy/map state
  -> possible futures
  -> risk-aware plan
  -> supervised vehicle motion
```

At every arrow, preserve enough **time, geometry, uncertainty and provenance** to explain why the next statement is trustworthy.
