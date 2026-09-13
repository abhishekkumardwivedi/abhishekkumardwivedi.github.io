---
title: Ultrasonic Parking Models
description: An expert view of ultrasonic sensing for parking: time-of-flight geometry, beam patterns, multipath, cross-talk, occupancy evidence and low-speed fusion.
sidebar:
  order: 9
---

Ultrasonic parking sensors look simple because their consumer often receives a distance. The underlying measurement is less simple: a transducer emits an acoustic burst, receives one or more echoes, and a signal-processing chain converts **time of flight, amplitude and confidence** into range hypotheses.

For low-speed autonomy, the important challenge is not just distance accuracy. It is preserving the distinction between **measured obstacle evidence, free-space evidence, ambiguous echo and no valid observation**.

## 1. Range comes from acoustic time of flight

For round-trip echo time `Δt` and speed of sound `c`:

$$R \approx \frac{c\Delta t}{2}$$

`c` varies with temperature and air properties. A simplified temperature relation is:

$$c \approx 331 + 0.6T_{°C}\;m/s$$

A 40 °C temperature span therefore changes scale by several percent if uncompensated — significant at parking distances.

## 2. The sensor does not measure a laser-like point

An ultrasonic transducer has a **beam pattern**. One range can correspond to an echo from anywhere inside a lobe.

Conceptually:

```text
        possible reflector locations
            /-----------\
          /               \
 sensor *-------------------
          \               /
            \-----------/
```

Therefore one measurement defines a curved region of possible obstacle location, not an exact Cartesian point.

A geometry-aware occupancy update should respect the beam width and mounting pose.

## 3. Specular reflection creates false negatives

A flat wall at an oblique angle can reflect acoustic energy away from the transmitter/receiver.

So:

```text
no echo != free space
```

It can mean:

- no obstacle;
- obstacle outside effective beam;
- specular reflection away;
- absorptive material;
- object too close/far for valid range;
- interference/cross-talk;
- blocked/faulted sensor.

A planner should never convert invalid/no-return into certain free space without another source of evidence.

## 4. Multipath creates plausible but wrong ranges

An echo may travel:

```text
sensor -> ground/wall -> object -> sensor
```

The longer path creates a ghost range. Multipath often has structure and can persist over several frames.

Temporal consistency and multi-sensor geometry help reject it better than one-frame thresholding.

## 5. Ring-down creates a minimum-range problem

Immediately after transmission, the transducer can continue vibrating. During this ring-down interval, close echoes may be difficult to distinguish from the transmit signal.

That creates a **blind/uncertain near field** rather than perfect performance at zero distance.

Parking logic should model:

```text
below minimum valid range -> unknown / special close-obstacle handling
```

not simply clamp every invalid result to the minimum distance.

## 6. Cross-talk is a scheduling problem

With many transducers around the bumper, one sensor can receive another sensor’s pulse.

The controller often manages a firing schedule:

```text
sensor group A transmit
wait listening interval
sensor group B transmit
...
```

This means channel measurements may not be simultaneous.

At low vehicle speed the skew is usually manageable, but the system should still retain per-channel timestamps, especially when fusing with cameras or wheel odometry.

## 7. Vehicle motion converts sparse range samples into geometry

A single sensor has poor angular localization. As the vehicle moves, repeated measurements from different poses constrain obstacle position.

This is analogous to a low-resolution acoustic scan:

```text
pose t0 + range
pose t1 + range
pose t2 + range
      ↓
common ego/map frame
      ↓
local occupancy evidence
```

Correct ego-motion compensation is therefore highly valuable even for a simple sensor.

## 8. Occupancy should distinguish free, occupied and unknown

For one valid echo, the acoustic ray/beam gives approximate evidence:

```text
from sensor to near echo: likely free
near echo surface: occupied evidence
beyond echo: unknown/occluded
outside beam: unobserved
```

Because the beam is wide, this should be probabilistic rather than one hard ray.

A Bayesian/log-odds occupancy grid is a natural classical baseline:

$$L_t(c)=L_{t-1}(c)+\log\frac{P(c|z_t)}{1-P(c|z_t)}-L_0$$

where `c` is a cell and `z_t` the ultrasonic measurement.

## 9. A learned model is most useful after geometry is preserved

Instead of feeding only twelve scalar ranges to an MLP, create geometry-aware evidence first:

