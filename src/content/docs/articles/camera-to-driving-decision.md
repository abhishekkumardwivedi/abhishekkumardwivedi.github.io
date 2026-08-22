---
title: From Camera Frame to Driving Decision
description: A practical overview of perception, fusion, prediction, planning, and control in an autonomous-driving stack.
sidebar:
  order: 1
---

An autonomous-driving system does not convert a camera image directly into steering. It progressively transforms sensor observations into a model of the world, predicts how that world may change, selects a safe manoeuvre, and converts the manoeuvre into actuator commands.

## 1. Sensor acquisition

Cameras, radar, lidar, ultrasonic sensors, GNSS, and inertial sensors produce different observations of the same environment. Reliable timestamps and calibration are essential because fusion is meaningful only when the data refers to approximately the same place and time.

## 2. Perception

Perception answers questions such as:

- Where are the lanes and drivable surfaces?
- Which objects exist, and where are they?
- What do traffic lights and signs indicate?
- Which obstacles are static, and which are moving?

Multiple specialised models may contribute to a shared representation instead of one model owning every task.

## 3. Fusion and world modelling

Fusion combines complementary evidence. A camera provides rich semantics, radar measures relative velocity well, and lidar contributes accurate geometry. Tracking adds continuity across time, producing objects with position, velocity, uncertainty, and identity.

## 4. Prediction

Prediction estimates plausible future motion for vehicles, pedestrians, cyclists, and other agents. It usually produces multiple possibilities with confidence values because road users are not deterministic.

## 5. Planning

Planning is typically a combination of logic, optimisation, search, and learned components:

- **Route planning** chooses the broad road-level route.
- **Behaviour planning** selects actions such as follow, yield, stop, or change lane.
- **Motion planning** generates a collision-free, comfortable trajectory.

## 6. Control

The controller compares the planned trajectory with the vehicle’s measured state and continuously computes steering, braking, and propulsion requests. A safety supervisor checks limits, faults, and fallback conditions around this path.

## The key design idea

The output of every stage should include not only its best estimate but also quality and uncertainty. In safety-relevant systems, knowing when the system is unsure is as important as knowing what it sees.
