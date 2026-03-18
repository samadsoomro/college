import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url || '';

  // Health check
  if (path === '/api/health' || path.endsWith('/health')) {
    return res.json({
      status: 'ok',
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'MISSING',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING'
    });
  }

  // College branding — public route
  const collegeMatch = path.match(/\/api\/colleges\/([^\/]+)$/);
  if (collegeMatch && req.method === 'GET') {
    const slug = collegeMatch[1];
    const { data, error } = await supabase
      .from('colleges')
      .select('id, name, short_name, slug, storage_bucket, is_active')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'College not found' });
    return res.json({
      id: data.id,
      name: data.name,
      shortName: data.short_name,
      slug: data.slug,
      storageBucket: data.storage_bucket,
      isActive: data.is_active
    });
  }

  // All other routes — proxy to full Express handler
  try {
    // Dynamic import to avoid startup crash
    const expressHandler = await import('./express-handler');
    const app = await expressHandler.default();
    return app(req, res);
  } catch (err: any) {
    console.error('[ROUTE ERROR]', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
}
