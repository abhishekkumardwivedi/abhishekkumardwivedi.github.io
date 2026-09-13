---
title: Math Behind Modern AI
description: A systems-oriented mathematical reference for modern learned models: linear operators, convolution, attention, optimization, probabilistic outputs, state-space dynamics, numerical precision and runtime cost.
sidebar:
  order: 1
---

The useful mathematics behind modern AI is not a taxonomy of CNNs, Transformers and state-space models. It is a small set of operations and inductive biases that repeatedly appear in different computational arrangements.

For a technical system designer, the important questions are:

```text
What information is represented by the tensor axes?
Which dimensions are mixed by this operator?
What invariance/equivariance is being assumed?
How does receptive/context range grow?
What is the numerical and memory cost?
How does uncertainty propagate into the output?
What changes when the graph is lowered to real hardware?
```

This article treats those questions as the mathematical substrate for perception and autonomy.

## 1. A tensor shape is part of the semantic contract

A tensor is not meaningful from dimensions alone.

```text
[B, Ncam, C, H, W]
```

can mean:

```text
B      independent samples
Ncam   physical camera identity
C      learned channels
H,W    image-space coordinates
```

while:

```text
[B, C, Y, X]
```

may be a metric BEV grid.

Both may contain the same number of values while describing completely different geometry.

A tensor contract should therefore include:

```text
axis meaning
coordinate frame / origin
units
reference timestamp
validity mask
layout / dtype
```

Most serious autonomy integration bugs are semantic-shape errors rather than matrix-algebra errors.

## 2. Linear maps are channel/feature mixers

A dense affine layer is:

$$y=Wx+b$$

A 1×1 convolution is the same idea applied independently at every spatial location:

$$y_{:,h,w}=W x_{:,h,w}+b$$

This is why a `2048 -> 256` projection in a camera encoder can reduce channel width without changing spatial coordinates.

The cost per location is approximately:

$$C_{in}C_{out}$$

multiply-accumulates, so channel width directly affects arithmetic and activation bandwidth in every downstream layer.

Low-rank/factorized projections exploit the fact that the learned linear map may not need full rank:

$$W\approx UV$$

reducing parameters and compute when the representation admits it.

## 3. Convolution encodes translation equivariance and locality

For a 2D convolution:

$$Y[o,i,j]=\sum_c\sum_{u,v}W[o,c,u,v]X[c,i+u,j+v]$$

The same kernel weights are reused across spatial positions. Ignoring boundary effects, translating the input translates the response — a useful inductive bias for image features.

The output dimension is:

$$H_{out}=\left\lfloor\frac{H+2P-D(K-1)-1}{S}+1\right\rfloor$$

where `K` is kernel, `S` stride, `P` padding and `D` dilation.

This equation is not bookkeeping. In an autonomy encoder, stride determines the metric/image spacing between adjacent feature cells and therefore affects later projection into BEV.

## 4. Feature stride and receptive field are different

If a deep camera feature has stride 32, adjacent feature centers correspond to roughly 32 input pixels apart.

That does **not** mean each feature only sees a 32×32 input region.

For layer `l`, receptive field can be propagated using:

$$j_l=j_{l-1}S_l$$

$$r_l=r_{l-1}+(K_l-1)D_lj_{l-1}$$

where `j_l` is the effective input jump and `r_l` the receptive field.

A deep 8×14 feature grid can therefore carry context from much larger portions of the image. This is why enlarging a coarse activation map for display should not be interpreted as a pixel-level segmentation.

## 5. Depthwise separable convolution changes arithmetic intensity

A standard `K×K` convolution costs roughly:

$$HWK^2C_{in}C_{out}$$

MACs.

Depthwise + pointwise convolution costs approximately:

$$HWK^2C_{in}+HWC_{in}C_{out}$$

which can be much smaller.

But fewer FLOPs do not always mean lower latency. Depthwise kernels can have lower arithmetic intensity and become memory/bandwidth limited. Hardware/compiler kernel quality matters.

