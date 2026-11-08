import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import mermaid from 'astro-mermaid';

export default defineConfig({
  site: 'https://abhishekkumardwivedi.github.io',
  redirects: {
    '/about/': '/profile/about/',
    '/experience/': '/profile/experience/',
    '/articles/drive-by-wire/': '/articles/vehicle-platform/',
    '/articles/drive-by-wire-vehicle-ee-architecture/': '/articles/vehicle-platform/vehicle-ee-architecture/',
    '/articles/business-leadership/': '/articles/product-leadership/',
    '/articles/anatomy-of-a-perception-model/': '/articles/autonomy-edge-ai/anatomy-of-a-perception-model/',
    '/articles/bev-model-selection/': '/articles/autonomy-edge-ai/bev-model-selection/',
    '/articles/camera-to-driving-decision/': '/articles/autonomy-edge-ai/camera-to-driving-decision/',
    '/articles/event-camera-encoders/': '/articles/autonomy-edge-ai/event-camera-encoders/',
    '/articles/hd-maps-rtk-localization/': '/articles/autonomy-edge-ai/hd-maps-rtk-localization/',
    '/articles/imu-gnss-models/': '/articles/autonomy-edge-ai/imu-gnss-models/',
    '/articles/lidar-encoders/': '/articles/autonomy-edge-ai/lidar-encoders/',
    '/articles/math-behind-modern-ai/': '/articles/autonomy-edge-ai/math-behind-modern-ai/',
    '/articles/model-atlas-physical-ai/': '/articles/autonomy-edge-ai/model-atlas-physical-ai/',
    '/articles/nuscenes-autonomy-pipeline/': '/articles/autonomy-edge-ai/nuscenes-autonomy-pipeline/',
    '/articles/nuscenes-pipeline-stage2/': '/articles/autonomy-edge-ai/nuscenes-pipeline-stage2/',
    '/articles/nuscenes-pipeline-stage3/': '/articles/autonomy-edge-ai/nuscenes-pipeline-stage3/',
    '/articles/nuscenes-pipeline-stage4/': '/articles/autonomy-edge-ai/nuscenes-pipeline-stage4/',
    '/articles/pytorch-export-compile/': '/articles/autonomy-edge-ai/pytorch-export-compile/',
    '/articles/radar-encoders/': '/articles/autonomy-edge-ai/radar-encoders/',
    '/articles/rgb-camera-encoders/': '/articles/autonomy-edge-ai/rgb-camera-encoders/',
    '/articles/spatial-temporal-models/': '/articles/autonomy-edge-ai/spatial-temporal-models/',
    '/articles/ultrasonic-parking-models/': '/articles/autonomy-edge-ai/ultrasonic-parking-models/',
    '/articles/world-models/': '/articles/autonomy-edge-ai/world-models/',
    '/articles/aurix-vehicle-control/': '/articles/embedded-automotive/aurix-vehicle-control/',
    '/articles/qualcomm-camera-isp/': '/articles/embedded-automotive/qualcomm-camera-isp/',
    '/articles/qualcomm-display-dpu/': '/articles/embedded-automotive/qualcomm-display-dpu/',
    '/articles/qualcomm-dma-smmu/': '/articles/embedded-automotive/qualcomm-dma-smmu/',
    '/articles/qualcomm-dsp-domains/': '/articles/embedded-automotive/qualcomm-dsp-domains/',
    '/articles/qualcomm-npu-htp/': '/articles/embedded-automotive/qualcomm-npu-htp/',
    '/articles/qualcomm-soc-compute-map/': '/articles/embedded-automotive/qualcomm-soc-compute-map/',
    '/articles/qualcomm-trustzone-tee/': '/articles/embedded-automotive/qualcomm-trustzone-tee/',
    '/articles/automotive-ai-safety/': '/articles/safety-assurance/automotive-ai-safety/',
    '/articles/functional-safety-av/': '/articles/safety-assurance/functional-safety-av/',
    '/articles/sotif-autonomous-driving/': '/articles/safety-assurance/sotif-autonomous-driving/'
},
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
        SiteTitle: './src/components/SiteTitle.astro',
        Footer: './src/components/AuthorFab.astro'
      },
      sidebar: [
        { label: 'Profile', items: [
          { label: 'About Me', slug: 'profile/about' },
          { label: 'Experience', slug: 'profile/experience' },
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
                { label: 'nuScenes Autonomy Pipeline', slug: 'articles/autonomy-edge-ai/nuscenes-autonomy-pipeline' },
                { label: 'Stage 2: Sensor Playback & Sync', slug: 'articles/autonomy-edge-ai/nuscenes-pipeline-stage2' },
                { label: 'Stage 3: Camera Feature Encoding', slug: 'articles/autonomy-edge-ai/nuscenes-pipeline-stage3' },
                { label: 'Stage 4: Camera Spatial BEV', slug: 'articles/autonomy-edge-ai/nuscenes-pipeline-stage4' },
                { label: 'Math Behind Modern AI', slug: 'articles/autonomy-edge-ai/math-behind-modern-ai' },
                { label: 'Anatomy of a Perception Model', slug: 'articles/autonomy-edge-ai/anatomy-of-a-perception-model' },
                { label: 'Sensor Measurement to Vehicle Motion', slug: 'articles/autonomy-edge-ai/camera-to-driving-decision' },
                { label: 'Camera Encoder: ResNet-50 + FPN', slug: 'articles/autonomy-edge-ai/rgb-camera-encoders' },
                { label: 'Event Camera Encoders', slug: 'articles/autonomy-edge-ai/event-camera-encoders' },
                { label: 'LiDAR Encoders', slug: 'articles/autonomy-edge-ai/lidar-encoders' },
                { label: 'Radar Encoders', slug: 'articles/autonomy-edge-ai/radar-encoders' },
                { label: 'IMU & GNSS Models', slug: 'articles/autonomy-edge-ai/imu-gnss-models' },
                { label: 'HD Maps & RTK Localization', slug: 'articles/autonomy-edge-ai/hd-maps-rtk-localization' },
                { label: 'Ultrasonic Parking Models', slug: 'articles/autonomy-edge-ai/ultrasonic-parking-models' },
                { label: 'Spatial–Temporal Models', slug: 'articles/autonomy-edge-ai/spatial-temporal-models' },
                { label: 'BEV Model Selection', slug: 'articles/autonomy-edge-ai/bev-model-selection' },
                { label: 'World Models', slug: 'articles/autonomy-edge-ai/world-models' },
                { label: 'PyTorch Export & Compile', slug: 'articles/autonomy-edge-ai/pytorch-export-compile' },
                { label: 'Model Atlas for Physical AI', slug: 'articles/autonomy-edge-ai/model-atlas-physical-ai' }
              ]
            },
            {
              label: 'Drive-by-Wire Vehicle Platform',
              items: [
                { label: 'Section Overview', slug: 'articles/vehicle-platform' },
                { label: 'Vehicle E/E Master Architecture', slug: 'articles/vehicle-platform/vehicle-ee-architecture' }
              ]
            },
            {
              label: 'Embedded & Automotive',
              items: [
                { label: 'Section Overview', slug: 'articles/embedded-automotive' },
                { label: 'SoC Compute, Memory & Trust', slug: 'articles/embedded-automotive/qualcomm-soc-compute-map' },
                { label: 'Qualcomm DSP Domains', slug: 'articles/embedded-automotive/qualcomm-dsp-domains' },
                { label: 'TrustZone & the TEE', slug: 'articles/embedded-automotive/qualcomm-trustzone-tee' },
                { label: 'Hexagon NPU / HTP', slug: 'articles/embedded-automotive/qualcomm-npu-htp' },
                { label: 'Camera ISP Pipeline', slug: 'articles/embedded-automotive/qualcomm-camera-isp' },
                { label: 'Display Processing / DPU', slug: 'articles/embedded-automotive/qualcomm-display-dpu' },
                { label: 'DMA, SMMU & Shared Buffers', slug: 'articles/embedded-automotive/qualcomm-dma-smmu' },
                { label: 'AURIX Vehicle Control', slug: 'articles/embedded-automotive/aurix-vehicle-control' }
              ]
            },
            {
              label: 'Safety & Assurance',
              items: [
                { label: 'Section Overview', slug: 'articles/safety-assurance' },
                { label: 'SOTIF in Practice', slug: 'articles/safety-assurance/sotif-autonomous-driving' },
                { label: 'Functional Safety in Practice', slug: 'articles/safety-assurance/functional-safety-av' },
                { label: 'AI Safety in the Vehicle', slug: 'articles/safety-assurance/automotive-ai-safety' }
              ]
            },
            { label: 'Algorithms & Problem Solving', slug: 'articles/algorithms' },
            { label: 'Business, Product & Leadership', slug: 'articles/product-leadership' },
            { label: 'Personal Notes', slug: 'articles/notes' }
          ]
        }
      ]
    })
  ]
});
