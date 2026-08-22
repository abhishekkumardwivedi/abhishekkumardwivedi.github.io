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
      enableLog: false,
      mermaidConfig: {
        flowchart: {
          diagramPadding: 8,
          nodeSpacing: 24,
          rankSpacing: 30,
          padding: 10,
          useMaxWidth: true,
        },
        state: {
          nodeSpacing: 22,
          rankSpacing: 30,
          padding: 8,
          useMaxWidth: true,
        },
      },
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
      components: {
        SiteTitle: './src/components/SiteTitle.astro'
      },
      sidebar: [
        { label: 'Profile', items: [
          { label: 'Home', slug: '' },
          { label: 'About Me', slug: 'about' },
          { label: 'Experience', slug: 'experience' },
          { label: 'Projects', slug: 'projects' }
        ]},
        {
          label: 'Article Library',
          items: [
            { label: 'All Articles', slug: 'articles' },
            {
              label: 'Autonomy & Edge AI',
              items: [
                { label: 'Section Overview', slug: 'articles/autonomy-edge-ai' },
                { label: 'Math Behind Modern AI', slug: 'articles/math-behind-modern-ai' },
                { label: 'Anatomy of a Perception Model', slug: 'articles/anatomy-of-a-perception-model' },
                { label: 'Camera Frame to Driving Decision', slug: 'articles/camera-to-driving-decision' },
                { label: 'RGB Camera Encoders', slug: 'articles/rgb-camera-encoders' },
                { label: 'Event Camera Encoders', slug: 'articles/event-camera-encoders' },
                { label: 'LiDAR Encoders', slug: 'articles/lidar-encoders' },
                { label: 'Radar Encoders', slug: 'articles/radar-encoders' },
                { label: 'IMU & GNSS Models', slug: 'articles/imu-gnss-models' },
                { label: 'Ultrasonic Parking Models', slug: 'articles/ultrasonic-parking-models' },
                { label: 'Spatial–Temporal Models', slug: 'articles/spatial-temporal-models' },
                { label: 'BEV Model Selection', slug: 'articles/bev-model-selection' },
                { label: 'World Models', slug: 'articles/world-models' },
                { label: 'PyTorch Export & Compile', slug: 'articles/pytorch-export-compile' }
              ]
            },
            {
              label: 'Embedded & Automotive',
              items: [
                { label: 'Section Overview', slug: 'articles/embedded-automotive' },
                { label: 'AURIX Vehicle Control', slug: 'articles/aurix-vehicle-control' }
              ]
            },
            {
              label: 'Safety & Assurance',
              items: [
                { label: 'Section Overview', slug: 'articles/safety-assurance' },
                { label: 'SOTIF in Practice', slug: 'articles/sotif-autonomous-driving' },
                { label: 'Functional Safety in Practice', slug: 'articles/functional-safety-av' },
                { label: 'AI Safety in the Vehicle', slug: 'articles/automotive-ai-safety' }
              ]
            },
            { label: 'Algorithms & Problem Solving', slug: 'articles/algorithms' },
            { label: 'Business, Product & Leadership', slug: 'articles/business-leadership' }
          ]
        }
      ]
    })
  ]
});
