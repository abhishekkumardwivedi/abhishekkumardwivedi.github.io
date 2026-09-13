---
title: "BEV Model Selection"
description: "An expert treatment of bird's-eye-view construction: coordinate contracts, depth lifting, query projection, voxel fusion, discretization, visibility, uncertainty and runtime cost."
sidebar:
  order: 11
---

Bird's-eye view (BEV) is not a model. It is a **metric intermediate coordinate system** in which evidence from different cameras, times and sensor modalities can be compared using vehicle/world geometry.

The design problem is therefore not “which BEV network is best?” It is:

> **How is uncertain sensor evidence transferred into a common 3D/ground-aligned state without destroying the geometry, visibility and timing needed downstream?**

Different BEV families answer that question differently.

## 1. Define the BEV coordinate contract before choosing a network

A BEV tensor is meaningless without its geometry.

For example:

```text
reference frame: current ego frame
x: forward, [-20, 80] m
y: left,    [-50, 50] m
cell size: 0.5 m
shape: 200 × 200
feature channels: 256
reference timestamp: t_ref
```

Then cell `(i,j)` maps to a metric region by a deterministic convention.

The contract should specify:

- frame and axis orientation;
- origin;
- metric bounds;
- cell/voxel resolution;
- feature stride if a backbone further downsamples BEV;
- reference timestamp/pose;
- height treatment;
- visibility/validity representation.

Without this, two tensors with the same `[C,H,W]` shape can refer to completely different physical space.

## 2. BEV discretization is a sensing decision

For a fixed region, halving cell size approximately quadruples a 2D BEV grid.

Example:

```text
100 m × 100 m at 0.5 m -> 200 × 200 = 40k cells
100 m × 100 m at 0.25 m -> 400 × 400 = 160k cells
```

At 256 FP16 channels:

```text
200 × 200 × 256 × 2 bytes ≈ 20.5 MB
400 × 400 × 256 × 2 bytes ≈ 81.9 MB
```

That is one feature tensor, before temporal history, gradients or intermediate activations.

Grid resolution must therefore come from task geometry. If the planner needs 10 cm curb precision, a 1 m BEV cell cannot recover it later.

## 3. Camera pixels do not have metric depth by themselves

For camera intrinsics `K`, image point `p=[u,v,1]^T` and depth `d`:

$$P_{cam}=dK^{-1}p$$

Then extrinsics transform into ego frame:

$$P_{ego}=T_{ego\leftarrow cam}P_{cam}$$

The unknown `d` is the central camera-to-BEV ambiguity.

Every camera BEV architecture must resolve that ambiguity by one of several mechanisms:

```text
explicit ground-plane assumption
predicted depth distribution
learned query-to-image association
implicit 3D latent / voxel representation
external depth sensor or supervision
```

That is the meaningful taxonomy.

## 4. Inverse perspective mapping is a geometric baseline, not a complete 3D solution

If a pixel is assumed to lie on the ground plane, calibration can intersect its ray with `z=0`.

This works well for:

- lane markings;
- road texture;
- planar drivable surface.

It fails for:

- vehicles;
- pedestrians;
- signs;
- overpasses;
- sloped/non-flat terrain.

An elevated object can be projected to the wrong ground location because the ray-ground intersection lies behind the true object.

IPM is useful because its errors are interpretable. It is an excellent geometry sanity baseline before learned lifting.

## 5. Lift-Splat-style models represent depth as a distribution

A common approach predicts, for each image feature location, a categorical depth distribution over bins:

$$P(d_k|f_{uv})$$

The image feature vector is “lifted” into a frustum volume:

$$F(u,v,k)=f_{uv}\cdot P(d_k|f_{uv})$$

Each frustum point is transformed into ego coordinates and accumulated (“splatted”) into BEV cells.

```mermaid
flowchart LR
    I["image features"] --> D["depth distribution"]
    I --> L["lift along camera rays"]
    D --> L
    L --> X["camera -> ego transform"]
    X --> S["scatter / pool into BEV"]
```

The important engineering costs are:

- depth-bin count;
- frustum activation volume;
- scatter/pooling implementation;
- calibration sensitivity;
- depth supervision/learning quality.

## 6. Depth bins define a quantization model

Uniform depth bins are simple but allocate equal resolution to distant and near space.

Alternative spacing can be more appropriate:

```text
uniform depth
inverse depth
log-spaced depth
learned/nonuniform bins
```

Near-field metric error matters more for planning, while distant depth is inherently less precise from vision.

The binning policy should match expected uncertainty and range, not merely a paper's default.