This is a recurring theme: **model algebra and accelerator efficiency are related but not identical.**

## 6. Residual connections change optimization geometry

A residual block computes:

$$y=x+F(x)$$

Its Jacobian is:

$$\frac{\partial y}{\partial x}=I+\frac{\partial F}{\partial x}$$

The identity term gives gradients a direct path through deep networks and makes learning perturbations around the identity easier.

This is more informative than saying “ResNet solves vanishing gradients.” The residual parameterization changes the function class the optimizer traverses and remains useful in CNNs, Transformers and many modern blocks.

## 7. Normalization is not one interchangeable operation

### BatchNorm

For channel statistics estimated across a training batch/spatial positions:

$$\hat x=\frac{x-\mu_B}{\sqrt{\sigma_B^2+\epsilon}}$$

then:

$$y=\gamma\hat x+\beta$$

Inference typically uses running statistics. This creates a train/eval mode distinction.

### LayerNorm

Normalizes features within each sample/token and is independent of batch statistics, fitting Transformer-style models well.

Normalization choice affects:

- optimization stability;
- batch-size sensitivity;
- quantization behavior;
- compiler fusion;
- numerical reproducibility.

It should be understood as part of the deployed graph, not a training-only detail.

## 8. Attention is a learned data-dependent mixing matrix

Scaled dot-product attention is:

$$A=softmax\left(\frac{QK^T}{\sqrt{d_k}}\right)$$

$$Y=AV$$

where:

$$Q=XW_Q,\quad K=XW_K,\quad V=XW_V$$

The matrix `A` is data-dependent: each query chooses how strongly to mix available values.

This is the central difference from convolution, whose spatial mixing pattern is fixed by the kernel neighborhood.

Full self-attention over `N` tokens requires an `N×N` score structure, producing approximately quadratic memory/compute growth in token count.

For perception, tokenization therefore matters as much as model depth:

```text
image pixels -> too many tokens
patch features -> fewer
BEV cells -> potentially tens of thousands
objects/agents -> hundreds
```

Model architecture often revolves around controlling which relationships are allowed to become attention edges.

## 9. Deformable attention is sparse learned sampling

Instead of attending to every key, a query predicts/sample-selects a small number of locations:

$$y_q=\sum_{m=1}^{M}a_{qm}F(p_q+\Delta p_{qm})$$

where `M` is small compared with all spatial positions.

This is particularly useful for camera-to-BEV and multi-scale perception because calibration can provide a reference location and learning only needs to refine/sample around it.

The engineering advantage is reduced attention complexity; the implementation cost is efficient interpolation/gather operations, which may be non-trivial on embedded NPUs.

## 10. Softmax scores are not calibrated probabilities by default

For logits `z_i`:

$$p_i=\frac{e^{z_i}}{\sum_j e^{z_j}}$$

ensures values sum to one, but does not guarantee statistical calibration.

A model can be 99% confident and wrong more often than 1% of the time under domain shift.

Calibration asks whether:

$$P(correct\mid confidence\approx p)\approx p$$

Metrics/tools include:

- reliability diagrams;
- expected calibration error;
- negative log likelihood;
- Brier score;
- temperature scaling.

For autonomy, uncertainty should often be tied to a physical state estimate (pose covariance, trajectory distribution, occupancy probability) rather than a generic neural “confidence.”

## 11. Cross-entropy optimizes likelihood, not operational risk

For target class `y`:

$$L=-\log p_y$$

Cross-entropy is principled maximum-likelihood training, but the downstream vehicle decision has asymmetric costs.

Missing a pedestrian and misclassifying one vehicle type as another do not have equal consequences.

Therefore evaluation/loss design often needs:

```text
class/scene reweighting
focal loss for imbalance
geometry-aware regression losses
uncertainty likelihood losses
multi-task weighting
rare/ODD slice metrics
```

The training objective determines what errors the optimizer considers expensive; the safety architecture determines what errors the vehicle can tolerate. Those are connected but not identical.

## 12. Regression should model the geometry of the output space

Using plain L2 everywhere can be wrong.

