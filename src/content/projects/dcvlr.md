---
title: DCVLR
summary: Data Curation for Visual-Language Reasoning, a pipeline that generates synthetic multimodal question-answer pairs with reasoning steps and uses them to fine-tune Qwen2.5-VL.
year: 2025
tags: [VLM, Synthetic data, Qwen2.5-VL, Fine-tuning]
order: 4
hero:
  kind: svg
  src: /media/dcvlr/pipeline.svg
  alt: "Pipeline diagram in seven stages. Source images, question synthesis, reasoning steps and answer run down one column; filter (which drops rejected samples), the DCVLR_10K dataset of 10k samples and fine-tuning run up the other, ending in a fine-tuned Qwen2.5-VL."
links:
  - label: Code (shu4dev/DCVLR)
    href: https://github.com/shu4dev/DCVLR
  - label: Dataset (Hugging Face dataset shu4dev/DCVLR_10K)
    href: https://huggingface.co/datasets/shu4dev/DCVLR_10K
---

## What it is

DCVLR, short for Data Curation for Visual-Language Reasoning, is about the training data rather than the model. A vision-language model can often produce the right answer about an image without working through the image at all. Training examples that spell out the intermediate steps give it something better to imitate.

So I built a pipeline that writes its own training set: synthetic question-answer pairs about images, each carrying the reasoning steps that lead from the image to the answer.

## What I built

The pipeline runs in the stages shown in the diagram:

1. Start from a pool of source images.
2. Synthesize a question about each image.
3. Generate the intermediate reasoning steps.
4. Generate the final answer.
5. Filter the generated samples.
6. Collect what passes into a dataset.
7. Fine-tune a model on that dataset.

Running it end to end produced DCVLR_10K, a dataset of 10,000 samples, and I fine-tuned Qwen2.5-VL on it.

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

Each real sample has the same parts: an image, a question about it, the steps in between, and the answer.

## Result

DCVLR_10K, 10,000 synthetic samples with reasoning steps, is public on Hugging Face, and the pipeline code is on GitHub. Qwen2.5-VL was fine-tuned on the dataset. Both links are below.
