---
title: "World Models"
description: "An expert systems view of world models for autonomy: belief state, observability, dynamics, multimodal futures, occupancy/agent representations, action conditioning and planning interfaces."
sidebar:
  order: 12
---

“World model” is useful only if we define **what state is being modeled, how observations update it, how it evolves without observation, what uncertainty it carries, and what a planner is allowed to ask of it**.

For autonomous driving, the strongest practical interpretation is not “a network that can generate future video.” It is a **belief about the local world plus a dynamics model for how that belief can evolve**.

That belief can contain explicit objects, occupancy, map topology, dense BEV features or learned latent tokens. A mature system often uses several at once because no single representation is ideal for geometry, semantics, interactions and uncertainty.

## 1. A world model is a partially observed state-estimation problem

The true physical state `s_t` is not directly visible. Sensors provide an observation `o_t` generated from only part of the world.

A useful probabilistic framing is:

$$b_t(s)=P(s_t|o_{1:t},a_{1:t-1})$$

where `b_t` is the belief state.

The world model therefore needs two conceptual operations:

### Observation update

$$b_t = Update(b_{t|t-1}, o_t)$$

Use new camera/LiDAR/radar/map evidence to correct the predicted belief.

### Dynamics prediction

$$b_{t+1|t}=Predict(b_t,a_t)$$

Propagate the world forward, optionally conditioned on ego action.

This predict/correct split exists whether the implementation is a Kalman filter, object tracker, recurrent BEV or giant Transformer.

## 2. What belongs in the state?

A planner needs different information from a video decoder.

A useful autonomy world state may contain:

```text
static geometry / map context
free / occupied / unknown space
tracked dynamic agents
agent velocity / intent distribution
evidence visibility and age
ego state
traffic control state
uncertainty / confidence
```

The state should preserve **decision-relevant information**, not every visual detail.

If the planner never uses building texture, forcing the world model to reconstruct it may waste capacity. If a subtle turn-signal state changes behavior prediction, discarding appearance too early can be harmful.

## 3. Explicit and latent state are complementary

### Explicit state

```text
objects
occupancy grids
lane graph
traffic signals
```

Advantages:

- interpretable;
- easy to validate geometrically;
- clear planning interface.

Limitations:

- information is lost at every hand-engineered abstraction;
- difficult to represent ambiguous/unclassified evidence.

### Latent state

```text
BEV feature map
scene tokens
latent vector/set
```

Advantages:

- preserves richer evidence;
- can support multiple downstream heads;
- flexible for learned dynamics.

Limitations:

- semantics are difficult to inspect;
- failure can remain hidden until task output.

A strong architecture often exposes explicit planning state **and** retains latent context internally.

## 4. Occupancy is a natural world-model primitive

Object boxes assume the world can be decomposed into known entities. Occupancy asks a more basic question:

> Which parts of space are occupied, free, or unknown?

This captures:

- odd-shaped obstacles;
- construction debris;
- vegetation;
- unknown/unclassified objects;
- free-space boundaries.

A 3D occupancy state can additionally represent overhangs and multi-level structures.

The state must preserve the distinction:

```text
free
occupied
unobserved / occluded
```

Unknown is not free.

## 5. Object state is better for interaction reasoning

Planning around other road users benefits from persistent entities:

```text
id
class/existence probability
position/size/heading
velocity/acceleration
state covariance
history
behavior/intent hypotheses
```

An occupancy grid tells us a vehicle is there; an object track tells us **which vehicle and how its motion evolves**.

Therefore many world models combine dense occupancy with object-centric agent state.

## 6. The map is a prior, not a measurement

HD-map or online-map state contributes lane topology, traffic-control geometry and road structure.

But the map can be stale. The world model should distinguish:

```text
map prior says lane exists
perception currently observes lane
perception contradicts map
region not observable
```

If map state is fused too aggressively into perception, the model can hallucinate expected geometry when the road has changed.

The architecture should allow live evidence to override or reduce confidence in stale priors.

## 7. A world state needs one reference time

Imagine tracked objects from `t=10.00`, camera features from `10.03`, radar from `10.04`, and ego pose at `10.05`.

Before presenting this as one coherent state, evidence must be propagated/aligned to a common reference time `T`.

For agent state with constant-velocity approximation:

$$p(T)=p(t)+v(t)(T-t)$$

For static BEV evidence, ego-motion warp aligns coordinate frames.

The chosen state timestamp should travel with the state all the way into prediction/planning.

## 8. “Current world state” is already a prediction

Because sensor processing has latency, a state produced now usually describes observations from the past.

A practical stack can forward-propagate the belief to the intended planning time:

