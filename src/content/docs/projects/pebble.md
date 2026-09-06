---
title: Pebble — Expressive Desktop Robot
description: A compact expressive robot project combining user-experience-first industrial design, CAD, mechanism design, simulation, embedded electronics, and motion.
---

<div class="pebble-project-hero">
  <div class="pebble-project-copy">
    <span class="pebble-kicker">ROBOTICS · CAD · EMBEDDED SYSTEMS</span>
    <h2>Designing personality around real engineering constraints.</h2>
    <p>Pebble is an expressive desktop companion robot being developed from the outside in: first freezing the character, shell and visible motion language, then fitting the hard constraints—battery, motors, compute, display/camera and structure—inside that experience.</p>
    <div class="pebble-actions">
      <a href="https://github.com/abhishekkumardwivedi/pebble_sim" target="_blank" rel="noreferrer">Engineering repository ↗</a>
      <a href="#engineering-model">Explore the model ↓</a>
    </div>
  </div>
</div>

<div class="pebble-viewer-shell" id="engineering-model">
  <iframe src="/pebble-viewer.html" title="Interactive 3D render of the Pebble robot" loading="eager" allowfullscreen></iframe>
</div>

The interactive render above is generated from the **Pebble V3-D dimensional definition** rather than from a generic robot illustration. It follows the current UX-freeze candidate: approximately **165 mm body width**, **150 mm depth**, a **138 mm shell crown**, and **170 mm overall height including antenna tips**.

## Why Pebble exists

Pebble is a user-experience-first robotics project. The intent is not simply to package electronics into a shell; the mechanical architecture must preserve the soft, compact character of the concept while still enabling expressive body and foot motion.

That creates a useful systems-engineering problem: industrial design, mechanism sweep, component keep-outs, structural load paths, embedded control and manufacturability all compete for the same small volume.

## Current design direction

- **Soft pebble shell:** a continuously curved body, widest around the lower-middle rather than a rounded rectangular enclosure.
- **Organic glossy face:** the visor is treated as a second pebble nested into the shell, not as a conventional rectangular display cutout.
- **Character antennae:** the stalks and illuminated tips are part of the expression language rather than decorative afterthoughts.
- **Tucked pebble feet:** visible feet stay soft and compact while the real linkage remains largely concealed inside the shell.
- **Four-bar leg mechanism:** compact crank/coupler/rocker geometry is being evaluated for motion range, packaging and expressive poses.

## Engineering workflow

```mermaid
flowchart LR
    A[Concept & expression] --> B[Exterior UX freeze]
    B --> C[Leg sweep & exit pockets]
    C --> D[Hard component keep-outs]
    D --> E[Internal skeleton]
    E --> F[Motion simulation]
    F --> G[Prototype & iterate]
```

The current rule is deliberate: **do not change the exterior merely to make packaging easier**. The shell should move only when a hard engineering conflict is demonstrated. This keeps the intended user experience authoritative while the internal architecture evolves.

## What is being engineered

| Area | Current focus |
| --- | --- |
| Exterior | V3-D shell and visor proportions; UX-freeze candidate |
| Legs | Four-bar kinematics, swept volumes, hidden linkage packaging |
| Actuation | Compact geared motor placement and linkage load paths |
| Electronics | Battery, MCU/compute, display/camera, power and audio keep-outs |
| Structure | Internal skeleton around the frozen exterior |
| Motion | Expressive poses first; dynamics and stability validation after geometry |
| Manufacturing | FreeCAD/CadQuery/STEP-oriented workflow for prototype-ready geometry |

## Model controls

Use **drag** to rotate, **wheel/pinch** to zoom, and the view buttons for front, side, top and isometric views. **Mechanism** makes the shell translucent and reveals the current four-bar linkage concept.

> Pebble is an active engineering project. The 3D view represents the current V3-D UX geometry baseline and will evolve as swept-volume, hard-packaging and structural validation progress.

<style>
.pebble-project-hero{margin:.25rem 0 1rem;padding:clamp(1rem,4vw,2rem);border:1px solid var(--sl-color-gray-5);border-radius:1rem;background:linear-gradient(135deg,color-mix(in srgb,var(--sl-color-accent-low) 60%,transparent),color-mix(in srgb,var(--sl-color-gray-6) 78%,transparent))}.pebble-project-copy{max-width:50rem}.pebble-project-copy h2{margin:.55rem 0 .65rem;max-width:22ch;font-size:clamp(1.55rem,4vw,2.45rem);line-height:1.05;letter-spacing:-.035em}.pebble-project-copy p{max-width:64ch;color:var(--sl-color-gray-2);line-height:1.7}.pebble-kicker{color:var(--sl-color-accent);font-size:.72rem;font-weight:800;letter-spacing:.11em}.pebble-actions{display:flex;flex-wrap:wrap;gap:.7rem 1rem;margin-top:1rem}.pebble-actions a{font-weight:700;text-decoration:none}.pebble-viewer-shell{overflow:hidden;margin:1rem 0 1.4rem;border:1px solid color-mix(in srgb,var(--sl-color-gray-4) 45%,transparent);border-radius:.8rem;background:#0b1220;box-shadow:0 18px 50px rgba(2,6,23,.18)}.pebble-viewer-shell iframe{display:block;width:100%;height:clamp(28rem,67vw,44rem);border:0;background:#0b1220}@media(max-width:48rem){.pebble-viewer-shell iframe{height:34rem}}
</style>
