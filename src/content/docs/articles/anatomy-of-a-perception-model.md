---
title: Anatomy of a Perception Model
description: How stems, backbones, encoders, necks, heads, decoders, losses, and post-processing fit into a usable perception model.
sidebar:
  order: 2
---

Knowing what a CNN, Transformer, or state-space model does is only the beginning. A practical model is rarely one uninterrupted architecture. It is assembled from functional sections that convert raw input into useful representations and then into task-specific outputs.

Terms such as **backbone**, **neck**, **head**, **encoder**, and **decoder** can sound like competing descriptions. They are actually two overlapping ways of explaining how information moves through a model.

This article develops a reusable mental model:

`input → preparation → representation → aggregation → prediction → interpretation`

The names may change, but nearly every perception model must solve these stages somehow.

## The shortest useful definition

| Component | Primary responsibility |
|---|---|
| Input adapter or stem | Convert the incoming tensor into the feature format expected by the model |
| Backbone | Extract increasingly abstract features, usually at multiple spatial scales |
| Encoder | Compress input into a useful latent representation; often includes the backbone |
| Neck | Combine, align, or enrich features before prediction |
| Head | Convert shared features into task-specific outputs |
| Decoder | Recover structured or high-resolution output from encoded features |
| Post-processing | Turn raw outputs into application-level results |

The complete model is therefore not simply “a backbone.” A backbone produces representations. Something else must turn those representations into an answer.

## Begin with the tensor contract

Before selecting a model family, define what enters and exits each section.

For a generic image tensor:

`[batch, channels, height, width]`

An input of `[1, 3, 512, 512]` contains one three-channel image. A backbone might transform it into several feature tensors:

| Feature | Example shape | Interpretation |
|---|---:|---|
| `C3` | `[1, 128, 64, 64]` | Higher spatial detail, weaker semantics |
| `C4` | `[1, 256, 32, 32]` | Intermediate detail and semantics |
| `C5` | `[1, 512, 16, 16]` | Stronger semantics, lower spatial resolution |

These numbers are illustrative rather than a recommended configuration. What matters is the pattern: spatial resolution decreases while channel capacity and semantic abstraction often increase.

Thinking in tensor contracts prevents many architecture mistakes. Two components can be individually valid and still be incompatible because their shapes, strides, channel counts, coordinate conventions, or numerical ranges do not agree.

## 1. Input preparation and the stem

The raw input may require resizing, cropping, normalisation, padding, colour conversion, temporal stacking, or calibration-aware transformation before feature extraction.

The **stem** is the first learned part of the model. It commonly uses convolution, patch embedding, or another projection to move from raw channels into a larger feature space. It may also reduce resolution early to control computation.

For a CNN, the stem may be a convolution followed by normalisation and activation. For a vision Transformer, it may split the image into patches and project each patch into a token. For sparse or point-based data, the input adapter may voxelise, sample, or embed coordinates and attributes.

The input stage establishes the contract for everything that follows. Incorrect normalisation or resizing can damage a model even when all later layers are correct.

## 2. Backbone: reusable feature extraction

The backbone answers:

> Which reusable features can be extracted from this input?

Early stages usually retain local detail. Deeper stages build more abstract representations. A backbone may be based on convolution, attention, state-space layers, or a hybrid of several families.

Backbones are often pretrained because generic visual structures—edges, textures, contours, parts, and contextual patterns—can transfer between tasks. The same backbone may support classification, detection, segmentation, depth estimation, or other heads.

A useful backbone exposes multiple stages rather than only its final tensor. Different tasks need different balances of detail and semantics.

### Minimal PyTorch backbone

The following model is intentionally small. Its purpose is to show contracts, not to propose a production architecture.

```python
import torch
import torch.nn as nn


class ConvBlock(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(
                in_channels,
                out_channels,
                kernel_size=3,
                stride=stride,
                padding=1,
                bias=False,
            ),
            nn.BatchNorm2d(out_channels),
            nn.SiLU(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class TinyBackbone(nn.Module):
    def __init__(self):
        super().__init__()
        self.stem = ConvBlock(3, 32, stride=2)
        self.stage1 = ConvBlock(32, 64, stride=2)
        self.stage2 = ConvBlock(64, 128, stride=2)
        self.stage3 = ConvBlock(128, 256, stride=2)
        self.stage4 = ConvBlock(256, 512, stride=2)

    def forward(self, x: torch.Tensor) -> dict[str, torch.Tensor]:
        x = self.stem(x)
        x = self.stage1(x)
        c3 = self.stage2(x)
        c4 = self.stage3(c3)
        c5 = self.stage4(c4)
        return {"c3": c3, "c4": c4, "c5": c5}
```

