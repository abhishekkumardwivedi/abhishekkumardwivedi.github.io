---
title: IMU & GNSS Models
description: An expert treatment of inertial/GNSS estimation: strapdown integration, error-state filtering, frames, observability, time alignment, RTK quality and learned residual models.
sidebar:
  order: 8
---

IMU and GNSS are not just two sensors to concatenate into a neural network. They form a **state-estimation problem with known rigid-body dynamics, strongly structured errors, multiple coordinate frames, asynchronous measurements and observability limits**.

For vehicle localization, classical estimation remains the backbone because the physics is known and uncertainty matters. Learned components are most useful when they estimate residuals, biases, quality or difficult measurement models — not when they replace basic kinematics without reason.

## 1. The IMU measures specific force and angular rate

An accelerometer does not directly measure world-frame acceleration. It measures specific force in the sensor frame:

$$f_b = R_{b\leftarrow w}(a_w-g_w)+b_a+n_a$$

The gyroscope measures angular velocity with bias/noise:

$$\omega_m = \omega + b_g + n_g$$

Therefore recovering vehicle motion requires:

```text
sensor calibration
bias estimation
orientation integration
gravity handling
frame transforms
time integration
```

Small orientation errors are dangerous because gravity is large. A 1° tilt error leaks roughly:

$$g\sin(1°) \approx 0.17\;m/s^2$$

into horizontal acceleration — enough to create significant velocity/position drift.

## 2. Strapdown propagation is the core motion model

A simplified discrete propagation is:

$$R_{k+1}=R_k\exp((\omega_m-b_g)\Delta t)$$

$$v_{k+1}=v_k+[R_k(f_m-b_a)+g]\Delta t$$

$$p_{k+1}=p_k+v_k\Delta t+\frac{1}{2}[R_k(f_m-b_a)+g]\Delta t^2$$

The exact implementation should use numerically appropriate Lie-group/quaternion operations, but the conceptual point is that **IMU integration propagates state continuously between lower-rate absolute observations**.

## 3. Bias is a state, not a constant calibration number

Factory calibration removes deterministic sensor errors, but IMU bias drifts with temperature, time and operating condition.

A practical estimator often includes:

```text
position
velocity
orientation
accelerometer bias
gyro bias
```

and sometimes scale-factor/misalignment or wheel/clock states.

Bias models may use random walk:

$$b_{k+1}=b_k+w_b$$

This lets the filter gradually adapt rather than assuming calibration is perfect forever.

## 4. Error-state filtering is usually preferable to filtering full orientation directly

A common architecture maintains a nominal nonlinear state and a small error state:

```text
nominal: p, v, R, biases
error:   δp, δv, δθ, δba, δbg
```

The filter propagates covariance of the small error, then injects corrections into the nominal state.

This keeps orientation error locally linear and avoids pretending quaternion components are ordinary Euclidean states.

## 5. GNSS is not “latitude/longitude every second”

A useful GNSS interface can expose:

```text
position
velocity
receiver time
fix type
covariance/accuracy
satellite geometry / DOP
RTK float/fixed status
correction age
number of satellites
carrier/pseudorange residual quality
```

The position estimate and its quality state are inseparable.

A filter should trust a centimeter-level RTK fix differently from a multipath-degraded standalone fix.

## 6. RTK improves ambiguity resolution, not physics immunity

RTK uses carrier-phase information and correction data to resolve integer ambiguities and improve relative positioning.

But RTK still degrades under:

- urban canyon multipath;
- poor satellite geometry;
- antenna obstruction;
- correction link interruption;
- cycle slips;
- long correction age.

The estimator must react to **quality-state transitions** such as fixed -> float -> standalone rather than treating all positions identically.

## 7. Time synchronization is often more important than another filter feature

Suppose a GNSS velocity is timestamped 50 ms late while the vehicle accelerates or turns. The estimator fuses a measurement against the wrong predicted state.

At angular rate `ω`, even a pure timestamp error creates a pose mismatch:

$$\Delta \theta = \omega\Delta t$$

Every measurement should be fused at its measurement time, not arrival time.

The implementation therefore needs:

```text
sensor timestamp
clock-domain conversion
driver/transport latency distinction
ordered measurement queue
out-of-sequence handling policy
```

## 8. Lever arms matter

GNSS antenna, IMU and vehicle reference point are physically separated.

If the antenna is offset by vector `r`, rotational motion produces antenna velocity:

$$v_{ant}=v_{ref}+\omega\times r$$

During a turn, ignoring the lever arm can create systematic velocity/position residuals.

The same issue matters for radar ego-motion compensation and camera pose.

## 9. Frames must be named explicitly

Typical frames include:

```text
IMU sensor frame
vehicle/body frame
local ENU/NED navigation frame
ECEF
map frame
```

Never write a generic variable `velocity_xyz` without naming its frame and convention.

Coordinate mistakes often survive unit tests because magnitudes look plausible.

Useful conventions to freeze:

```text
handedness
axis direction
angle convention
quaternion order
world vertical sign
latitude/longitude order
units
```

## 10. GNSS updates observable accumulated IMU drift

IMU propagation gives excellent short-term relative motion but drifts. GNSS provides global corrections.