## 7. Frustum volume can dominate activation memory

Suppose camera features are `[Ncam, C, Hf, Wf]` and depth uses `D` bins.

A naive lifted tensor scales roughly as:

$$N_{cam}\times C\times D\times H_f\times W_f$$

Even when implementation avoids materializing the full tensor, the conceptual workload grows with depth hypotheses.

This is a major reason query-based methods are attractive: they can sample selected image locations/depth hypotheses rather than build all rays densely.

## 8. Query-based BEV reverses the question

Instead of lifting every image feature into 3D, create BEV queries at known metric locations and ask:

> Which image features are relevant to this BEV location?

For a BEV reference point `P_ego`, project it into camera `i`:

$$p_i \sim K_i T_{cam_i\leftarrow ego} P_{ego}$$

Then sample image features near valid projected locations.

```text
BEV query (metric location)
      ↓ calibration projection
candidate image locations
      ↓ deformable / cross attention
aggregated BEV feature
```

This keeps the BEV grid explicit while making evidence retrieval learned.

## 9. Query methods still rely on geometry

It is misleading to call them “geometry-free Transformers.” Camera intrinsics/extrinsics define where a BEV query should look.

Learned offsets can handle projection/model errors, but they should refine geometry rather than replace it blindly.

If calibration is wrong, attention may still produce plausible features while spatial accuracy degrades — which makes calibration perturbation testing especially important.

## 10. Visibility must be separated from feature value

A BEV location may project:

- into one camera;
- into several overlapping cameras;
- outside every camera;
- behind the camera;
- into a currently occluded region.

A zero feature is therefore ambiguous unless visibility is explicit.

Useful BEV metadata includes:

```text
camera visibility mask
number of contributing views
observation confidence
last observed time
```

This becomes even more important during temporal fusion, where old evidence can persist in currently unobserved cells.

## 11. Camera overlap is both useful and dangerous

Overlapping cameras provide redundant evidence, but their observations can disagree because of:

- timestamp skew;
- exposure differences;
- calibration error;
- rolling shutter;
- occlusion/parallax;
- different image quality.

A fusion function should not assume two projected features are equivalent simply because they land in the same BEV cell.

Cross-view consistency can be an explicit training/evaluation signal.

## 12. LiDAR-to-BEV has measured depth but still requires representation choices

LiDAR points already have metric coordinates after calibration/deskew.

They can be converted into BEV through:

```text
pillars -> 2D pseudo-image
3D sparse voxels -> vertical collapse
point features -> scatter/pooling
```

The ambiguity is no longer depth, but **how much vertical structure and point-level information to retain**.

Camera BEV and LiDAR BEV can therefore share the same metric grid even though their upstream uncertainty is very different.

## 13. Radar-to-BEV should not discard Doppler semantics

Radar detections can be scattered into the same grid, but a good radar BEV feature should retain:

```text
radial velocity
RCS/SNR
sensor identity
relative age
measurement quality
```

A generic occupancy channel throws away much of radar's distinctive value.

The common BEV coordinate system should standardize geometry, not erase modality-specific evidence.

## 14. Early versus late BEV fusion changes information loss

### Early/common-BEV feature fusion

```text
camera features -> camera BEV ┐
LiDAR features -> lidar BEV   ├-> fused BEV encoder
radar features -> radar BEV   ┘
```

Advantages:

- rich cross-modal interactions;
- one spatial state for temporal memory/heads.

Risks:

- calibration errors contaminate learned fusion;
- confidence semantics can be hidden.

### Late/object-level fusion

Each modality detects independently, then object hypotheses are fused.

Advantages:

- modular/debuggable;
- modality-specific models remain isolated.

Risks:

- information discarded by each detector cannot be recovered;
- association becomes a hard discrete boundary.

Neither is universally superior. The choice is about where information is compressed.

## 15. Height collapse must be task-aware

A pure 2D BEV often pools along height. That can confuse:

```text
overpass vs road below
overhanging sign vs obstacle
truck body vs free ground under chassis
multi-level parking
```

Options include:

- several vertical bins;
- 3D occupancy voxels;
- height statistics/channels;
- object-level vertical state.

“BEV” should not automatically mean all 3D structure is discarded.

## 16. Occupancy BEV requires observed/free/unknown semantics

An occupancy grid should distinguish:

```text
occupied
observed free
unknown / not visible
```

Camera-only occupancy may infer hidden structure probabilistically, but that inferred occupancy should not be confused with directly observed free space.