The important decision is the return value. Instead of returning only `c5`, the backbone exposes a feature hierarchy that later components can reuse.

## 3. Neck: feature aggregation

The neck answers:

> How should features from the backbone be combined before prediction?

Deep low-resolution features understand *what* is present but may be imprecise about *where*. Shallower high-resolution features preserve location but carry weaker semantics. A neck attempts to reconcile this.

Common neck operations include:

- top-down and bottom-up feature pyramids;
- lateral projections that align channel counts;
- upsampling and downsampling;
- concatenation or addition;
- attention across scales or modalities;
- temporal aggregation;
- learned fusion and gating.

The word “neck” is especially common in detection systems, but the function appears elsewhere even when it has another name.

### A simplified feature-pyramid neck

```python
import torch.nn.functional as F


class SimpleFPN(nn.Module):
    def __init__(self, out_channels: int = 128):
        super().__init__()
        self.to_p3 = nn.Conv2d(128, out_channels, kernel_size=1)
        self.to_p4 = nn.Conv2d(256, out_channels, kernel_size=1)
        self.to_p5 = nn.Conv2d(512, out_channels, kernel_size=1)

        self.smooth3 = nn.Conv2d(out_channels, out_channels, 3, padding=1)
        self.smooth4 = nn.Conv2d(out_channels, out_channels, 3, padding=1)
        self.smooth5 = nn.Conv2d(out_channels, out_channels, 3, padding=1)

    def forward(
        self, features: dict[str, torch.Tensor]
    ) -> dict[str, torch.Tensor]:
        p5 = self.to_p5(features["c5"])

        p4 = self.to_p4(features["c4"])
        p4 = p4 + F.interpolate(
            p5, size=p4.shape[-2:], mode="nearest"
        )

        p3 = self.to_p3(features["c3"])
        p3 = p3 + F.interpolate(
            p4, size=p3.shape[-2:], mode="nearest"
        )

        return {
            "p3": self.smooth3(p3),
            "p4": self.smooth4(p4),
            "p5": self.smooth5(p5),
        }
```

The `1 × 1` convolutions align channel dimensions. Upsampling aligns spatial dimensions. Addition combines deeper semantic features with higher-resolution features. The smoothing convolutions refine the merged results.

Real feature-pyramid designs may be considerably more sophisticated, but their purpose remains recognisable.

## 4. Head: convert features into task outputs

The head answers:

> What should be predicted from the shared representation?

A head is task-specific. Examples include:

- class probabilities;
- bounding-box or keypoint coordinates;
- per-pixel semantic labels;
- depth or surface estimates;
- motion vectors;
- object embeddings;
- confidence or uncertainty values.

A model may have multiple heads sharing one backbone and neck. This can reduce duplicated computation and encourage related tasks to learn compatible features. It also creates challenges: tasks may compete for capacity, produce gradients of very different scales, or require different spatial resolutions.

### A generic dense prediction head

```python
class DenseHead(nn.Module):
    def __init__(self, in_channels: int, num_outputs: int):
        super().__init__()
        self.predict = nn.Sequential(
            ConvBlock(in_channels, in_channels),
            nn.Conv2d(in_channels, num_outputs, kernel_size=1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.predict(x)
```

The final `1 × 1` convolution converts each spatial feature vector into the desired output channels. Interpretation depends on the task: those channels could be class logits, regression values, or another learned representation.

## 5. Assemble backbone, neck, and heads

```python
class PerceptionModel(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.backbone = TinyBackbone()
        self.neck = SimpleFPN(out_channels=128)

        self.class_head = DenseHead(128, num_classes)
        self.quality_head = DenseHead(128, 1)

    def forward(self, x: torch.Tensor) -> dict[str, torch.Tensor]:
        backbone_features = self.backbone(x)
        pyramid = self.neck(backbone_features)

        # Use one illustrative pyramid level for compactness.
        shared = pyramid["p3"]

        return {
            "class_logits": self.class_head(shared),
            "quality": self.quality_head(shared),
        }


if __name__ == "__main__":
    model = PerceptionModel(num_classes=10).eval()
    sample = torch.randn(1, 3, 512, 512)

    with torch.no_grad():
        outputs = model(sample)

    for name, tensor in outputs.items():
        print(f"{name:>14}: {tuple(tensor.shape)}")
```

