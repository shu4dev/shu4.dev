---
title: Fiatlux
summary: A long-horizon benchmark in which a simulated Unitree G1 humanoid climbs a ladder and replaces a light bulb, built in NVIDIA Isaac Lab.
year: 2026
tags: [Isaac Lab, Unitree G1, Benchmark, Domain randomization]
order: 1
status: Under review at IEEE ICRA 2027
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

Fiatlux is an NVIDIA Isaac Lab benchmark in which a Unitree G1 humanoid climbs a ladder to replace a bulb. In one episode the robot moves the ladder under the fixture, climbs it, removes the old bulb, descends with it, carries it to the disposal crate and drops it in, then approaches and grabs a new bulb, carries it to the ladder, climbs with it, screws it in and climbs down. The fixture sits above the robot's standing reach, so the episode cannot be completed without climbing.

The task is split into 12 subtask environments. Each is a registered environment whose start pose approximates the state its predecessor ends in, and each is scored on its own success gate.

<figure>
  <img src="/media/fiatlux/S01.jpg" alt="The G1 crouching beside an A-frame ladder and gripping it to move it under the ceiling fixture." width="900" height="566" loading="lazy" decoding="async" />
  <figcaption>S01, move ladder. Still from a teleoperated take that passes the subtask's success gate.</figcaption>
</figure>

The paper is under review at IEEE ICRA 2027. The four first authors, me among them, contributed equally and are listed alphabetically.

## What I built

I co-developed the benchmark as a student researcher at the Hawaiʻi AI Initiative (HawAII), University of Hawaiʻi at Mānoa, advised by Prof. Igor Molybog.

- **The 12 subtask environments.** I split the task into 12 subtask environments with difficulty-weighted scoring and domain randomization over the scene layout, grip friction, lighting, material colours and the robot's start state. The 35 g bulb is fragile: an episode counts as broken if the peak contact force over both hands exceeds 50 N.
- **Baselines.** I released RSL-RL PPO and zero-shot GR00T N1.7 VLA baselines. None completes a single subtask.

<figure>
  <img src="/media/fiatlux/S08.jpg" alt="The G1 standing behind a workbench and reaching for the fresh bulb with one hand; storage crates sit under the table." width="900" height="566" loading="lazy" decoding="async" />
  <figcaption>S08, grab new bulb. Also from a teleoperated take.</figcaption>
</figure>

## Result

The benchmark ships 12 subtask environments, a G1 with 53 actuated degrees of freedom, a 50 N fragility bound on the bulb and 107 teleoperated takes. The released baselines complete no subtask. The paper, the project page with video, and the code are linked below.
