import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import mermaid from 'astro-mermaid';

export default defineConfig({
  site: 'https://abhishekkumardwivedi.github.io',
  markdown: {
    processor: unified(),
  },
  integrations: [
    mermaid({
      theme: 'neutral',
    }),
    starlight({
      title: 'Abhishek Kumar Dwivedi',
      description: 'Embedded systems, automotive platforms, edge AI, and engineering leadership.',
      favicon: '/favicon.svg',
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/abhishekkumardwivedi'
        },
        {
          icon: 'linkedin',
          label: 'LinkedIn',
          href: 'https://www.linkedin.com/in/abhishekkumardwivedi/'
        }
      ],
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Profile', items: [
          { label: 'Home', slug: '' },
          { label: 'About Me', slug: 'about' },
          { label: 'Experience', slug: 'experience' },
          { label: 'Projects', slug: 'projects' }
        ]},
        {
          label: 'Articles',
          items: [{ autogenerate: { directory: 'articles' } }]
        }
      ]
    })
  ]
});
