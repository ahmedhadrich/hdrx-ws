import type { MetadataRoute } from 'next';
import { projects } from '@/content/projects';
import { site } from '@/content/copy';

export default function sitemap(): MetadataRoute.Sitemap {
  // Build time: the site only changes when it's redeployed
  const lastModified = new Date();
  return [
    { url: site.url, lastModified, changeFrequency: 'monthly', priority: 1 },
    ...projects
      .filter((p) => p.caseStudy)
      .map((p) => ({ url: `${site.url}/work/${p.slug}`, changeFrequency: 'yearly' as const, priority: 0.7 })),
  ];
}
