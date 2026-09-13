---
title: Embedded & Automotive Systems
description: Vehicle compute, deterministic control, embedded platforms, hardware interfaces, and software-defined vehicle architecture.
---

This section connects software architecture to processors, operating systems, networks, sensors, actuators, timing, diagnostics, and physical constraints.

## Qualcomm automotive SoC series

Start with the [Qualcomm SoC Compute Map](/articles/qualcomm-soc-compute-map/), then use the focused articles:

1. [DSP Domains: ADSP, CDSP, SDSP and MDSP](/articles/qualcomm-dsp-domains/)
2. [TrustZone and the Trusted Execution Environment](/articles/qualcomm-trustzone-tee/)
3. [Hexagon NPU / HTP](/articles/qualcomm-npu-htp/)
4. [Camera ISP Pipeline](/articles/qualcomm-camera-isp/)
5. [Display Processing / DPU](/articles/qualcomm-display-dpu/)
6. [DMA, SMMU and Data Movement](/articles/qualcomm-dma-smmu/)

Each article uses an SA8295P-class digital-cockpit architecture as a concrete frame of reference while separating public architectural facts from product-specific implementation details. Each includes a small software simulation that runs on a normal PC without Qualcomm hardware or proprietary SDKs.

## Vehicle control and safety islands

1. [AURIX for Vehicle Control: Building a Deterministic Safety Island](/articles/aurix-vehicle-control/) — accepting motion requests, supervising them, and controlling actuators with deterministic timing and explicit fault reactions.

## Additional planned areas

- Android, AAOS, Embedded Linux, Yocto, BSP, QNX, and platform middleware
- Camera, display, audio, Bluetooth, Wi-Fi, CAN, Ethernet, SerDes, and sensor interfaces
- SDV architecture, diagnostics, OTA, security, partitioning, and mixed criticality
- Hardware bring-up, schematic interpretation, tracing, and system-level debugging

Safety arguments and assurance methods are maintained under [Safety & Assurance](/articles/safety-assurance/).
