---
title: "LiDAR Encoders"
description: "An expert view of LiDAR representation: motion compensation, pillars, sparse voxels, range view, point encoders, sparsity economics and BEV handoff."
sidebar:
  order: 6
---

LiDAR already measures geometry, but a neural stack still has to decide **how much of that geometry to preserve, how to discretize it, and where to spend compute on an extremely sparse 3D signal**.

The encoder problem begins before the network. A rotating LiDAR sweep is not one instantaneous point cloud; each return has acquisition time, sensor-frame coordinates, intensity/reflectivity metadata and often ring/channel information. The quality of the learned representation depends on how these measurements are aligned and discretized.

## 1. The input contract is per point, not per sweep

A useful point record is conceptually:

```text
[x, y, z]
intensity / reflectivity
ring or laser id
relative timestamp
echo/return type where available
quality flags
```

The sweep record also needs:

```text
sensor calibration
reference time
sensor pose / ego pose trajectory
sequence id
```

If all points are assigned the sweep-end pose, fast ego rotation can bend static structures in the point cloud.

## 2. Deskewing is the first geometric correction

For point `i` captured at `t_i`, transform from its capture pose into a common reference time `t_ref`:

$$p^{ref}_i = T^{-1}_{world\leftarrow ego}(t_{ref})\,T_{world\leftarrow ego}(t_i)\,T_{ego\leftarrow lidar}\,p^{lidar}_i$$

This compensates **ego motion**. It does not compensate independent object motion.

Dynamic cars can still appear stretched because different parts were observed at different times.

The encoder should therefore not be asked to learn arbitrary motion distortion that the system can correct geometrically.

## 3. Density is strongly non-uniform

Point density decreases with range because angular sampling is approximately fixed. A nearby vehicle can have thousands of returns; a distant pedestrian may have only a handful.

That affects representation design:

- fixed voxel size gives fewer occupied cells at distance;
- pillar pooling can erase sparse vertical structure;
- nearest-neighbor point models have changing local density;
- training losses may overweight dense near-field geometry.

Distance-stratified evaluation is therefore mandatory.

## 4. Pillars intentionally collapse vertical structure

PointPillars-style processing partitions the ground plane into cells `(x,y)` and groups all points in a vertical column.

For each point, features often include terms such as:

```text
absolute x,y,z,intensity
point - pillar mean
point - pillar center
```

A point MLP creates per-point embeddings; symmetric pooling creates one pillar feature; occupied pillars are scattered into a 2D pseudo-image.

```mermaid
flowchart LR
    P["points"] --> G["group by XY pillar"]
    G --> M["point MLP"]
    M --> A["max/mean aggregate"]
    A --> S["scatter to BEV pseudo-image"]
    S --> C["2D CNN"]
```

This is computationally attractive because the expensive backbone is 2D. The price is early loss of vertical distribution.

Pillars are a good fit when the downstream tasks are largely ground-plane oriented and deployment hardware favors dense 2D convolution.

## 5. Sparse voxels preserve 3D structure longer

Voxel methods partition `(x,y,z)` and retain only occupied cells.

A dense 3D grid is usually wasteful. Suppose a region is:

```text
x:  -50..50 m at 0.1 m -> 1000 cells
y:  -50..50 m at 0.1 m -> 1000 cells
z:   -3..5  m at 0.1 m ->   80 cells
```

That is 80 million voxels before channels. Only a tiny fraction are occupied.

Sparse convolution stores active coordinates and features instead of materializing the full volume.

The systems question becomes:

> Does the target runtime have an efficient sparse-convolution implementation, or will an elegant sparse model fall back to expensive dense/scatter operations?

## 6. Sparse convolution has its own occupancy growth behavior

A submanifold sparse convolution keeps output active only where input sites already exist. A regular sparse convolution can activate neighboring voxels and grow the active set.

This distinction affects both semantics and memory.

```text
submanifold conv:
active pattern roughly preserved

strided sparse conv:
active pattern changes/coarsens
```

Track **active voxel count per layer**, not only tensor channels, because runtime cost scales with sparsity pattern.

## 7. Voxel size is an information/computation tradeoff

Smaller voxels preserve detail but increase active-cell count and coordinate-management cost.

Approximate grid dimensions are:

$$N_x=\frac{x_{max}-x_{min}}{v_x},\quad N_y=\frac{y_{max}-y_{min}}{v_y},\quad N_z=\frac{z_{max}-z_{min}}{v_z}$$

Halving each voxel dimension increases the theoretical dense grid by 8×.

Even in sparse form, smaller voxels create more active sites and more metadata traffic.

Choose voxel size from the smallest structure that matters to the task, point density at useful range, and deployment cost — not from benchmark convention alone.

## 8. Range-view representation preserves the sensor acquisition topology

A spinning LiDAR naturally samples by azimuth/elevation. Projecting returns into `(ring, azimuth)` creates a range image.

Each pixel can store:

```text
range
intensity
x,y,z
valid mask
relative time
```

2D CNNs then become efficient.

Advantages:

- compact dense layout;
- preserves sensor scan neighborhood;
- efficient convolution.

Limitations:

- adjacency is angular, not Cartesian;
- foreground/background points can be adjacent in the image;
- occlusion boundaries behave differently from camera images;
- final metric BEV still requires geometric projection.