This shows the central architectural pattern:

1. The backbone creates a hierarchy.
2. The neck aligns and combines it.
3. Independent heads convert shared features into task outputs.

It deliberately omits task-specific decoding and inference rules because those depend on the problem definition.

## Where does the encoder–decoder pattern fit?

The encoder–decoder vocabulary describes information compression and reconstruction.

- The **encoder** transforms input into a compact or abstract representation.
- The **decoder** transforms that representation into a structured output.

The backbone usually forms most or all of the encoder. The neck may sit between encoder and decoder, or parts of it may be considered part of either side. A large dense-prediction head that progressively upsamples features may effectively be a decoder.

The vocabularies therefore overlap:

| Backbone vocabulary | Encoder–decoder vocabulary |
|---|---|
| Stem + backbone | Encoder |
| Neck | Bottleneck, bridge, or multiscale fusion |
| Dense head with upsampling | Decoder + output projection |
| Small classification head | Output projection rather than a full decoder |

Use the terms that best explain the architecture. Do not force a model into one vocabulary when the other is clearer.

## Decoder: reconstructing useful structure

A decoder is common when the output needs substantial spatial or sequential structure. It may progressively increase resolution while combining encoded semantics with skip connections from earlier layers.

Skip connections help because compression loses detail. They allow the decoder to reuse high-resolution encoder features while deeper representations provide context.

```python
class SimpleDecoder(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.merge4 = ConvBlock(512 + 256, 256)
        self.merge3 = ConvBlock(256 + 128, 128)
        self.output = nn.Conv2d(128, num_classes, kernel_size=1)

    def forward(
        self, features: dict[str, torch.Tensor]
    ) -> torch.Tensor:
        c3, c4, c5 = features["c3"], features["c4"], features["c5"]

        x = F.interpolate(c5, size=c4.shape[-2:], mode="bilinear",
                          align_corners=False)
        x = self.merge4(torch.cat([x, c4], dim=1))

        x = F.interpolate(x, size=c3.shape[-2:], mode="bilinear",
                          align_corners=False)
        x = self.merge3(torch.cat([x, c3], dim=1))

        return self.output(x)
```

This is a simple spatial decoder. Sequence-to-sequence Transformers use a different decoder structure: self-attention over generated tokens, cross-attention to encoder features, and a projection toward output tokens. The shared concept is still transformation from an encoded representation into structured output.

## Neck versus decoder

These are commonly confused because both may upsample and fuse features.

A practical distinction is:

- A **neck** prepares reusable features for one or more heads.
- A **decoder** moves toward the structure and resolution of a particular output.

If a fused feature pyramid feeds detection, segmentation, and depth heads, it behaves like a neck. If a path progressively reconstructs one segmentation map, it behaves like a decoder. Some modules legitimately perform both roles.

## One-stage and two-stage prediction

Model assembly also differs in when task-specific reasoning occurs.

### One-stage pattern

`input → backbone → neck → dense head → output`

Predictions are made directly from feature maps or learned queries. This often favours a compact inference path.

### Two-stage pattern

`input → backbone → neck → proposals → region features → refined head → output`

The first stage identifies candidate regions or entities. The second stage performs more focused classification or regression. This may improve specialisation but introduces additional computation and control flow.

Neither pattern is universally superior. The choice depends on accuracy, latency, memory, data, target hardware, and application-level behaviour.

## Multi-task models

A shared encoder can feed several heads:

```python
class MultiTaskHeads(nn.Module):
    def __init__(self, channels: int, task_outputs: dict[str, int]):
        super().__init__()
        self.heads = nn.ModuleDict({
            task: DenseHead(channels, output_channels)
            for task, output_channels in task_outputs.items()
        })

    def forward(self, x: torch.Tensor) -> dict[str, torch.Tensor]:
        return {name: head(x) for name, head in self.heads.items()}
```

The code is easy; balancing the tasks is harder. Multi-task design must consider:

- which features should be shared;
- where task-specific branches should begin;
- loss magnitudes and weighting;
- missing labels for some samples;
- conflicting gradients;
- different output resolutions and update frequencies;
- whether failure in one task should affect another.

Sharing improves efficiency only when the shared representation is genuinely useful to the tasks.

## Training adds losses, not post-processing

During training, raw head outputs are compared with targets. A multi-task objective may be expressed as:

`total_loss = w1 · loss_task1 + w2 · loss_task2 + ...`

The weights are not trivial. They determine how strongly each task shapes the shared representation.