```text
latest measurement reference time
        ↓
perception processing latency
        ↓
predict state forward to planning/control horizon
```

This is why latency compensation and world dynamics are linked.

A planner that consumes a geometrically accurate but 100 ms stale world can make worse decisions than one consuming a slightly noisier but properly predicted current state.

## 9. Dynamics should separate deterministic ego transform from uncertain agent behavior

Known ego motion should be handled geometrically.

Unknown external-agent motion is probabilistic.

Do not force one network to learn both if one can be computed exactly.

A clean decomposition is:

```text
past state
  -> deterministic coordinate warp using ego pose/action
  -> learned/external dynamics for moving agents and latent scene changes
  -> predicted state
```

This improves sample efficiency and interpretability.

## 10. Agent futures are multimodal

At an intersection, another vehicle may:

```text
continue straight
turn left
turn right
slow/stop
```

One regression trajectory tends to average incompatible futures.

A useful predictor outputs modes:

$$\{(\tau_k,p_k)\}_{k=1}^{K}$$

with:

$$\sum_k p_k=1$$

But probability values must be calibrated. Producing ten trajectories does not guarantee the true future is covered.

Evaluation should measure both **best-mode error and probability calibration/mode coverage**.

## 11. Occupancy futures avoid brittle object identities

Instead of predicting one trajectory per object, future occupancy predicts spatial probability over time:

$$P(O_{t+h}(x,y)=1)$$

Advantages:

- handles unclassified obstacles;
- avoids explicit association identity;
- naturally interfaces with collision checking.

Limitations:

- can blur multi-agent structure;
- harder to reason about intentions/rules;
- high spatial-temporal memory cost.

A planner can benefit from both object trajectories and occupancy futures.

## 12. Action conditioning changes a predictor into a controllable world model

A pure prediction model asks:

```text
What is likely to happen next?
```

An action-conditioned world model asks:

```text
What is likely to happen if ego follows candidate action a?
```

Formally:

$$P(s_{t+1:t+H}|s_t,a_{t:t+H-1})$$

This matters because other agents respond to ego behavior. A merge trajectory can change whether a nearby vehicle yields or accelerates.

Without action conditioning, planner rollouts assume the world evolves independently of ego choice.

## 13. Closed-loop rollout compounds model error

For a one-step model:

$$\hat s_{t+1}=f(\hat s_t,a_t)$$

multi-step rollout recursively consumes its own predictions:

$$\hat s_{t+k}=f(\hat s_{t+k-1},a_{t+k-1})$$

Small errors compound, and the rollout can move into states absent from training data.

Therefore evaluate error as a function of horizon, not only one-step loss.

Planning may need only a few seconds of reliable dynamics rather than a visually plausible 30-second simulation.

## 14. Reconstruction loss can teach the wrong state

A world model trained to reconstruct pixels can spend capacity on:

```text
texture
lighting
building appearance
shadows
```

while underrepresenting small planning-critical objects.

Training objective should match state purpose.

Useful losses can include:

- occupancy/semantic reconstruction;
- object/state prediction;
- motion/flow;
- map/topology;
- contrastive representation consistency;
- action-conditioned future state;
- calibrated uncertainty;
- planning/reward/value objectives.

A pretty predicted video is not evidence of a planner-useful state.

## 15. Latent consistency matters more than exact visual reconstruction for some tasks

If latent state `z_t` is used by planning, we care that dynamics preserve **task-relevant equivalence**:

```text
same collision risk
same lane topology
same agent interaction
```

not necessarily the same pixels.

This motivates feature-space predictive objectives and task heads on imagined states.

However, latent-only evaluation can hide catastrophic omissions, so explicit interpretable probes remain important.

## 16. Uncertainty has multiple sources

World-model uncertainty can come from:

### Aleatoric uncertainty

The future is inherently ambiguous: another driver may turn or continue.

### Epistemic/model uncertainty

The model lacks knowledge: unusual scene, OOD object, poor training coverage.

### Measurement uncertainty

Current state is uncertain due to sensor noise, occlusion or localization error.

These should not be collapsed into one arbitrary confidence score because the planner may react differently.

For example, more observations can reduce measurement uncertainty but not another driver's genuine choice uncertainty.

## 17. State uncertainty should propagate through dynamics

If current object position covariance is `P_t`, future uncertainty should generally grow under uncertain dynamics.

A world model that outputs sharp futures from uncertain input is overconfident.

Even learned models can expose:

```text
trajectory covariance
discrete mode probabilities
occupancy probability
ensemble disagreement
latent uncertainty parameters
```

