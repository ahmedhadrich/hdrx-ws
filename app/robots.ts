import type { MetadataRoute } from 'next';
import { site } from '@/content/copy';

export default function robots(): MetadataRoute.Robots {
  return {
    // /lab is a dev-only workbench (404 in production); keep crawlers off it anyway
    rules: { userAgent: '*', allow: '/', disallow: '/lab/' },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
