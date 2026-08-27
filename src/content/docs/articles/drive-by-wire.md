---
title: Drive-by-Wire Vehicle Platform
description: A hardware-focused research section covering the electrical, electronic, power and safety architecture required to execute autonomous vehicle motion.
---

This section documents the physical vehicle platform beneath autonomous driving intelligence.

The focus is deliberately different from **Autonomy & Edge AI**. That section covers perception, sensor fusion, prediction, planning and world models. This section covers the vehicle hardware and electrical architecture that turns motion intent into safe, deterministic vehicle actuation.

## Platform objective

The goal is a scalable Drive-by-Wire platform for an electric vehicle that can support **Level 2 and Level 3 autonomy initially**, while providing a credible architectural path toward **Level 4** through sensor and compute upgrades rather than a fundamental redesign of the vehicle execution layer.

The platform is designed around separation between high-level autonomous driving intelligence and the safety-oriented real-time execution domain.

## Core domains

1. **Vehicle E/E master architecture** — overall electrical and electronic topology.
2. **Steering-by-Wire** — steering command, actuator control, feedback and redundancy.
3. **Brake-by-Wire** — electro-hydraulic braking, wheel-level control and regenerative blending.
4. **Distributed propulsion** — traction inverters, motors, resolver feedback and torque control.
5. **HV battery and charging** — battery, BMS, contactors, charging and energy distribution.
6. **Fail-operational power** — independent power paths and degraded-operation strategy.
7. **Vehicle networking** — Automotive Ethernet, CAN-FD, gateways and zonal communication.
8. **Body and comfort systems** — BCM, lighting, HVAC, doors, wipers and related loads.
9. **Functional safety and degraded modes** — redundancy, fault handling and safe/fail-operational behaviour.

## Architectural principle

> **Autonomy decides what the vehicle should do; the Drive-by-Wire execution domain determines how the vehicle does it safely.**

The interface between the two domains is based on vehicle-motion intent and validated feedback rather than direct access from autonomous software to safety-critical actuators.

## Research roadmap

The platform will evolve from system architecture and simulation toward component selection, bench validation, vehicle integration and eventually autonomous operation on a physical EV platform.

More detailed architecture studies will be added here as the platform develops.