Then calibration can be evaluated empirically.

## 18. Interaction modeling is the difficult part of traffic dynamics

Independent per-agent prediction misses coupled behavior.

Agents interact through:

- right-of-way;
- gap acceptance;
- collision avoidance;
- social conventions;
- traffic signals;
- ego intent.

Useful representations include:

```text
agent graph attention
scene Transformer
vector-map + agent tokens
BEV interaction fields
```

The model should preserve agent identity/history long enough for interaction reasoning, even if final risk is evaluated in occupancy space.

## 19. A world model should expose observability

A state behind a truck may be occluded. The model can infer likely free/occupied content from prior memory, but the planner should know that the evidence is inferred rather than currently observed.

Useful state metadata:

```text
visible now
last observed at time t
predicted through occlusion
map-prior only
sensor disagreement
```

This allows risk policy to be more conservative for poorly observed regions.

## 20. Temporal memory and world dynamics are related but not identical

A temporal BEV encoder may simply use history to improve current perception.

A world model additionally provides an **evolution model** that can roll state forward without new observation.

```text
temporal perception:
observations 1..t -> best state at t

world dynamics:
state at t + candidate actions -> possible states t+1..t+H
```

The distinction matters when connecting perception to planning.

## 21. Planning interface should be explicit

A planner should not consume an opaque latent vector without a defined contract.

One useful interface is:

```text
WorldState
    reference_time / ego pose
    static occupancy / free / unknown
    dynamic object states + covariance
    map/topology state
    visibility/age
    latent context (optional)

WorldDynamics(candidate_ego_trajectory)
    -> K future hypotheses
    -> occupancy/object futures
    -> probability / uncertainty
```

The planner can then query several candidate ego trajectories and evaluate consequences.

## 22. A world model is not the safety supervisor

Even an action-conditioned learned model can produce OOD or overconfident futures.

Independent constraints still belong outside the model:

```text
vehicle dynamic limits
hard collision checks
road boundary constraints
command freshness
fault/degradation handling
minimum-risk behavior
```

The world model provides evidence and predicted consequences; it should not be the sole authority over what the vehicle is physically allowed to execute.

## 23. Generative video models solve a different but related problem

Video-generation world models can be valuable for:

- representation pretraining;
- simulation/data augmentation;
- learning scene dynamics;
- rare-scenario synthesis.

But generating plausible pixels is not the same as preserving metric geometry and interaction probability.

For control, ask whether imagined video is **causally correct under action**, metrically consistent, temporally stable and calibrated — not merely realistic-looking.

## 24. Evaluation should be state- and decision-centric

Useful metrics include:

```text
current-state occupancy/object accuracy
state consistency through occlusion
multi-step geometric error
mode coverage
probability calibration
collision-risk recall
map/topology consistency
action sensitivity
OOD/degraded-sensor behavior
long-run state drift
```

Most importantly, test whether better world-model scores actually improve closed-loop planning without introducing new unsafe behavior.

## 25. Open-loop accuracy can hide closed-loop instability

A model may predict logged expert data well but behave poorly when the planner chooses a slightly different trajectory. This is distribution shift induced by the policy itself.

Closed-loop evaluation must expose the world model to states resulting from its own planner decisions, not only recorded trajectories.

Simulation is valuable here because it can evaluate interventions safely.

## 26. A minimal world-state update abstraction

```python
from dataclasses import dataclass

@dataclass
class Belief:
    reference_time: float
    occupancy: object
    objects: object
    latent: object
    quality: object

def update(predicted: Belief, observation_features, visibility):
    """Conceptual: correct prior belief with current evidence."""
    # Actual implementation may use learned attention, filters, or BEV fusion.
    return predicted

def predict(current: Belief, ego_action, dt):
    """Conceptual: propagate state without a new observation."""
    return current
```

The value of this abstraction is the separation between **observation correction** and **dynamics prediction**. That separation should remain visible even if both are learned end-to-end.

## 27. What to log in a real system

For every world-state generation:

```text
reference timestamp
input sensor generations/timestamps
localization generation
current-state quality
visibility/age maps
object track generation
model/dynamics version
future hypotheses and probabilities
candidate ego action used for conditioning
```

When planning behavior is wrong, you need to know whether the failure came from bad current belief, bad future dynamics or planner cost/constraints.

## 28. The useful definition

A world model for autonomy is:

> **a time-indexed, uncertainty-aware belief state plus a model of how that state can evolve under ego action and external-agent behavior.**

That definition is broad enough to include explicit occupancy/object systems and learned latent models, but precise enough to distinguish a real world model from a large perception network with fashionable naming.
