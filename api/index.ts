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
    const { data: college } = await supabase
      .from('colleges').select('id, name, short_name, slug, storage_bucket, is_active')
      .eq('slug', slug).eq('is_active', true).maybeSingle();
    if (!college) return res.status(404).json({ error: 'College not found' });

    const { data: settings } = await supabase
      .from('site_settings').select('*')
      .eq('college_id', college.id).maybeSingle();

    return res.json({
      id: college.id,
      name: college.name,
      shortName: college.short_name,
      slug: college.slug,
      storageBucket: college.storage_bucket,
      isActive: college.is_active,
      // Spread all settings fields for CollegeContext:
      primaryColor: settings?.primary_color || '#006600',
      instituteFullName: settings?.institute_full_name || college.name,
      instituteShortName: settings?.institute_short_name || college.short_name,
      footerTitle: settings?.footer_title || '',
      footerTagline: settings?.footer_tagline || '',
      navbarLogo: settings?.navbar_logo || null,
      loadingLogo: settings?.loading_logo || null,
      contactAddress: settings?.contact_address || '',
      contactPhone: settings?.contact_phone || '',
      contactEmail: settings?.contact_email || '',
      cardHeaderText: settings?.card_header_text || '',
      cardSubheaderText: settings?.card_subheader_text || '',
      cardLogoUrl: settings?.card_logo_url || null,
      cardQrEnabled: settings?.card_qr_enabled ?? true,
      cardQrUrl: settings?.card_qr_url || '',
      cardTermsText: settings?.card_terms_text || '',
      cardContactAddress: settings?.card_contact_address || '',
      cardContactEmail: settings?.card_contact_email || '',
      cardContactPhone: settings?.card_contact_phone || '',
      easypaisaNumber: settings?.easypaisa_number || '',
      bankAccountNumber: settings?.bank_account_number || '',
      bankName: settings?.bank_name || '',
      bankBranch: settings?.bank_branch || '',
    });
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

  // ── Public data routes ──────────────────────────────
  // Books
  const booksMatch = path.match(/\/api\/([^\/]+)\/books$/);
  if (booksMatch && req.method === 'GET') {
    const slug = booksMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('books').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
    return res.json(data || []);
  }

  // Rare books
  const rareBooksMatch = path.match(/\/api\/([^\/]+)\/rare-books$/);
  if (rareBooksMatch && req.method === 'GET') {
    const slug = rareBooksMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('rare_books').select('*').eq('college_id', col.id).eq('status', 'active');
    return res.json(data || []);
  }

  // Notes
  const notesMatch = path.match(/\/api\/([^\/]+)\/notes$/);
  if (notesMatch && req.method === 'GET') {
    const slug = notesMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('notes').select('*').eq('college_id', col.id).eq('status', 'active');
    return res.json(data || []);
  }

  // Blog posts
  const blogMatch = path.match(/\/api\/([^\/]+)\/blog$/);
  if (blogMatch && req.method === 'GET') {
    const slug = blogMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('blog_posts').select('*').eq('college_id', col.id).eq('status', 'published').order('created_at', { ascending: false });
    return res.json(data || []);
  }

  // Events
  const eventsMatch = path.match(/\/api\/([^\/]+)\/events$/);
  if (eventsMatch && req.method === 'GET') {
    const slug = eventsMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('events').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
    return res.json(data || []);
  }

  // Notifications
  const notifMatch = path.match(/\/api\/([^\/]+)\/notifications$/);
  if (notifMatch && req.method === 'GET') {
    const slug = notifMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('notifications').select('*').eq('college_id', col.id).eq('status', 'active');
    return res.json(data || []);
  }

  // Faculty
  const facultyMatch = path.match(/\/api\/([^\/]+)\/faculty$/);
  if (facultyMatch && req.method === 'GET') {
    const slug = facultyMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('faculty_staff').select('*').eq('college_id', col.id);
    return res.json(data || []);
  }

  // Principal
  const principalMatch = path.match(/\/api\/([^\/]+)\/principal$/);
  if (principalMatch && req.method === 'GET') {
    const slug = principalMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('principal').select('*').eq('college_id', col.id).maybeSingle();
    return res.json(data || {});
  }

  // Home data
  const homeMatch = path.match(/\/api\/([^\/]+)\/home$/);
  if (homeMatch && req.method === 'GET') {
    const slug = homeMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const [content, slider, stats, affiliations, buttons] = await Promise.all([
      supabase.from('home_content').select('*').eq('college_id', col.id).maybeSingle(),
      supabase.from('home_slider_images').select('*').eq('college_id', col.id).eq('is_active', true).order('order'),
      supabase.from('home_stats').select('*').eq('college_id', col.id).order('order'),
      supabase.from('home_affiliations').select('*').eq('college_id', col.id).eq('is_active', true).order('order'),
      supabase.from('home_buttons').select('*').eq('college_id', col.id)
    ]);
    return res.json({
      content: content.data || {},
      slider: slider.data || [],
      stats: stats.data || [],
      affiliations: affiliations.data || [],
      buttons: buttons.data || []
    });
  }

  // Site settings
  const settingsMatch = path.match(/\/api\/([^\/]+)\/settings$/);
  if (settingsMatch && req.method === 'GET') {
    const slug = settingsMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('site_settings').select('*').eq('college_id', col.id).maybeSingle();
    return res.json(data || {});
  }

  // Library card fields
  const cardFieldsMatch = path.match(/\/api\/([^\/]+)\/library-card-fields$/);
  if (cardFieldsMatch && req.method === 'GET') {
    const slug = cardFieldsMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('library_card_fields').select('*').eq('college_id', col.id).order('display_order');
    return res.json(data || []);
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
