import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = (req.query.slug as string)
    || (req.url || '').split('/og/')[1]?.split('?')[0]
    || '';

  if (!slug) return res.status(400).send('College slug is required');

  const { data: college } = await supabase
    .from('colleges')
    .select('id, name')
    .eq('slug', slug.toLowerCase())
    .eq('is_active', true)
    .maybeSingle();

  if (!college) return res.status(404).send('College not found');

  const { data: settings } = await supabase
    .from('site_settings')
    .select('navbar_logo, loading_logo, institute_full_name, footer_tagline, contact_address')
    .eq('college_id', college.id)
    .maybeSingle();

  const siteUrl = `${process.env.FRONTEND_URL || 'https://college-managment-system-coral.vercel.app'}/${slug}`;
  const rawLogo = settings?.navbar_logo || settings?.loading_logo || `https://college-managment-system-coral.vercel.app/logo.png`;
  const logoUrl = rawLogo.split('?')[0]; // strip query params
  const title = settings?.institute_full_name || college.name;
  const description = settings?.footer_tagline 
    || `${title} - Digital Library Portal. Access books, notes, and resources.`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  
  return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${logoUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${siteUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${title}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${logoUrl}">

  <!-- Client-side Redirect for Real Users -->
  <script>window.location.replace('${siteUrl}');</script>
</head>
<body>
  <p>Redirecting to <a href="${siteUrl}">${title}</a>...</p>
</body>
</html>`);
}