For LiDAR, ray tracing gives strong free-space evidence until the first return. For cameras, free-space inference is learned and depends on visibility/depth.

The planner needs those confidence differences.

## 17. Temporal BEV uses geometry to make memory cheap

Past BEV can be warped by ego motion into the current frame:

$$F_{t-1}^{aligned}=Warp(F_{t-1},T_{ego_t\leftarrow ego_{t-1}})$$

Then temporal fusion combines it with current evidence.

The advantages are substantial:

- static world aligns geometrically;
- camera view changes are already abstracted away;
- map features naturally share coordinates.

But dynamic objects still need residual motion modeling, and pose uncertainty limits warp accuracy.

## 18. BEV localization error has direct spatial meaning

If pose yaw has error `δθ`, a point at distance `r` can shift laterally approximately:

$$e \approx r\delta\theta$$

For `r=50 m` and `δθ=1°≈0.01745 rad`, the error is about 0.87 m.

This is why high-quality ego pose and calibration are inseparable from BEV accuracy. A model cannot reliably compensate arbitrary pose errors without sacrificing metric consistency.

## 19. Learned depth and localization uncertainty should not be collapsed into one confidence

A BEV cell can be uncertain because of:

- ambiguous monocular depth;
- poor camera calibration;
- uncertain ego pose;
- occlusion;
- weak image evidence;
- stale temporal memory.

Those sources propagate differently.

A mature architecture should at least preserve enough metadata to diagnose them separately, even if the neural model ultimately outputs a learned confidence.

## 20. Grid design should follow planner and sensor physics

Questions to answer before freezing BEV bounds:

```text
How far ahead must planning reason?
How much rear/side coverage is needed?
What is the smallest obstacle/lane feature that matters?
How accurate is localization at the far edge?
What sensor provides evidence there?
How much activation memory is sustainable?
```

A symmetric `[-50,50]×[-50,50]` grid is convenient for experiments, but production coverage is often intentionally asymmetric.

## 21. Multi-resolution BEV can spend detail where it matters

Near-field parking and far-field highway perception have different resolution needs.

Options include:

- high-resolution near grid + coarse far grid;
- polar/log-polar representations;
- hierarchical feature pyramids;
- sparse query allocation.

These reduce memory but complicate downstream planning interfaces. The planner may prefer one simple metric grid even if the perception backbone uses a hierarchical representation internally.

## 22. Scatter/gather operations are deployment-critical

Camera lift-splat and point/radar BEV construction often rely on:

```text
indexing
scatter-add
segment reduction
voxel pooling
sampling/interpolation
```

These may be far less optimized on an embedded NPU than convolutions.

A BEV architecture with fewer FLOPs can run slower if it spends most of its time in unsupported scatter/gather operations or CPU fallback.

Profile the actual lowered graph, not only backbone FLOPs.

## 23. A simple BEV memory calculation

```python
def bev_mb(x_range, y_range, cell, channels, bytes_per_value=2):
    nx = int((x_range[1]-x_range[0]) / cell)
    ny = int((y_range[1]-y_range[0]) / cell)
    mb = nx * ny * channels * bytes_per_value / 1024**2
    return nx, ny, mb

for cell in (1.0, 0.5, 0.25):
    print(cell, bev_mb((-20,80), (-50,50), cell, 256))
```

This should be one of the first calculations in BEV design, not an afterthought after model selection.

## 24. How to evaluate a camera-to-BEV transform

Before evaluating final detection mAP, test the representation itself:

- project known 3D landmarks into/from cameras;
- perturb intrinsics/extrinsics systematically;
- measure BEV alignment in overlap regions;
- inspect depth errors by distance;
- test ego-pose perturbation;
- test missing-camera behavior;
- test timestamp skew;
- inspect visibility/unknown regions;
- measure memory and scatter/sampling latency.

A final detector can partially hide BEV misalignment by learning biases. Geometry-specific tests expose the real problem earlier.

## 25. Selection framework

| Requirement | Likely starting family |
|---|---|
| interpretable flat-road baseline | IPM / geometric projection |
| explicit image depth reasoning | lift-splat / frustum pooling |
| memory-efficient selective image sampling | query/deformable BEV |
| strong measured 3D geometry | voxel/pillar LiDAR BEV |
| multi-modal system | modality-specific encoders -> common metric BEV |
| long temporal memory | ego-aligned BEV state + temporal fusion |

The correct BEV design is the one whose **coordinate assumptions, uncertainty, memory cost and operator set** fit the system. Benchmark accuracy matters only after those contracts are viable on the target platform.
