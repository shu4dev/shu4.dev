---
title: Dishwasher loading
summary: A general-purpose robot manipulation policy for dishwasher tasks in NVIDIA Isaac Lab, with simulation assets I released publicly.
year: 2026
tags: [Isaac Lab, Manipulation, Robot learning]
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

I am developing a general-purpose robot manipulation policy for dishwasher tasks, simulated in NVIDIA Isaac Lab. This is my graduate research in the Cognitive Robot Autonomy and Learning (CoRAL) Lab at Purdue University, advised by Prof. Ahmed H. Qureshi.

The project is ongoing. This page covers only what is already public: the asset dataset on Hugging Face and the simulation repository with its figures.

## What I built

- **Simulation assets.** I released the dishwasher and dish assets, with their USD files, meshes and parameters, as a public Hugging Face dataset.
- **Simulation code.** The Isaac Lab simulation code is public on GitHub; the figures below come from its documentation.

<figure class="paper">
  <img src="/media/dishwasher/rack_geometry.webp" alt="Three views of the lower dishwasher rack with its cutlery basket, iso, top and side, with the rack's parts colour-coded by role: plate tines, bowl tines, floor wires, guard, handle and wheels." width="1400" height="478" loading="lazy" decoding="async" />
  <figcaption>Lower-rack geometry with the cutlery basket, from three views. Each part is labelled by its role.</figcaption>
</figure>

<figure class="paper">
  <img src="/media/dishwasher/object_library.webp" alt="One object-library entry: a mug shown from the top, front and an iso view, with its size in millimetres and its mass." width="1080" height="412" loading="lazy" decoding="async" />
  <figcaption>One entry in the object library: a mug, with its dimensions and mass.</figcaption>
</figure>

## Result

There are no results to report yet, because the work is still in progress. The public pieces are the asset dataset and the simulation code, both linked below.
