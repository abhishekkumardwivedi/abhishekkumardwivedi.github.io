---
title: "nuScenes Pipeline Stage 2: Sensor Time, Geometry and Measurement Provenance"
description: "A technical foundation for multi-sensor autonomy: asynchronous camera/LiDAR/radar measurements, timestamp semantics, calibration, ego-motion alignment and geometric BEV before learned inference."
---

Before adding a neural network, a multi-sensor autonomy stack needs a trustworthy answer to four questions:

```text
Which sensor produced this measurement?
When was it physically captured?
In which coordinate frame does it live?
How do we transform it to the reference state used for fusion?
```

Stage 2 exists to make those contracts explicit. It contains **no learned perception**. The cameras are recorded RGB observations; the LiDAR and radar views are geometric projections of measured points. That makes this stage useful precisely because model behavior cannot hide timing or transform mistakes.

![Six nuScenes camera views with LiDAR/radar projected into an ego-centric sensor BEV.](/images/nuscenes-stage2-playback.jpg)

*Figure 1 — One nuScenes sample. The six camera records are shown with their capture-time offsets. The cyan LiDAR and orange radar marks are sensor measurements transformed into a common ego frame; they are not semantic classes or learned BEV features.*

## 1. A “sample” is an association point, not a simultaneous sensor exposure

nuScenes provides an annotated sample timeline at roughly 2 Hz, but the physical sensors run at their own acquisition rates. The dataset sensor suite includes six cameras, one spinning LiDAR and five radars. The camera and LiDAR data are deliberately synchronized for good cross-modal alignment, yet their record timestamps are not identical.

For a selected sample, software follows the metadata relation:

```text
sample
  -> sample['data'][CAM_FRONT]
  -> sample['data'][LIDAR_TOP]
  -> sample['data'][RADAR_FRONT]
  -> ...
```

Each token identifies a `sample_data` record with its own:

```text
sensor channel
filename
capture timestamp
calibrated_sensor token
ego_pose token
prev / next links
```

That is the right association mechanism. Enumerating files by directory name or lexicographic filename order discards the relational structure that defines which measurements belong together.

A minimal traversal is:

```python
token = scene["first_sample_token"]
while token:
    sample = nusc.get("sample", token)
    records = {
        channel: nusc.get("sample_data", sd_token)
        for channel, sd_token in sample["data"].items()
    }
    token = sample["next"]
```

The important engineering point is **measurement identity comes from metadata, not file coincidence**.

## 2. `dt` is a measurement-age quantity

For sensor record time `t_s` and chosen reference time `t_ref`:

$$\Delta t_s=t_s-t_{ref}$$

The viewer exposes values such as:

```text
CAM_FRONT_LEFT   dt -42.8 ms
CAM_FRONT        dt -35.2 ms
CAM_FRONT_RIGHT  dt -27.1 ms
CAM_BACK_LEFT    dt  -0.2 ms
CAM_BACK         dt -10.0 ms
CAM_BACK_RIGHT   dt -19.5 ms
```

A negative `dt` means the image was captured before the reference time.

There is no universal “acceptable dt.” The impact depends on relative motion and the downstream spatial accuracy requirement.

For translational relative speed `v`:

$$\Delta x=v|\Delta t|$$

At 20 m/s:

```text
5 ms  -> 0.10 m
20 ms -> 0.40 m
40 ms -> 0.80 m
```

For angular rate `ω`, orientation changes by:

$$\Delta\theta=\omega\Delta t$$

The same 20 ms skew can therefore be insignificant in a slow straight scene and material during close-range turning/cross traffic.

The correct contract is not “dt must be below N milliseconds.” It is:

> **Every measurement retains capture time, and the fusion layer has a defined strategy for transporting evidence to its reference time.**

## 3. nuScenes synchronization is physically meaningful

The dataset's camera/LiDAR synchronization is worth understanding because it demonstrates the difference between hardware synchronization and software association.

nuScenes documents that camera exposure is triggered when the top LiDAR sweeps across the center of that camera's field of view. Camera timestamps correspond to the exposure trigger. The LiDAR point-cloud timestamp corresponds to completion of the full rotation. The cameras run at 12 Hz and the LiDAR at 20 Hz, so the camera exposures are distributed across LiDAR rotations rather than simply sharing one global frame pulse.

This is a useful design pattern: **align the actual physical measurements that should correspond**, not only the software delivery events.

For a production rig, mechanisms may include:

```text
camera FSYNC / trigger
GNSS PPS
IEEE-1588 PTP
sensor-local synchronized clocks
hardware timestamping
```