For periodic heading:

```text
179° and -179° differ numerically by 358°
physically by 2°
```

Better representations include:

$$[\sin\theta,\cos\theta]$$

or wrapped angular losses.

For rotations in 3D, quaternion/SO(3) geometry matters. For boxes, IoU-like/geometric losses can better match task behavior than independent coordinate L2.

The output representation is part of the optimization problem.

## 13. Backpropagation is repeated vector-Jacobian product, not a symbolic derivative dump

For a composition:

$$y=f_L(f_{L-1}(...f_1(x)))$$

reverse-mode autodiff propagates gradients using local Jacobian-vector products.

The memory cost comes from values/intermediates needed for backward, which is why training activation memory is often much larger than inference memory.

Checkpointing trades compute for memory by recomputing selected activations during backward.

For an autonomy project, this distinction explains why a model that fits comfortably for inference on a GPU can require far more memory during training.

## 14. Optimizer state can exceed weight memory

For Adam-like optimization, parameters can have:

```text
weights
gradients
first moment
second moment
possibly master FP32 weights
```

A nominal 1 GB FP16 model can therefore require several GB beyond its inference weight size during training.

This is relevant when estimating whether full fine-tuning, LoRA/adapters, or frozen-backbone training fits the available hardware.

## 15. Mixed precision changes dynamic range and accumulation behavior

FP16, BF16 and INT8 have different numerical properties.

### FP16

More mantissa precision than BF16 but smaller exponent range; training often needs loss scaling.

### BF16

FP32-like exponent range with fewer mantissa bits; often robust for training on supporting hardware.

### INT8

Requires quantization scale/zero-point and often accumulates into wider integer precision.

For affine quantization:

$$q=round(x/s)+z$$

with approximate reconstruction:

$$x\approx s(q-z)$$

Quantization error depends on dynamic range, outliers and per-tensor/per-channel scaling. It is a model-quality change, not merely a storage optimization.

## 16. Arithmetic intensity determines whether FLOPs matter

A simplified roofline view is:

$$Performance \le \min(PeakCompute,\ Bandwidth\times ArithmeticIntensity)$$

with:

$$ArithmeticIntensity=\frac{operations}{bytes\ moved}$$

Large matrix multiplies/convolutions can be compute-efficient. Scatter/gather, sparse indexing, depthwise convolution or small kernels may become bandwidth/dispatch limited.

For autonomy deployment, operators such as:

```text
voxelization
scatter-add
grid sampling
non-max suppression
sparse convolution
attention gather
```

can dominate latency despite modest FLOP counts.

## 17. State-space models are learned dynamical systems

A linear discrete state-space model is:

$$h_{t+1}=Ah_t+Bx_t$$

$$y_t=Ch_t+Dx_t$$

The eigenstructure of `A` determines how state modes decay, persist or grow.

Modern selective SSMs make parameters/input gates data-dependent while retaining computational structure that supports efficient scans.

The useful comparison with attention is not “SSM is newer.” It is:

```text
attention: explicit content-dependent retrieval from stored tokens
SSM: compressed evolving state with structured recurrence
```

For streaming autonomy, state size and reset semantics can be as important as sequence complexity.

## 18. Temporal models need real elapsed time when sampling is irregular

A discrete model implicitly assumes some sample interval. If sensor/model updates occur with variable `Δt`, the transition should account for it.

For a continuous linear system:

$$\dot h=Ah+Bx$$

its discrete transition over interval `\Delta t` is:

$$h_{t+\Delta t}=e^{A\Delta t}h_t+...$$

This illustrates why blindly feeding irregular sensor updates into a model trained at fixed cadence can change the effective dynamics.

Even when the neural model is not derived from continuous dynamics, encoding real `Δt` makes the time contract explicit.

## 19. Bayesian reasoning clarifies fusion

Given prior state `x` and measurement `z`:

$$P(x|z)\propto P(z|x)P(x)$$

This decomposition is useful even when the implementation is learned.

