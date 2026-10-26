---
title: Dishwasher loading
summary: A general dishwasher-loading manipulation policy in NVIDIA Isaac Lab, built on simulated dish assets I released publicly.
year: 2026
tags: [Isaac Lab, Manipulation, Planning, Imitation learning]
order: 2
status: In progress
hero:
  kind: image
  src: /media/dishwasher/loaded_iso.webp
  alt: Isometric render of the simulated dishwasher with its door open and both racks pulled out, loaded with cups, a red mug and red bowls, with a cutlery basket in the lower rack.
links:
  - label: Dish assets (Hugging Face dataset shu4dev/dishsim-assets)
    href: https://huggingface.co/datasets/shu4dev/dishsim-assets
  - label: Simulation code and figures (shu4dev/dishwasher_sim_isaaclab)
    href: https://github.com/shu4dev/dishwasher_sim_isaaclab
---

## What it is

Loading a dishwasher looks routine, but for a robot it is a long chain of decisions: which dish to pick next, which rack and slot it belongs in, how to grasp it, and how to set it down without blocking the dishes that still have to go in. I am building a general dishwasher-loading manipulation policy in NVIDIA Isaac Lab. This is my graduate research in the Cognitive Robot Autonomy & Learning (CoRAL) Lab at Purdue, advised by Prof. Ahmed H. Qureshi.

The project is ongoing. This page covers only what is already public: the dish asset dataset on Hugging Face and the simulation repository with its figures.

## What I built

- **Simulated dish assets.** I released the dishes as a public Hugging Face dataset, so the objects can be used outside the lab.
- **A load-quality score.** A scoring function rates how well a rack is loaded, and it serves as the task reward.
- **A dish-placement dependency graph.** It captures how placements depend on one another, and the loading planner uses it as a heuristic.
- **Planner and motion generation, in progress.** I am now developing the loading planner and the robot's motion generation.

<figure class="paper">
  <img src="/media/dishwasher/rack_geometry.webp" alt="Three views of the lower dishwasher rack with its cutlery basket, iso, top and side, with the rack's parts colour-coded by role: plate tines, bowl tines, floor wires, guard, handle and wheels." width="1400" height="478" loading="lazy" decoding="async" />
  <figcaption>Lower-rack geometry with the cutlery basket, from three views. Each part is labelled by its role.</figcaption>
</figure>

<figure class="paper">
  <img src="/media/dishwasher/object_library.webp" alt="One object-library entry: a mug shown from the top, front and an iso view, with its size in millimetres and its mass." width="1080" height="412" loading="lazy" decoding="async" />
  <figcaption>One entry in the object library: a mug, with its dimensions and mass.</figcaption>
</figure>

<figure class="paper">
  <img src="/media/dishwasher/slot_detection.webp" alt="Top-down plot in the robot-base frame: the robot base at the origin, a dashed circle for the arm's 0.85 m reach, and the lower rack's wires with three numbered slots marked inside the reach." width="818" height="810" loading="lazy" decoding="async" />
  <figcaption>Slots derived on the lower rack, plotted in the robot-base frame against the arm's 0.85 m reach.</figcaption>
</figure>

## Result

There are no results to report yet, because the work is still in progress. The public pieces are the dish asset dataset and the simulation code, both linked below; the figures above come from that repository's documentation: the rack model, one object-library entry, and the rack slots within the arm's reach. Next, demonstrations from the planner will seed an imitation-learning policy.
