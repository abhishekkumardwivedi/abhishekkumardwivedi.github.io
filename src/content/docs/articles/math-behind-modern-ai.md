---
title: Math Behind Modern AI
description: How linear algebra, probability, optimisation, convolution, recurrence, attention, and state-space mathematics become modern learning systems.
sidebar:
  order: 1
---

Neural networks can appear to be a collection of very different inventions: CNNs for images, RNNs for sequences, Transformers for context, graph networks for relationships, and state-space models for efficient memory. Underneath their names, however, they are built from a surprisingly small set of mathematical ideas.

The important question is not merely *which model is popular?* It is:

> What structure does the data contain, what relationship must be learned, and what computation can represent it efficiently?

This article develops that intuition without prescribing a particular product architecture.

## Everything begins as a tensor

A model does not directly see a road, an object, a sound, or a sentence. It receives numbers arranged into tensors.

- A scalar is one number.
- A vector is an ordered list of numbers.
- A matrix is a two-dimensional grid.
- A tensor generalises the idea to more dimensions.

An image may be represented by height, width, and colour channels. A sequence adds a time or token dimension. A batch adds another dimension. Intermediate features may have little human-readable meaning, but their shape describes how information is organised for computation.

Most neural-network execution eventually reduces to a compact vocabulary:

- matrix multiplication or convolution;
- addition and element-wise multiplication;
- nonlinear activation;
- normalisation;
- pooling, sampling, or reduction;
- comparison against a loss;
- gradient-based parameter updates.

Architectures differ mainly in how they arrange these operations and what assumptions they embed about the data.

## Linear algebra: learning useful projections

A dense neural layer can be written conceptually as:

`y = W x + b`

The input vector `x` is multiplied by a learned weight matrix `W`, then shifted by a bias `b`. Geometrically, this operation projects, rotates, scales, combines, or separates features into a new representation.

This same idea appears almost everywhere:

- classifiers project features toward class scores;
- embeddings map discrete identities into continuous vectors;
- attention creates query, key, and value projections;
- convolution combines values from a local neighbourhood;
- recurrent models transform both the current input and previous state.

Large models are therefore not escaping linear algebra. They are composing many learned projections with carefully placed nonlinear and structural operations.

## Why nonlinearity is essential

Stacking only linear layers still produces one larger linear transformation. Such a network cannot learn the complex curved boundaries needed for real-world data.

Activation functions change this:

- **ReLU** keeps positive values and suppresses negative ones. It is simple and computationally efficient.
- **Leaky ReLU** preserves a small negative slope, reducing permanently inactive units.
- **Sigmoid** maps values into the range zero to one and is useful for gates or probability-like outputs.
- **Tanh** produces a bounded signed output and historically appears in recurrent state updates.
- **GELU and SiLU** provide smooth gating behaviour and are common in modern architectures.

The activation is not just a cosmetic choice. It influences gradient flow, numerical behaviour, sparsity, hardware efficiency, and how easily the network can represent complex functions.

## CNN: mathematical locality

A convolutional neural network assumes that nearby values are strongly related and that a useful pattern may occur at many positions.

A small learned kernel slides across the input. At every position it performs a weighted local combination. Early filters may respond to edges, corners, colour transitions, or texture. Deeper layers combine these into shapes, parts, objects, and more abstract spatial features.

Three ideas make convolution powerful:

1. **Local connectivity** — each output initially depends on a neighbourhood rather than the entire input.
2. **Weight sharing** — the same kernel is reused at different positions.
3. **Hierarchical receptive fields** — deeper features indirectly observe larger regions.

This gives CNNs a strong inductive bias for images and other grid-like signals. It also reduces parameters compared with connecting every input position to every output.

Variants such as strided, dilated, depthwise, pointwise, transposed, and sparse convolution change how the neighbourhood is sampled or combined. The shared idea remains: exploit known spatial structure instead of asking a general matrix to discover everything from scratch.

## RNN: state carried through time

For sequential data, the present may depend on what happened earlier. A recurrent neural network represents this through a hidden state:

