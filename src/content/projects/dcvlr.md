---
title: DCVLR
summary: Data Curation for Visual Language Reasoning, a scalable pipeline that turns images into question–answer pairs with intermediate reasoning, and the public DCVLR_10K dataset.
year: 2025
tags: [VLM, Synthetic data, Data pipeline, Hugging Face dataset]
order: 4
hero:
  kind: svg
  src: /media/dcvlr/pipeline.svg
  alt: "Pipeline diagram in six stages. Source images, question synthesis and reasoning steps run down one column; answer, filter (which drops rejected samples) and the DCVLR_10K dataset of 10k samples run up the other, ending at the dataset."
links:
  - label: Code (shu4dev/DCVLR)
    href: https://github.com/shu4dev/DCVLR
  - label: Dataset (Hugging Face dataset shu4dev/DCVLR_10K)
    href: https://huggingface.co/datasets/shu4dev/DCVLR_10K
---

## What it is

DCVLR, short for Data Curation for Visual Language Reasoning, is about the training data rather than the model. The research question is whether synthetic reasoning-step data improves visual question answering (VQA) performance.

## What I built

- **The research question.** I formulated the question of whether synthetic reasoning-step data improves VQA performance, and partnered with teammates to iterate on the research design and critique results.
- **The data pipeline.** I built a scalable data pipeline that turns images into question–answer pairs with intermediate reasoning, in the stages shown in the diagram.

Running the pipeline produced DCVLR_10K, a dataset of 10,000 samples.

### What a sample looks like

<figure>
<pre><code>image      a photo of a desk with three pencils and two pens
question   How many writing tools are on the desk?
reasoning  1. Count the pencils: 3.
           2. Count the pens: 2.
           3. Add them: 3 + 2 = 5.
answer     5</code></pre>
<figcaption>Illustrative example of the format, written for this page. It is not a row from DCVLR_10K.</figcaption>
</figure>

Each real sample pairs an image and a question with a solution that carries the intermediate reasoning and the answer.

## Result

DCVLR_10K, 10,000 synthetic samples with reasoning steps, is public on Hugging Face, and the pipeline code is on GitHub. Both links are below.
