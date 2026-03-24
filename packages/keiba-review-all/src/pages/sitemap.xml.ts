import type { APIRoute } from 'astro';
import { getSitesWithStats } from '@keiba-review/shared/lib';
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = import.meta.env.SITE_URL || 'https://frabjous-taiyaki-460401.netlify.app';

export const GET: APIRoute = async () => {
  // 承認済みサイトを取得
  const sites = await getSitesWithStats();

  // blog記事を取得
  const blogDir = path.resolve('./src/pages/blog');
  let blogSlugs: string[] = [];
  if (fs.existsSync(blogDir)) {
    blogSlugs = fs.readdirSync(blogDir)
      .filter(f => f.endsWith('.astro') && f !== 'index.astro')
      .map(f => f.replace('.astro', ''));
  }

  // 静的ページ
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/keiba-yosou/', priority: '0.9', changefreq: 'daily' },
    { url: '/keiba-yosou/nankan/', priority: '0.8', changefreq: 'daily' },
    { url: '/keiba-yosou/chuo/', priority: '0.8', changefreq: 'daily' },
    { url: '/keiba-yosou/chihou/', priority: '0.8', changefreq: 'daily' },
    { url: '/ranking/', priority: '0.9', changefreq: 'daily' },
    { url: '/ranking/chuo/', priority: '0.8', changefreq: 'daily' },
    { url: '/ranking/nankan/', priority: '0.8', changefreq: 'daily' },
    { url: '/ranking/chihou/', priority: '0.8', changefreq: 'daily' },
    { url: '/blog/', priority: '0.8', changefreq: 'weekly' },
    { url: '/faq/', priority: '0.7', changefreq: 'monthly' },
    { url: '/about/', priority: '0.5', changefreq: 'monthly' },
    { url: '/terms/', priority: '0.3', changefreq: 'yearly' },
    { url: '/privacy/', priority: '0.3', changefreq: 'yearly' },
    { url: '/contact/', priority: '0.5', changefreq: 'monthly' },
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
${sites
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
    <loc>${SITE_URL}/keiba-yosou/${site.slug}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
  )
  .join('\n')}
${blogSlugs
  .map(
    (slug) => `  <url>
    <loc>${SITE_URL}/blog/${slug}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
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