`h(t) = f(Wx · x(t) + Wh · h(t-1) + b)`

At time `t`, the network combines the current input with its previous state. The state acts as a compressed memory of the past.

Plain RNNs struggle when important information must survive across many steps. During training, repeatedly multiplying gradients can make them shrink toward zero or grow uncontrollably. LSTM and GRU architectures address this with learned gates controlling what to retain, expose, update, or forget.

Recurrence provides a natural streaming interpretation, but its sequential dependency can limit training parallelism. Each new state depends on the preceding state, so the entire sequence cannot always be processed simultaneously.

RNN, LSTM, and GRU are architecture families for sequence modelling. They should not be confused with *prediction* itself: temporal prediction is a task, while recurrence is one possible computational structure for solving it.

## Attention: learning contextual relationships

Attention asks how strongly one element should use information from another.

Each element is projected into three representations:

- a **query** describing what it is looking for;
- a **key** describing what it offers;
- a **value** containing the information that may be passed onward.

Queries are compared with keys using dot products. The scores are scaled and normalised, commonly with softmax. The resulting weights form a weighted combination of values.

Conceptually:

`Attention(Q, K, V) = softmax(QKᵀ / scale) V`

This allows a model to build context dynamically. A feature can relate to nearby or distant features based on content rather than a fixed neighbourhood alone.

Transformers combine attention with feed-forward layers, residual connections, normalisation, and positional information. Unlike a recurrent model, a Transformer can compare many sequence elements in parallel during training. The cost is that full attention commonly grows approximately with the square of sequence length, increasing memory and computation for long inputs.

Attention is valuable beyond language. Any problem involving contextual relationships between spatial regions, time steps, modalities, objects, or learned tokens may benefit from the same mathematics.

## State-space models: efficient evolving memory

State-space models describe a system through a compact internal state that evolves as new input arrives:

`h(t) = A · h(t-1) + B · x(t)`

`y(t) = C · h(t) + D · x(t)`

The matrices determine how previous state persists, how new input enters, and how output is produced. Modern selective state-space architectures make parts of this behaviour input-dependent, allowing the model to retain or suppress information dynamically.

Their attraction is the possibility of long-context modelling with more favourable scaling than full attention. Although state updates appear recurrent, special mathematical structure can permit parallel training through scan-like operations while retaining efficient sequential inference.

State-space models do not make CNNs, recurrence, or attention obsolete. They introduce another trade-off between locality, contextual access, memory, parallelism, and deployment efficiency.

## Graph networks: reasoning about relationships

Some data is naturally described as entities and relationships rather than a regular grid or sequence. A graph neural network represents entities as nodes and their relationships as edges.

Each node collects messages from connected neighbours, combines them, and updates its representation. Multiple rounds allow information to propagate farther through the graph.

Graph mathematics is useful when topology matters: interacting agents, connected components, molecular structures, road networks, or relationships between detected entities. The graph can be fixed, learned, or constructed dynamically from proximity and semantics.

The key inductive bias is explicit: relationships determine which information should be exchanged.

## Latent and generative models

Not every useful model produces a class label or a deterministic coordinate.

**Autoencoders** learn to compress an input into a latent representation and reconstruct it. **Variational autoencoders** impose a probabilistic structure on that latent space. **Diffusion models** learn to reverse a gradual corruption process, generating or refining samples through repeated denoising.

These approaches help with representation learning, reconstruction, multimodal futures, data generation, and modelling uncertainty. Their usefulness depends on the task and execution budget; iterative generation may be expensive where strict latency is required.

## Loss functions define what “better” means

A network learns only through the objective it is given. The loss function converts the difference between prediction and target into a scalar signal.

Common mathematical patterns include:

- cross-entropy for classification;
- L1 or L2 distance for regression;
- overlap-based losses for segmentation;
- ranking or contrastive losses for representation learning;
- likelihood-based objectives for probabilistic predictions;
- weighted multi-task losses when several outputs are learned together.

