import type { APIRoute } from 'astro';
import { getSitesByCategory, sortByRankingScore } from '@keiba-review/shared/lib';

const SITE_URL = import.meta.env.SITE_URL || 'https://nankan.keiba-review.jp';

export const GET: APIRoute = async () => {
  // 南関カテゴリのサイトを取得
  const sites = await getSitesByCategory('nankan');
  const rankedSites = sortByRankingScore(sites);

  // 静的ページ
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/sites/', priority: '0.9', changefreq: 'daily' },
    { url: '/about/', priority: '0.5', changefreq: 'monthly' },
    { url: '/contact/', priority: '0.5', changefreq: 'monthly' },
    { url: '/terms/', priority: '0.3', changefreq: 'yearly' },
    { url: '/privacy/', priority: '0.3', changefreq: 'yearly' },
  ];

  // XMLを生成
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
${rankedSites
  .map(
    (site) => {
      // 日付のバリデーション
      let lastmod: string;
      try {
        if (site.createdAt) {
          const date = new Date(site.createdAt);
          if (!isNaN(date.getTime())) {
            lastmod = date.toISOString().split('T')[0];
          } else {
            lastmod = new Date().toISOString().split('T')[0];
          }
        } else {
          lastmod = new Date().toISOString().split('T')[0];
        }
      } catch {
        lastmod = new Date().toISOString().split('T')[0];
      }

      return `  <url>
    <loc>${SITE_URL}/sites/${site.slug}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
