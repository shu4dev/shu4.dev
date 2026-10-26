import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    // one line, shown in the project list and used as the page meta description
    summary: z.string(),
    year: z.coerce.string(),
    tags: z.array(z.string()),
    // ascending sort key for the home list and the "Next project" link
    order: z.number(),
    hero: z.object({
      kind: z.enum(['video', 'image', 'svg']),
      // path under public/, e.g. /media/fiatlux/fiatlux.mp4
      src: z.string(),
      // video only: still shown before playback and under reduced motion
      poster: z.string().optional(),
      alt: z.string(),
    }),
    links: z.array(z.object({ label: z.string(), href: z.string() })),
    status: z.string().optional(),
  }),
});

export const collections = { projects };
