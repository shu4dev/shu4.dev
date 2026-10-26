---
title: Cable insertion
summary: A force-monitored expert policy and an imitation-learning pipeline for cable insertion on a UR5, built for the AI for Industry Challenge.
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

The AI for Industry Challenge, run by Intrinsic and Open Robotics, poses an industrial assembly task: a UR5 arm in Gazebo, controlled through ROS 2, has to insert a cable connector. Insertion is contact-rich. A connector that arrives slightly off jams instead of sliding home, so a policy that only knows the clean path gets stuck the first time something goes wrong.

I took the imitation-learning route. First write an expert that solves the task with privileged access to the simulator, then record demonstrations from it, then train learned policies on those demonstrations.

## What I built

- **The expert policy.** A privileged "cheat-code" policy that inserts under force monitoring. When the force says the connector has jammed, it backs off and retries instead of pushing harder. The diagram on this page is that loop.
- **Demonstrations that include recovery.** I generated demonstrations with DART-style noise injection: noise pushes the expert off its nominal path while data is collected, the expert corrects, and the learner sees how to get back from states a clean expert would never visit.
- **Trial scenarios on a cluster.** I added 10 trial scenarios and ran them on a Slurm cluster.
- **Data conversion.** I wrote the converter from MCAP recordings to the LeRobot dataset format. A sample of the converted demonstrations is public on Hugging Face.
- **Learned policies.** I trained ACT and Diffusion Policy on the demonstrations with LeRobot.

## Result

The submission scored about 100 of 300 points in the Gazebo qualification stage. There is no public video of the runs, so this page shows a diagram of the expert's loop instead. The toolkit fork and the demonstration sample are linked below.