```python
def compute_loss(outputs, targets):
    class_loss = nn.functional.cross_entropy(
        outputs["class_logits"], targets["classes"]
    )
    quality_loss = nn.functional.binary_cross_entropy_with_logits(
        outputs["quality"], targets["quality"]
    )
    return class_loss + 0.25 * quality_loss
```

This snippet demonstrates composition, not suitable weights for a particular system. Real loss design must reflect label definitions, imbalance, uncertainty, and operational importance.

Post-processing is normally not part of gradient-based learning. It converts raw outputs into application-level structures after inference.

## Post-processing: raw tensors are not yet decisions

A head may emit logits, distributions, coordinates, offsets, heatmaps, masks, embeddings, or uncertainty estimates. Post-processing may then perform:

- activation or probability conversion;
- thresholding;
- coordinate decoding and transformation;
- duplicate suppression or grouping;
- interpolation to the original resolution;
- tracking or association over time;
- rule-based validation;
- packaging with confidence and quality metadata.

This stage is sometimes implemented outside the neural graph in C++ or another runtime. In other cases, selected operations are included in the exported model to reduce data movement or platform-specific code.

The boundary affects portability, numerical consistency, accelerator utilisation, debugging, and safety analysis.

## CNN, Transformer, and state-space blocks can occupy the same role

Backbone is a *role*, not a mathematical family.

- A CNN can be the backbone.
- A hierarchical vision Transformer can be the backbone.
- A state-space or hybrid model can be the backbone.
- Attention may appear in the backbone, neck, decoder, or head.
- Convolution may appear before and after a Transformer.

Likewise, “encoder” does not mean Transformer. CNN encoders, recurrent encoders, graph encoders, and state-space encoders are all valid descriptions.

Separate the questions:

1. **Role:** Is this component extracting, aggregating, decoding, or predicting?
2. **Mathematics:** Does it use convolution, recurrence, attention, graph message passing, state-space updates, or a hybrid?

This distinction makes architecture diagrams and technical discussions much clearer.

## Reuse, freeze, fine-tune, or train

A pretrained backbone can be used in several ways:

- **Frozen feature extractor:** keep its parameters fixed and train only the new head.
- **Partial fine-tuning:** train later backbone stages while freezing earlier stages.
- **Full fine-tuning:** update the entire model with a smaller learning rate.
- **Training from scratch:** initialise all parameters for the target data and objective.
- **Adapter-based tuning:** add small trainable modules while leaving most base parameters unchanged.

The best approach depends on domain similarity, dataset size, compute budget, licensing, numerical precision, and deployment constraints. A powerful pretrained model may still be unsuitable if its operators, memory footprint, input assumptions, or licence do not fit the product.

## Architecture and deployment must be designed together

A clean Python composition can become expensive after export. Important questions include:

- Are every backbone, neck, and head operator supported by the target backend?
- Do feature maps consume more memory than the weights?
- Does upsampling cause repeated transfers between processors?
- Can convolution, normalisation, and activation be fused?
- Will one unsupported operation force a large subgraph onto the CPU?
- Can several heads share the same intermediate buffer safely?
- Does quantisation preserve every task’s required accuracy?
- Are dynamic shapes necessary, or can bounded static shapes improve compilation?

Module boundaries should improve reasoning, training, testing, and reuse. They do not guarantee efficient runtime boundaries. Compilers may fuse modules together or partition one module across processors.

## A practical way to read any model

When encountering an unfamiliar architecture, ignore its branding initially and ask:

1. What is the input tensor and its preprocessing contract?
2. Where is resolution reduced or token count changed?
3. Which component extracts reusable features?
4. Which intermediate scales or states are retained?
5. How are local, global, and temporal relationships represented?
6. Where are features fused or decoded?
7. Which outputs belong to which heads?
8. What losses train those outputs?
9. What post-processing converts them into useful structures?
10. Which operations dominate memory movement and execution time?

Once these questions are answered, most architectures become variations of familiar patterns rather than mysterious collections of blocks.

## The lasting mental model

The backbone–neck–head view emphasises reuse and task decomposition:

`features → aggregated features → predictions`

The encoder–decoder view emphasises representation and reconstruction:

`input → latent representation → structured output`

Neither is universally more correct. Use both perspectives:

- identify the role each component plays;
- identify the mathematics it uses;
- track tensor shapes and coordinate meaning;
- separate training objectives from inference interpretation;
- design the model and target runtime together.

That is the bridge between knowing model families and understanding how a real perception model is assembled.
