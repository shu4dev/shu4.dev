# shu4.dev

Brian Shu's personal site. Astro, static output, deployed on Cloudflare Pages (build `npm run build`, output `dist`).

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static site in dist/
npm run preview   # serve dist/
```

- Projects: `src/content/projects/*.md` (schema in `src/content.config.ts`), media in `public/media/<slug>/`.
- Layouts: `src/layouts/Base.astro` (document, header, footer, theme boot) and `src/layouts/Split.astro` (pinned panel + column).
- Theme tokens: `src/styles/global.css` on `:root` and `:root[data-theme="night"]`.
- CV: `public/cv.pdf` is a copy of `summer-2027-internships/resumes/Brian_Shu_CV_full.pdf`.