Range-view segmentation can be excellent, but it is not automatically the best representation for metric planning space.

## 9. Point-based encoders preserve precision but pay for neighborhood construction

PointNet-style models apply per-point MLPs plus symmetric aggregation. Hierarchical models add local neighborhoods.

The expensive operation is often not the MLP but finding/grouping neighborhoods:

```text
k-NN
ball query
voxel hash lookup
sampling
```

Irregular memory access can dominate accelerator performance.

Point methods are attractive when fine geometry matters and point count is bounded, but deployment profiling must include preprocessing/search.

## 10. Pillar feature construction should preserve masks and bounded occupancy

A production pillarizer needs deterministic limits:

```text
max points per pillar
max pillars per frame
overflow/drop policy
valid mask
```

Otherwise a dense scene can create unbounded memory.

A simple conceptual feature function:

```python
import torch

def point_features(points, pillar_center, pillar_mean):
    # points: [N,4] = x,y,z,intensity
    return torch.cat([
        points,
        points[:,:3] - pillar_mean,
        points[:,:2] - pillar_center,
    ], dim=-1)
```

The exact feature set is less important than preserving the coordinate meaning and masking padded points correctly.

## 11. Ground removal is not always a free optimization

Removing ground points can reduce compute, but the ground surface contains valuable information:

- road slope;
- curb geometry;
- potholes/obstacles;
- traversability;
- sensor pitch validation.

If the downstream task includes occupancy/free-space, discarding ground too early can be harmful.

A better approach may be to encode ground semantics separately rather than delete the evidence.

## 12. Intensity is sensor- and configuration-dependent

LiDAR intensity/reflectivity can help distinguish surfaces but is not a universal calibrated material property.

It depends on:

- sensor model;
- range;
- incidence angle;
- target reflectivity;
- receiver gain/internal processing;
- weather.

Normalize and validate intensity per sensor generation. A model trained on one LiDAR’s intensity scale can fail after a hardware change even when geometry is unchanged.

## 13. Multi-sweep accumulation increases density but mixes time

Accumulating several sweeps is common:

```text
sweep t-3
sweep t-2
sweep t-1
current sweep
      ↓ ego-motion warp
common reference frame
```

Static structures become denser. Dynamic objects create trails unless object motion is compensated.

Therefore a strong accumulated representation includes **relative time as a feature** so the model can reason about age.

Do not merge old points and current points without telling the network which is which.

## 14. BEV handoff should expose geometry explicitly

Whether the encoder uses pillars, voxels or range view, the downstream interface often becomes BEV.

A good LiDAR BEV feature contract defines:

```text
bounds: [xmin,xmax,ymin,ymax]
cell resolution
reference timestamp
feature stride
channels
height-collapse rule
visibility / observed mask
```

That allows camera/radar BEV features to be aligned to the same metric grid.

## 15. LiDAR occupancy is not the same as free space

A return proves that one surface point was observed. Absence of a return does not always prove free space.

Free-space reasoning uses the ray from sensor origin to the return:

```text
sensor ---------------- point
        traversed space = observed free
```

Beyond the return is unknown/occluded.

An occupancy model should preserve the distinction:

```text
free
occupied
unobserved/unknown
```

Collapsing unknown into free creates dangerous planning assumptions.

## 16. Weather affects both rate and semantics of returns

Rain, spray, fog and dust can create:

- near-field clutter;
- attenuation of distant returns;
- reduced intensity;
- spurious isolated points.

The model needs quality-aware training/evaluation, but upstream filtering must be characterized as well. Aggressive outlier removal can delete real small obstacles along with weather clutter.

## 17. Sparse runtime economics matter

When comparing encoders, measure the full chain:

```text
file/driver decode
coordinate transform / deskew
voxel/pillar construction
sparse index generation
encoder execution
BEV scatter/collapse
post-processing
```

A sparse backbone with 4 ms kernel time can lose to a pillar model if voxelization/hash building consumes another 8 ms on CPU.

The target platform’s supported sparse primitives can determine the best architecture more strongly than benchmark accuracy.

## 18. What to profile per frame

Record:

```text
raw point count
valid point count after filtering
point count by distance band
active pillar/voxel count
max occupancy per cell
preprocessing time
encoder time
peak activation memory
BEV output size
```

Then correlate these with difficult scenes such as crowds, vegetation, reflective structures and rain.

## 19. Fault and degradation handling

Define behavior for:

- missing sweep;
- partial packet loss;
- stale timestamp;
- invalid calibration;
- sensor reboot;
- point-count explosion;
- intensity/ring metadata missing;
- degraded weather quality.

Temporal memory should reset or mark uncertainty when the sensor generation changes.

## 20. Representation selection in one table

| Representation | Best property | Main loss/cost | Natural downstream |
|---|---|---|---|
| Pillars | efficient 2D BEV processing | vertical detail compressed early | BEV detection/fusion |
| Sparse voxels | preserves 3D structure | sparse-kernel/runtime complexity | 3D/BEV perception |
| Range view | preserves scan topology, dense CNN | metric neighborhood distorted | segmentation + reprojection |
| Raw points | maximal point precision | neighborhood/search cost | fine geometry / point tasks |

There is no universally superior LiDAR encoder. The correct representation is the one whose information loss matches the task and whose sparsity model matches the target hardware.
