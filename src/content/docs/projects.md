---
title: Selected Projects
description: Selected automotive, edge AI, platform, robotics, and systems-engineering projects.
---

## Archonix

An AI-native digital engineering and systems-engineering platform for automotive and other complex cyber-physical products. It explores structured models, relationships, traceability, architecture views, deployment mapping, and ASPICE-oriented engineering workflows.

## Pebble — Expressive Desktop Robot

<div class="pebble-project-card">
  <div class="pebble-project-card-viewer">
    <iframe src="/pebble-viewer.html?compact=1" title="Interactive Pebble robot preview" loading="lazy"></iframe>
  </div>
  <div class="pebble-project-card-copy">
    <span class="pebble-kicker">ROBOTICS · CAD · EMBEDDED</span>
    <p>A compact expressive companion robot developed from a user-experience-first exterior toward real mechanism, battery, compute, structural and manufacturing constraints. Rotate the live engineering render, inspect the hidden four-bar mechanism, and follow the design as it moves from UX freeze to physical prototype.</p>
    <a class="pebble-project-link" href="/projects/pebble/">Explore Pebble →</a>
  </div>
</div>

## Autonomous-driving experimentation

A practical autonomous-vehicle software-in-the-loop environment combining multimodal sensors, perception models, bird’s-eye-view generation, fusion, planning concepts, and model-deployment pipelines. The focus is understanding how L2+/L4 architectures translate from diagrams into executable systems.

## Connected predictive-maintenance platform

An edge-to-cloud platform for vehicle and equipment telemetry, anomaly detection, remaining-useful-life estimation, diagnostics, and fleet visualisation. The project spans simulated fleets, MQTT ingestion, APIs, time-series data, dashboards, and real OBD-II integration.

## On-device Android assistant

An experimental privacy-focused assistant architecture for Android using wake-word detection, local intent inference, and safe device actions such as flashlight control. It explores the complete path from audio capture to heterogeneous on-device execution.

## Secure device identity

A platform design for provisioning and using device X.509 identity through Android Keystore and TEE-backed storage, including CSR generation, native services, HAL interfaces, secure persistence, and SELinux integration.

<style>
.pebble-project-card{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(15rem,.75fr);gap:1.15rem;align-items:stretch;margin:1rem 0 2rem;padding:.75rem;border:1px solid var(--sl-color-gray-5);border-radius:1rem;background:color-mix(in srgb,var(--sl-color-gray-6) 72%,transparent)}
.pebble-project-card-viewer{overflow:hidden;border:1px solid color-mix(in srgb,var(--sl-color-gray-4) 45%,transparent);border-radius:.8rem;background:#0b1220;box-shadow:0 18px 50px rgba(2,6,23,.18)}
.pebble-project-card-viewer iframe{display:block;width:100%;height:clamp(21rem,46vw,31rem);border:0;background:#0b1220}
.pebble-project-card-copy{display:flex;flex-direction:column;justify-content:center;padding:.75rem .75rem .75rem .25rem}
.pebble-project-card-copy p{margin:.7rem 0 1rem;color:var(--sl-color-gray-2);line-height:1.65}.pebble-kicker{color:var(--sl-color-accent);font-size:.72rem;font-weight:800;letter-spacing:.11em}.pebble-project-link{font-weight:700;text-decoration:none}
@media(max-width:48rem){.pebble-project-card{grid-template-columns:1fr}.pebble-project-card-copy{padding:.35rem .35rem .65rem}.pebble-project-card-viewer iframe{height:22rem}}
</style>
