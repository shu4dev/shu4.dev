---
title: Fiatlux
summary: A long-horizon benchmark in which a simulated Unitree G1 humanoid climbs a ladder and replaces a light bulb, built in NVIDIA Isaac Lab.
year: 2026
tags: [Isaac Lab, Unitree G1, Benchmark, USD assets]
order: 1
status: Under review at ICRA 2027
hero:
  kind: video
  src: /media/fiatlux/fiatlux-loop.mp4
  poster: /media/fiatlux/fiatlux-loop-poster.jpg
  alt: A simulated Unitree G1 humanoid standing on an A-frame ladder to reach a ceiling light fixture, and holding a light bulb beside the ladder.
links:
  - label: Paper (arXiv:2609.38216)
    href: https://arxiv.org/abs/2609.38216
  - label: Project page (fiatlux-bench.github.io)
    href: https://fiatlux-bench.github.io
  - label: Benchmark code (haw-ai-i/fiatlux)
    href: https://github.com/haw-ai-i/fiatlux
  - label: Environment code (shu4dev/fiatlux-env)
    href: https://github.com/shu4dev/fiatlux-env
---

## What it is

Changing a ceiling light is a small job for a person and a long one for a humanoid. Fiatlux turns it into a single task for a simulated Unitree G1 in NVIDIA Isaac Lab: move the ladder under the fixture, climb it, remove the old bulb, carry it down to the disposal crate, pick up a new bulb from the table, climb again holding it, screw it in and climb down. The fixture hangs above standing reach, so the robot cannot skip the ladder.

The task is split into 12 subtasks, each with its own environment, start state and success gate. A policy can be trained and scored on one subtask at a time, or run through the whole chain.

<figure>
  <img src="/media/fiatlux/S01.jpg" alt="The G1 crouching beside an A-frame ladder and gripping it to move it under the ceiling fixture." width="900" height="566" loading="lazy" decoding="async" />
  <figcaption>S01, move ladder. Still from a teleoperated take that passes the subtask's success gate.</figcaption>
</figure>

The paper is under review at IEEE ICRA 2027. The four first authors, me among them, contributed equally and are listed alphabetically.

## What I built

- **The 12 subtask environments.** Flat navigation, manipulation and climbing, each registered as its own Isaac Lab environment. Start states are chained, so a subtask begins in the state the previous one leaves behind. Every episode has a 120 s horizon, and success is a quantitative gate, not a judgement call. The bulb shows how strict that gets: the hand may press on the 35 g bulb with at most 50 N, or the attempt fails.
- **The scene hierarchy and asset pipeline.** One scene tree shared by all 12 subtasks, with a preset layout per task and domain randomization over layout, friction, lighting and materials. Objects come from an image-to-mesh pipeline that writes USD assets, and a structural verifier checks each asset before it goes into a scene.

<figure>
  <img src="/media/fiatlux/S08.jpg" alt="The G1 standing behind a workbench and reaching for the fresh bulb with one hand; storage crates sit under the table." width="900" height="566" loading="lazy" decoding="async" />
  <figcaption>S08, grab new bulb. Also from a teleoperated take.</figcaption>
</figure>

## Result

The benchmark ships 12 subtasks with one environment each, a G1 with 53 actuated degrees of freedom, a 50 N fragility bound on the bulb and 107 teleoperated takes. The paper, the project page with video, and the code are linked below.