FSYNC is therefore one mechanism, mainly useful for deterministic camera exposure alignment. The broader requirement is a common time base plus known timestamp semantics for every modality.

## 4. Timestamp semantics matter as much as clock precision

Two sensors can share an accurate clock yet still be misaligned if their timestamp meanings differ.

Examples:

```text
camera: exposure start or midpoint?
rolling-shutter camera: which row time?
LiDAR: scan start, packet time or scan completion?
radar: chirp/frame start or post-processing output time?
IMU: sampling instant or driver-delivery time?
```

A software callback timestamp is usually a poor substitute because it includes variable transport and processing delay.

A strong sensor contract names both:

```text
clock domain
measurement timestamp semantics
```

## 5. A spinning LiDAR sweep is not one instant

The LiDAR rotates while the vehicle moves. A point near the beginning of the revolution and a point near the end were captured at different ego poses.

nuScenes notes that the LiDAR sweep timestamp is associated with the final package and that motion compensation is performed per received packet/package. This is important: the stored point cloud is already more coherent than a naive rigid sweep captured at one pose.

The general deskew equation for point `p_i` captured at time `t_i` and expressed at reference time `t_r` is:

$$p_i^{ref}=T^{-1}_{world\leftarrow ego}(t_r)\,T_{world\leftarrow ego}(t_i)\,T_{ego\leftarrow sensor}\,p_i^{sensor}$$

This corrects **ego motion**.

It cannot correct independent object motion. A moving vehicle can still be geometrically inconsistent across a scan or across camera/radar/LiDAR captures.

That distinction becomes central later in temporal fusion and tracking.

## 6. Extrinsics and ego pose solve different transforms

For each point sensor, Stage 2 uses:

1. calibrated sensor extrinsics relative to ego;
2. ego pose at that sensor capture;
3. ego pose defining the current fusion/reference frame.

The transform is:

$$T^{ref\_ego}_{sensor}=\left(T^{global}_{ref\_ego}\right)^{-1}T^{global}_{capture\_ego}T^{capture\_ego}_{sensor}$$

In code:

```python
def sensor_to_reference(calib, capture_pose, reference_pose):
    return (
        np.linalg.inv(pose_matrix(reference_pose))
        @ pose_matrix(capture_pose)
        @ pose_matrix(calib)
    )
```

This chain should be unit-tested separately from visualization. Coordinate bugs often produce pictures that look plausible while being metrically wrong.

## 7. Define the ego frame once

The implementation uses the reference ego convention:

```text
+x forward
+y left
+z up
meters
```

The top-down display simply maps `(x,y)` to screen coordinates.

That geometric BEV should not be confused with a learned BEV tensor.

```text
Stage 2 sensor BEV:
raw/filtered point coordinates
 -> rigid transform
 -> top-down drawing

Later learned BEV:
sensor features
 -> view/geometry transform
 -> learned feature grid
 -> fusion/temporal network
```

Calling both “BEV” without qualifying them causes conceptual confusion.

## 8. The LiDAR point count is measurement density, not object count

A frame showing `34,752 LiDAR points` means 34,752 returns were loaded for that sweep. Each return is a surface sample, not a detection.

Point density depends on:

- range;
- LiDAR scan pattern;
- reflectivity/incidence angle;
- occlusion;
- sensor filtering;
- scene geometry.

The cyan color in the viewer has no semantic meaning. A road return and a vehicle return are both cyan until a later model assigns structure or class.

This is an important mental reset before learning LiDAR encoders: the sensor gives **geometry evidence**, not boxes.

## 9. Radar points carry more semantics than XYZ

The Stage 2 radar display uses orange markers for geometric inspection, but real radar measurements contain information such as radial velocity, RCS/amplitude and quality/state fields depending on the interface.

When transformed into a common ego frame, radar should retain its original measurement attributes and source sensor identity.

A better logical record is:

```text
RadarMeasurement
    position / range-angle
    radial_velocity
    RCS / quality
    sensor_id
    capture_time
    calibration
```

Concatenating all five radars into one point list is fine for visualization, but later learned fusion should not throw away which radar and time produced each observation.

## 10. Ego-motion compensation is not object-motion compensation

Consider a moving car observed by camera at `t_c` and radar at `t_r`.

Transforming both measurements using ego pose removes the recording vehicle's motion. The other car still moves:

$$p_{obj}(t_c)\neq p_{obj}(t_r)$$

Residual cross-modal displacement is therefore expected.

That error belongs to later layers:

```text
tracking
scene flow
object motion model
temporal BEV
learned deformable alignment
```

