# abhishekkumardwivedi.github.io

Personal profile and technical knowledge site for Abhishek Kumar Dwivedi, built with Astro Starlight and published through GitHub Pages.

## Content structure

Most site content lives in Markdown under `src/content/docs/`.

```text
src/content/docs/
├── index.md                    # Home page
├── profile/
│   ├── about.md                # About and career timeline
│   └── experience.md           # Professional experience
├── projects/
│   ├── index.md                # Projects landing page
│   └── pebble.md               # Individual project pages
└── articles/
    ├── index.md                # Knowledge library landing page
    ├── autonomy-edge-ai/       # Autonomy, perception, BEV and model deployment
    ├── embedded-automotive/    # SoC, Qualcomm, embedded and automotive compute
    ├── safety-assurance/       # Functional safety, SOTIF and AI safety
    ├── vehicle-platform/       # Vehicle E/E and drive-by-wire architecture
    ├── algorithms/             # Algorithms and problem solving
    ├── product-leadership/     # Product, business and leadership
    └── notes/                  # Personal notes
```

Use `index.md` inside a folder for that section's landing page. Keep each substantial article in its own `.md` or `.mdx` file. Project pages follow the same pattern.

## Add or update content

1. Open the relevant folder in GitHub.
2. Create or edit the Markdown file.
3. Add a title and description in YAML frontmatter.
4. Commit to `main`; GitHub Actions builds and publishes the site.

The sidebar is currently configured in `astro.config.mjs`. When adding a new article, add its sidebar entry there as well. Moving content into folders is now complete; the next planned improvement is to make navigation and article grouping derive from Markdown metadata so routine publishing will not require editing the Astro configuration.

## Local development

```sh
npm install
npm run dev
npm run build
```
