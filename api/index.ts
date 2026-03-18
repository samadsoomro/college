import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://collegewebsite-three-ruddy.vercel.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Cookie');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = (req.url || '').split('?')[0];

  // ── Health check ───────────────────────────────────
  if (path.endsWith('/health')) {
    return res.json({
      status: 'ok',
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'MISSING',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING'
    });
  }

  // ── Public college branding ─────────────────────────
  const collegeMatch = path.match(/\/api\/colleges\/([^\/\?]+)$/);
  if (collegeMatch && req.method === 'GET') {
    const slug = collegeMatch[1];
    const { data } = await supabase
      .from('colleges')
      .select('id, name, short_name, slug, storage_bucket, is_active')
      .eq('slug', slug).eq('is_active', true).maybeSingle();
    if (!data) return res.status(404).json({ error: 'College not found' });
    const { data: settings } = await supabase
      .from('site_settings')
      .select('*')
      .eq('college_id', data.id).maybeSingle();
    return res.json({ ...data, shortName: data.short_name, isActive: data.is_active, settings: settings || {} });
  }

  // ── Unified Login ────────────────────────────────────
  const loginMatch = path.match(/\/api\/([^\/]+)\/auth\/login$/);
  if (loginMatch && req.method === 'POST') {
    const collegeSlug = loginMatch[1];
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Step 1: Super admin
    const { data: superAdmin } = await supabase
      .from('admin_credentials')
      .select('*').eq('admin_email', email).eq('role', 'developer').eq('is_active', true).maybeSingle();
    if (superAdmin) {
      const match = await bcrypt.compare(password, superAdmin.password_hash);
      if (match) return res.json({ redirect: '/super-admin/dashboard', role: 'superadmin' });
    }

    // Step 2: College admin
    const { data: college } = await supabase
      .from('colleges').select('id, slug').eq('slug', collegeSlug).eq('is_active', true).maybeSingle();
    if (!college) return res.status(404).json({ error: 'College not found' });

    const { data: admin } = await supabase
      .from('admin_credentials').select('*')
      .eq('admin_email', email).eq('role', 'client_admin')
      .eq('college_id', college.id).eq('is_active', true).maybeSingle();
    if (admin) {
      const match = await bcrypt.compare(password, admin.password_hash);
      if (match) return res.json({ redirect: `/${collegeSlug}/admin-dashboard`, role: 'admin', collegeId: college.id, collegeSlug });
    }

    // Step 3: Regular user
    const { data: user } = await supabase
      .from('users').select('*').eq('email', email).eq('college_id', college.id).maybeSingle();
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (match) return res.json({ redirect: `/${collegeSlug}`, role: 'user', userId: user.id });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // ── Check email availability ─────────────────────────
  const emailCheckMatch = path.match(/\/api\/([^\/]+)\/auth\/check-email$/);
  if (emailCheckMatch && req.method === 'GET') {
    const collegeSlug = emailCheckMatch[1];
    const email = (req.query?.email as string) || '';
    const { data: college } = await supabase.from('colleges').select('id').eq('slug', collegeSlug).maybeSingle();
    if (!college) return res.json({ available: true });
    const { data: user } = await supabase.from('users').select('id').eq('email', email).eq('college_id', college.id).maybeSingle();
    return res.json({ available: !user });
  }

  // ── Register ─────────────────────────────────────────
  const registerMatch = path.match(/\/api\/([^\/]+)\/auth\/register$/);
  if (registerMatch && req.method === 'POST') {
    const collegeSlug = registerMatch[1];
    const { email, password, fullName, phone, classification } = req.body || {};
    if (!email || !password || !fullName) return res.status(400).json({ error: 'Missing required fields' });
    const { data: college } = await supabase.from('colleges').select('id').eq('slug', collegeSlug).maybeSingle();
    if (!college) return res.status(404).json({ error: 'College not found' });
    const existing = await supabase.from('users').select('id').eq('email', email).eq('college_id', college.id).maybeSingle();
    if (existing.data) return res.status(400).json({ error: 'Email already registered' });
    const hashedPw = await bcrypt.hash(password, 10);
    const { data: newUser, error } = await supabase.from('users')
      .insert({ email, password: hashedPw, college_id: college.id }).select('id, email').single();
    if (error) return res.status(500).json({ error: error.message });
    await supabase.from('profiles').insert({ user_id: newUser.id, full_name: fullName, phone, role: classification || 'visitor', college_id: college.id });
    return res.json({ user: { id: newUser.id, email: newUser.email }, redirect: `/${collegeSlug}` });
  }

  // ── Auth me ───────────────────────────────────────────
  const authMeMatch = path.match(/\/api\/([^\/]+)\/auth\/me$/);
  if (authMeMatch && req.method === 'GET') {
    // Sessions don't persist on serverless — return not authenticated
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // ── All other routes — return 404 for now ─────────────
  return res.status(404).json({ error: 'Route not found', path });
}