Trying to force every raw modality to align perfectly before estimating dynamic-object motion is physically impossible.

## 11. Physical synchronization and software alignment are complementary

A useful vehicle architecture combines:

```text
physical layer:
  common clock / trigger / timestamp hardware

software layer:
  timestamp provenance
  clock conversion
  queue ordering
  ego-motion transform
  interpolation/extrapolation policy
```

Hardware synchronization reduces the amount of compensation required. Software alignment handles residual skew and asynchronous modalities.

The best design uses both rather than expecting one to replace the other.

## 12. Sensor provenance should survive every stage

Once a camera image becomes a learned feature tensor, it is tempting to drop the sensor metadata. That would make later fusion ambiguous.

Stage 2 establishes the lineage that Stage 3+ should preserve:

```text
measurement token / sequence
sensor identity
capture timestamp
reference-time offset
intrinsics/extrinsics
ego pose / transform generation
calibration version
quality flags
```

A learned tensor is simply a new representation of the same physical observation. It should inherit the observation's time and geometry.

## 13. Measurement rate and visualization rate are separate clocks

A displayed stream can refresh at 25 or 60 FPS while the underlying keyframes advance at roughly 2 Hz.

Repeating the current visualization frame does not create new sensor information.

Distinguish:

```text
sensor acquisition rate
annotated sample/keyframe rate
model inference rate
UI/transport refresh rate
```

This matters later when models run faster than dataset keyframes or temporal state updates at different rates.

A system should trigger expensive inference on **new measurements**, not on display refresh events.

## 14. A useful verification is transform closure, not a pretty picture

Before adding AI, test geometry numerically.

Examples:

### Round-trip transform

Transform a point sensor -> ego -> sensor and verify small numerical error.

### Known-axis sanity

A point 10 m ahead in ego coordinates should appear forward on the BEV.

### Camera reprojection

Project LiDAR points into camera images using calibrated intrinsics/extrinsics and inspect alignment near static structures.

### Ego-motion consistency

Transform the same static landmark observed at nearby times into a common reference frame and measure residual error.

### Sensor perturbation

Intentionally add a 1° yaw or 10 cm translation error and verify that the visualization moves in the physically expected direction.

These tests catch handedness, quaternion ordering, inverse-transform and timestamp mistakes long before a neural loss does.

## 15. The code path should keep geometry independent from rendering

A useful separation is:

```text
sensor loader
  -> measurement records
geometry module
  -> common reference-frame measurements
renderer / inspection
  -> human-readable visualization
later model pipeline
  -> consumes the same geometry output
```

That makes the visualization an **observer of the contract**, not the source of truth.

A simplified loader pattern:

```python
record = nusc.get("sample_data", sample["data"][channel])
calib = nusc.get("calibrated_sensor", record["calibrated_sensor_token"])
pose = nusc.get("ego_pose", record["ego_pose_token"])

dt_ms = (record["timestamp"] - sample["timestamp"]) / 1000.0
```

The model stages should consume the same `record/calib/pose/timestamp` lineage.

## 16. What Stage 2 proves before AI begins

By the end of this stage, the system should be able to prove:

```text
all modalities belong to the intended scene/sample relationship
sensor capture timestamps are visible
sensor-frame geometry is known
point sensors can be transformed into one reference frame
ego motion is handled consistently
visualization does not invent semantic meaning
measurement rate is separated from display rate
sensor metadata can be carried into learned stages
```

That is the foundation of multi-sensor autonomy.

A detector can still be wrong after this. But without these guarantees, even a correct detector can be spatially and temporally fused into a wrong world.

## 17. The handoff to Stage 3

Stage 3 changes only one part of this chain:

```text
camera RGB
   ↓
learned camera encoder
   ↓
image-space feature tensor
```

The Stage 2 contract must remain attached:

```text
camera_id
t_capture
dt_to_reference
intrinsics / effective image transform
extrinsics
calibration generation
```

The key conceptual transition is therefore:

> **Stage 2 establishes measurement truth; Stage 3 changes the representation while preserving that truth.**

That principle should continue through BEV, temporal fusion, tracking and world-state construction.

## References

- [nuScenes data collection, sensor synchronization and calibration](https://www.nuscenes.org/nuscenes)
- [nuScenes data-format/tutorial documentation](https://www.nuscenes.org/public/tutorials/nuscenes_tutorial.html)
- [nuScenes paper: A multimodal dataset for autonomous driving](https://arxiv.org/abs/1903.11027)
- [nuScenes devkit](https://github.com/nutonomy/nuscenes-devkit)
