---
title: Cable insertion
summary: A force-monitored expert policy and an imitation-learning pipeline for UR5e cable insertion, built for the AI for Industry Challenge.
year: 2026
tags: [ROS 2, Gazebo, LeRobot, ACT, Diffusion Policy]
order: 3
hero:
  kind: svg
  src: /media/cable-insertion/loop.svg
  alt: "Diagram of the expert's insertion-and-recovery loop: approach, then insert while watching force; if a jam is detected, back off and retry the insertion; if not, the connector is seated."
links:
  - label: Challenge toolkit fork (shu4dev/aic)
    href: https://github.com/shu4dev/aic
  - label: Sample demonstrations (Hugging Face dataset shu4dev/aic-cable-insertion_sample)
    href: https://huggingface.co/datasets/shu4dev/aic-cable-insertion_sample
---

## What it is

The AI for Industry Challenge, run by Intrinsic and Open Robotics, is a cable-insertion task: a UR5e arm in Gazebo, controlled through ROS 2, has to insert a cable connector.

I took the imitation-learning route: upgrade a privileged expert that solves the task, collect demonstrations from it, then train learned policies on those demonstrations.

## What I built

- **The expert policy.** I upgraded a privileged expert for UR5e cable insertion with force-monitored descent and jam recovery. The diagram on this page shows its insert-and-recover loop.
- **Demonstration collection.** I built a ROS 2/Gazebo demo-collection pipeline that runs on a Slurm cluster.
- **Data conversion.** I wrote a parallel converter from MCAP recordings to the LeRobot dataset format. A sample of the converted demonstrations is public on Hugging Face.
- **Learned policies.** I trained ACT and Diffusion Policy policies from the expert demonstrations with a DAgger-style approach.

## Result

The public pieces are the toolkit fork and a sample of the converted demonstrations, both linked below. There is no public video of the runs, so this page shows a diagram of the expert's loop instead.