Loss design is part of system design. An objective can unintentionally favour common cases, average away rare outcomes, ignore calibration, or reward a numerically small error that is operationally important. The loss therefore encodes priorities—not merely mathematics.

## Backpropagation and optimisation

Training follows a repeated loop:

1. Run a forward pass to produce predictions.
2. Compute the loss.
3. Use the chain rule to calculate how each parameter contributed to that loss.
4. Update parameters in a direction expected to reduce future loss.

Gradient descent and optimisers such as SGD or Adam differ in how they scale, smooth, and accumulate updates. Learning-rate schedules control how aggressively the model changes over time.

Residual connections, normalisation, suitable initialisation, gradient clipping, regularisation, and data augmentation all help make optimisation stable and improve generalisation. They do not replace learning; they shape the mathematical landscape through which learning proceeds.

## Probability and uncertainty

A high score is not automatically a trustworthy probability. Real systems must distinguish prediction from confidence and confidence from calibration.

Two broad uncertainty categories are useful:

- **Aleatoric uncertainty** comes from ambiguity or noise inherent in the observation.
- **Epistemic uncertainty** comes from limited knowledge, insufficient data, or an unfamiliar operating condition.

Softmax scores, entropy, ensembles, probabilistic outputs, calibration methods, and distribution-shift detection provide different views of uncertainty. None is a universal guarantee.

For decision-making systems, the question is not only “What did the model predict?” but also “How reliable is that prediction here, and what should the wider system do when reliability is inadequate?”

## Geometry and time remain fundamental

Learning does not eliminate classical mathematics. Perception and physical-world reasoning still depend on coordinate systems, projection geometry, transforms, motion, filtering, interpolation, and time alignment.

A feature expressed in one frame may need to be transformed into another. Observations made at different times may describe different physical states. Tracking may combine a motion model with uncertain measurements. A learned representation can improve the observations, but it does not make coordinate and timing consistency optional.

This is why robust intelligent systems frequently combine neural components with geometry, estimation, filtering, optimisation, rules, and safety supervision.

## The model must eventually execute

A mathematically elegant architecture is not automatically a deployable one. Runtime cost depends on more than parameter count:

- tensor shapes and operator support;
- dense versus sparse computation;
- intermediate activation memory;
- memory bandwidth and data movement;
- numerical precision and quantisation;
- kernel fusion and tiling;
- CPU, GPU, DSP, or NPU partitioning;
- batch size, latency, and concurrency;
- unsupported operations that fall back to another processor.

Compilation transforms the learned graph into operations supported efficiently by the target. Quantisation changes numerical representation, often from floating point to lower-precision integers. Memory planning determines where intermediate tensors live and when buffers can be reused.

The real unit of performance is therefore not the model name. It is the complete interaction between graph, compiler, runtime, memory system, accelerator, and surrounding application.

## Choosing a model family conceptually

| Structure in the problem | Useful mathematical bias |
|---|---|
| Local spatial patterns | Convolution and multiscale hierarchy |
| Ordered history with compact memory | Recurrence and gating |
| Content-dependent global relationships | Attention |
| Long evolving context with efficient state | State-space modelling |
| Explicit entities and relationships | Graph message passing |
| Compression or latent representation | Autoencoding |
| Multiple plausible outputs | Probabilistic or generative modelling |

This table is not a product recipe. Modern systems frequently combine several families because real data contains spatial, temporal, relational, probabilistic, and resource constraints at the same time.

## The lasting intuition

CNNs, RNNs, Transformers, graph networks, and state-space models are not isolated magic boxes. Each embeds a mathematical opinion about how information should move:

- convolution says nearby patterns and translation matter;
- recurrence says the past can be compressed into state;
- attention says relationships should depend on content;
- state-space models say memory can evolve through structured dynamics;
- graph networks say topology should control communication.

The most useful skill is not memorising model names. It is learning to identify the structure of a problem, choose an appropriate mathematical bias, define a meaningful objective, quantify uncertainty, and understand how the resulting computation will behave on real hardware.