```text
prior / temporal state
        ×
measurement likelihood/evidence
        ↓
posterior/current belief
```

Camera, LiDAR and radar have different likelihood structures and uncertainty. Fusion should therefore reconcile evidence rather than simply average feature vectors.

A world model can be viewed as a learned approximation to repeated prediction and Bayesian-style correction.

## 20. Coordinate transforms live on groups, not ordinary vectors

Rigid-body pose is an element of SE(3):

$$T=\begin{bmatrix}R&t\\0&1\end{bmatrix}$$

Composition is matrix multiplication; inverse is:

$$T^{-1}=\begin{bmatrix}R^T&-R^Tt\\0&1\end{bmatrix}$$

Rotations belong to SO(3), so naive addition/subtraction of Euler angles is not generally correct.

This mathematics underlies:

- sensor extrinsics;
- ego-motion compensation;
- LiDAR deskew;
- camera projection;
- BEV temporal warping;
- localization.

Learning does not make the group structure optional.

## 21. Camera projection exposes where learning begins

For 3D camera-coordinate point `P=[X,Y,Z]^T`:

$$\lambda\begin{bmatrix}u\\v\\1\end{bmatrix}=KP$$

Back-projecting an image point gives a ray:

$$P=dK^{-1}p$$

The unknown depth `d` is exactly where camera-to-BEV needs additional information or learned inference.

This is a useful way to divide autonomy math:

```text
known geometry -> compute exactly
unknown depth/semantics/behavior -> estimate/learn
```

## 22. Sparse representations trade arithmetic for indexing complexity

LiDAR/voxel networks exploit the fact that most 3D cells are empty.

If dense volume occupancy is `ρ << 1`, sparse computation can reduce arithmetic dramatically. But runtime now carries:

```text
active coordinate lists
hash/index maps
neighbor lookup
scatter/gather metadata
```

The theoretical savings depend on whether the target hardware/compiler handles these operations efficiently.

Sparsity is therefore both a mathematical prior and a software/hardware data-structure decision.

## 23. Diffusion models are iterative conditional density models

A diffusion model learns to reverse a noise process, often through a score/noise predictor.

In physical AI, the important use is often **multimodal trajectory/action generation**, not image synthesis.

Rather than regress one averaged action, a diffusion policy can sample multiple plausible action sequences from a learned conditional distribution.

The tradeoff is iterative denoising latency. Truncated/consistency/flow-matching approaches attempt to reduce steps.

The systems question is whether mode coverage gained is worth inference budget and how candidate actions are subsequently constrained.

## 24. Information bottlenecks are architectural decisions

Every representation discards information:

```text
RGB -> deep C5 features: spatial detail reduced
LiDAR -> pillars: vertical distribution compressed
radar -> CFAR points: sub-threshold signal discarded
objects -> tracks: raw measurement ambiguity compressed
BEV -> object list: unknown/free spatial evidence can disappear
```

Downstream models cannot recover information that was deterministically removed upstream unless priors hallucinate it.

A powerful architecture skill is therefore deciding **where information is allowed to become irreversible**.

## 25. The runtime graph is the final mathematics that matters

The framework graph may be transformed by:

```text
constant folding
operator decomposition
fusion
layout conversion
quantization
partitioning across CPU/GPU/NPU
```

So performance and numerical behavior must ultimately be measured on the lowered graph.

A useful end-to-end model cost is:

$$T_{e2e}=T_{pre}+T_{queue}+T_{compute}+T_{sync}+T_{post}+T_{handoff}$$

not simply neural kernel time.

## 26. How to read the rest of the autonomy series mathematically

When encountering a new model, ignore the brand name first and ask:

```text
What are the input/output tensor semantics?
Which axes are mixed locally/globally?
What geometry is computed explicitly?
Where is uncertainty represented?
What state persists across time?
What information bottleneck is introduced?
What is the activation/memory scaling?
Which operators dominate the deployed graph?
```

Those questions make ResNet, BEVFormer, BEVFusion, ConvGRU, SSMs and world models comparable at the level that actually matters for system design.