The filter update is conceptually:

$$y = z-h(\hat x)$$

$$K=PH^T(HPH^T+R)^{-1}$$

$$\delta x=Ky$$

where `R` is measurement covariance.

If `R` is unrealistically small, one bad GNSS fix can violently pull the state. If too large, drift remains uncorrected.

Quality metadata should therefore feed measurement covariance or gating logic.

## 11. Innovation gating rejects inconsistent measurements

The residual should be statistically consistent with expected uncertainty.

Mahalanobis distance:

$$d^2 = y^T S^{-1}y$$

can gate outliers when `d²` exceeds a threshold.

But repeated rejection is itself a diagnostic. It may mean:

- bad GNSS;
- calibration error;
- time offset;
- wrong lever arm;
- filter covariance too optimistic.

Do not hide systematic inconsistency behind aggressive outlier rejection.

## 12. Wheel speed and steering often improve observability

Vehicle localization rarely uses only IMU+GNSS. Wheel speeds, steering angle and vehicle dynamics add strong constraints.

For a non-slipping ground vehicle, lateral/vertical body velocity is approximately constrained. These non-holonomic constraints can reduce drift.

However, the assumptions break during:

- wheel slip;
- jumps/rough terrain;
- skidding;
- tire-radius changes.

The estimator should gate or soften constraints according to operating condition.

## 13. Factor graphs and filters solve the same state problem differently

An EKF processes measurements incrementally with compact state/covariance.

A factor graph optimizes states over a window:

```text
x0 --IMU-- x1 --IMU-- x2 --IMU-- x3
 |          |                 |
GNSS      wheel             GNSS
```

Advantages of smoothing/factor graphs:

- relinearization;
- delayed measurements;
- richer calibration states;
- easier multi-sensor batch constraints.

Costs:

- more compute/memory;
- window management;
- optimization latency.

High-rate control may still consume a propagated real-time state while a slower optimizer refines it.

## 14. Learned models should target a known residual

Useful learned components include:

```text
IMU bias correction
wheel-slip probability
GNSS measurement covariance
multipath/outlier score
motion prior
residual odometry correction
```

For example, a network can predict a correction `δv` rather than absolute global position:

$$v_{corrected}=v_{physics}+\delta v_{NN}$$

This keeps hard-known kinematics explicit and limits what the model must learn.

## 15. A learned covariance must be calibrated

A network that predicts uncertainty can improve filtering only if the uncertainty is statistically meaningful.

If it outputs covariance `R_nn`, evaluate consistency:

```text
normalized innovation squared
coverage probability
reliability across ODD slices
```

A model that outputs larger uncertainty whenever it is wrong is useful. One that is overconfident under rare conditions is dangerous even if mean pose error is good.

## 16. GNSS outage behavior should be designed, not discovered

During tunnel/urban blockage:

```text
GNSS updates stop
IMU propagation continues
wheel/vehicle constraints may continue
covariance grows
```

The output contract should expose this growing uncertainty.

When GNSS returns, the estimator must decide whether to accept it immediately, gate it, or reinitialize parts of the state.

A large jump after outage can be physically correct but operationally unsafe if downstream consumers assume continuity.

## 17. State reset and warm start are architecture concerns

Define behavior for:

- cold boot with no GNSS fix;
- warm restart with retained calibration;
- IMU reset while GNSS remains alive;
- GNSS receiver restart;
- clock discontinuity;
- estimator software restart.

A stale covariance or bias state after reset can be worse than starting from high uncertainty.

Attach a generation ID to estimator state so consumers can detect discontinuity.

## 18. A useful propagation experiment

```python
import numpy as np

g = np.array([0., 0., -9.81])
dt = 0.01
v = np.zeros(3)
p = np.zeros(3)

# 0.02 m/s^2 horizontal accelerometer bias for 60 s.
bias = np.array([0.02, 0., 0.])

for _ in range(int(60/dt)):
    a_est = bias                  # true horizontal acceleration is zero
    p += v*dt + 0.5*a_est*dt*dt
    v += a_est*dt

print("velocity error:", v)
print("position error:", p)
```

A tiny constant bias creates tens of meters of position drift. This is why bias observability and absolute corrections are central, not optional refinements.

## 19. Localization output should be a timed state, not one pose

A useful contract is:

```text
LocalizationState
    timestamp
    position + frame
    orientation
    velocity
    angular velocity
    covariance
    bias estimates
    quality/fix mode
    state generation
```

Downstream BEV and planning should query/interpolate this state at the sensor reference time they actually need.

## 20. What to evaluate

Evaluate by failure mode, not only average trajectory error:

```text
straight/highway
high yaw rate
stop-and-go
GNSS outage
urban canyon
RTK fixed/float transitions
wheel slip
time offset injection
IMU bias/temperature changes
sensor restart
```

Metrics should include:

- position/orientation/velocity error;
- uncertainty consistency;
- drift rate during outage;
- recovery time;
- discontinuity magnitude;
- estimator latency/data age.

The strongest localization architecture is not the one with the fanciest learned model. It is the one whose **state, frame, timestamp and uncertainty remain trustworthy when the easy absolute measurements disappear.**