```text
range + beam model + sensor pose + ego motion
             ↓
local polar/cartesian evidence grid
             ↓
small CNN / temporal model
             ↓
occupancy / obstacle quality
```

This gives the network a representation closer to the physical problem.

A learned model can then focus on patterns such as multipath, intermittent thin objects and correlated multi-sensor evidence.

## 10. Thin poles and curbs expose sensor limitations

Small objects may produce intermittent echoes depending on beam overlap and angle. Curbs can be especially difficult because part of the beam hits the ground and part hits the curb face.

Evaluation should explicitly include:

- narrow poles;
- shopping carts;
- motorcycle wheels;
- curbs/parking stops;
- low walls;
- soft/absorptive objects;
- oblique vehicle surfaces.

Average distance error on a flat wall is not sufficient.

## 11. Height ambiguity is fundamental

A conventional bumper ultrasonic range often does not tell whether the echo came from:

```text
low curb
bumper-height wall
hanging obstacle
```

Mounting geometry and multiple sensors reduce ambiguity, but the sensor is not a full 3D imager.

This is one reason low-speed autonomy benefits from camera/short-range radar fusion.

## 12. Sensor health should remain explicit

Useful channel state includes:

```text
range(s)
echo amplitude / confidence
validity flags
temperature compensation state
blocked/dirty diagnosis
transmitter/receiver status
timestamp
sensor ID
```

Do not encode faulted sensors as an arbitrary range value. Preserve validity separately.

## 13. Temporal filtering must not hide obstacle appearance

Median/hysteresis filters can suppress noise but also delay a real obstacle that appears suddenly.

For a low-speed safety function, characterize:

```text
false-positive suppression
obstacle acquisition delay
obstacle disappearance delay
```

A filter that looks stable in a plot can be dangerous if it adds 300 ms before asserting a close obstacle.

## 14. A useful hybrid state

One compact runtime representation is:

```text
UltrasonicEvidence
    per-sensor current measurements
    short measurement history
    local occupancy log-odds grid
    observed/free/unknown masks
    sensor health
    reference ego pose/time
```

A learned head can consume this state to estimate:

- obstacle likelihood;
- local boundary geometry;
- parking-space edge confidence;
- measurement reliability.

The underlying measurement evidence remains inspectable.

## 15. Fusion with camera should happen at the right semantic level

Camera sees rich object/edge semantics but struggles with metric depth near the bumper. Ultrasonic measures short-range distance but weak semantics.

A useful fusion path is:

```text
camera local BEV / segmentation ─┐
ultrasonic occupancy evidence   ─┼-> local parking BEV
wheel/ego motion                ─┘
```

This is usually more meaningful than concatenating raw image features with twelve scalar ranges at an arbitrary network layer.

## 16. Vehicle body geometry matters

The relevant collision boundary is not the sensor location; it is the swept vehicle body.

Parking planning should account for:

- bumper overhang;
- wheelbase and steering geometry;
- mirrors/body envelope;
- sensor blind zones;
- rear/front swing during steering.

The sensor model therefore belongs in the same vehicle coordinate system used by trajectory collision checking.

## 17. A simple beam-aware occupancy experiment

```python
import numpy as np

# Candidate angles within an illustrative +/-25 degree beam.
angles = np.deg2rad(np.linspace(-25, 25, 51))
range_m = 1.2

x = range_m * np.cos(angles)
y = range_m * np.sin(angles)

# These are possible reflector locations, not 51 measured points.
for px, py in zip(x[::10], y[::10]):
    print(round(px, 2), round(py, 2))
```

The point of the experiment is conceptual: one scalar range spans a lateral uncertainty region that grows with distance.

## 18. What to evaluate

Measure more than range RMSE:

```text
probability of detection vs distance/angle
false positive rate
obstacle acquisition latency
thin-object detection
no-return interpretation
multipath persistence
cross-talk behavior
wet/dirty/blocked sensor behavior
temperature extremes
vehicle-motion compensation error
```

For parking, a few centimeters of range bias matters, but **false-clear behavior** matters more.

## 19. The key design rule

Keep these three states distinct all the way to planning:

```text
observed free
observed occupied
not reliably observed
```

Ultrasonic sensing becomes useful for autonomy when the architecture preserves that uncertainty instead of pretending every channel is a perfect one-dimensional distance sensor.
