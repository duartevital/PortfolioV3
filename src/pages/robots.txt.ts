import type { APIRoute } from 'astro';
import { PUBLIC_SITE_URL } from 'astro:env/client';

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${PUBLIC_SITE_URL}/sitemap-index.xml
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
};
