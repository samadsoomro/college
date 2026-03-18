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
      if (match) return res.json({ redirect: `/${collegeSlug}`, role: 'user', userId: user.id, collegeSlug });
    }

    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // ── Public data routes ──────────────────────────────
  // Books route — map fields
  const booksMatch = path.match(/\/api\/([^\/]+)\/books$/);
  if (booksMatch && req.method === 'GET') {
    const slug = booksMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('books').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
    return res.json((data || []).map((b: any) => ({
      id: b.id,
      bookName: b.book_name,
      authorName: b.author_name,
      shortIntro: b.short_intro,
      description: b.description,
      bookImage: b.book_image,
      totalCopies: b.total_copies,
      availableCopies: b.available_copies,
      createdAt: b.created_at
    })));
  }

  // Rare books route — map fields
  const rareBooksMatch = path.match(/\/api\/([^\/]+)\/rare-books$/);
  if (rareBooksMatch && req.method === 'GET') {
    const slug = rareBooksMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('rare_books').select('*').eq('college_id', col.id).eq('status', 'active');
    return res.json((data || []).map((b: any) => ({
      id: b.id, title: b.title, description: b.description,
      category: b.category, pdfPath: b.pdf_path,
      coverImage: b.cover_image, status: b.status,
      createdAt: b.created_at
    })));
  }

  // Notes route — map fields
  const notesMatch = path.match(/\/api\/([^\/]+)\/notes$/);
  if (notesMatch && req.method === 'GET') {
    const slug = notesMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('notes').select('*').eq('college_id', col.id).eq('status', 'active');
    return res.json((data || []).map((n: any) => ({
      id: n.id, title: n.title, description: n.description,
      subject: n.subject, class: n.class,
      pdfPath: n.pdf_path, status: n.status,
      createdAt: n.created_at
    })));
  }

  // Blog list route
  const blogMatch = path.match(/\/api\/([^\/]+)\/blog$/);
  if (blogMatch && req.method === 'GET') {
    const slug = blogMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('blog_posts').select('*').eq('college_id', col.id).eq('status', 'published').order('created_at', { ascending: false });
    return res.json((data || []).map((p: any) => ({
      id: p.id, title: p.title, slug: p.slug,
      shortDescription: p.short_description, content: p.content,
      featuredImage: p.featured_image, isPinned: p.is_pinned,
      status: p.status, createdAt: p.created_at
    })));
  }

  // Blog single post route
  const blogPostMatch = path.match(/\/api\/([^\/]+)\/blog\/([^\/]+)$/);
  if (blogPostMatch && req.method === 'GET') {
    const slug = blogPostMatch[1];
    const postSlug = blogPostMatch[2];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('blog_posts').select('*').eq('slug', postSlug).eq('college_id', col.id).eq('status', 'published').maybeSingle();
    if (!data) return res.status(404).json({ error: 'Post not found' });
    return res.json({
      id: data.id, title: data.title, slug: data.slug,
      shortDescription: data.short_description, content: data.content,
      featuredImage: data.featured_image, createdAt: data.created_at
    });
  }

  // Events route — map fields
  const eventsMatch = path.match(/\/api\/([^\/]+)\/events$/);
  if (eventsMatch && req.method === 'GET') {
    const slug = eventsMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('events').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
    return res.json((data || []).map((e: any) => ({
      id: e.id, title: e.title, description: e.description,
      images: e.images || [], date: e.date,
      createdAt: e.created_at
    })));
  }

  // Notifications — map fields
  const notifMatch = path.match(/\/api\/([^\/]+)\/notifications$/);
  if (notifMatch && req.method === 'GET') {
    const slug = notifMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('notifications').select('*').eq('college_id', col.id).eq('status', 'active');
    return res.json((data || []).map((n: any) => ({
      id: n.id, title: n.title, message: n.message,
      image: n.image, pin: n.pin, status: n.status,
      createdAt: n.created_at
    })).sort((a: any, b: any) => a.pin ? -1 : 1));
  }

  // Faculty — map fields
  const facultyMatch = path.match(/\/api\/([^\/]+)\/faculty$/);
  if (facultyMatch && req.method === 'GET') {
    const slug = facultyMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('faculty_staff').select('*').eq('college_id', col.id);
    return res.json((data || []).map((f: any) => ({
      id: f.id, name: f.name, designation: f.designation,
      description: f.description, imageUrl: f.image_url,
      createdAt: f.created_at
    })));
  }

  // Principal — map fields
  const principalMatch = path.match(/\/api\/([^\/]+)\/principal$/);
  if (principalMatch && req.method === 'GET') {
    const slug = principalMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('principal').select('*').eq('college_id', col.id).maybeSingle();
    if (!data) return res.json({});
    return res.json({ id: data.id, name: data.name, message: data.message, imageUrl: data.image_url });
  }

  // History page
  const historyPageMatch = path.match(/\/api\/([^\/]+)\/history\/page$/);
  if (historyPageMatch && req.method === 'GET') {
    const slug = historyPageMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('college_history_page').select('*').eq('college_id', col.id).maybeSingle();
    return res.json(data || { title: 'History of College', subtitle: 'Our legacy' });
  }

  // History sections
  const historySectionsMatch = path.match(/\/api\/([^\/]+)\/history\/sections$/);
  if (historySectionsMatch && req.method === 'GET') {
    const slug = historySectionsMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('college_history_sections').select('*').eq('college_id', col.id).order('display_order');
    return res.json((data || []).map((s: any) => ({
      id: s.id, title: s.title, description: s.description,
      iconName: s.icon_name, imageUrl: s.image_url,
      layoutType: s.layout_type, displayOrder: s.display_order
    })));
  }

  // History gallery
  const historyGalleryMatch = path.match(/\/api\/([^\/]+)\/history\/gallery$/);
  if (historyGalleryMatch && req.method === 'GET') {
    const slug = historyGalleryMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('college_history_gallery').select('*').eq('college_id', col.id).order('display_order');
    return res.json((data || []).map((g: any) => ({
      id: g.id, imageUrl: g.image_url, caption: g.caption, displayOrder: g.display_order
    })));
  }

  // Home data route — map fields
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
      content: content.data ? {
        heroHeading: content.data.hero_heading,
        heroSubheading: content.data.hero_subheading,
        heroOverlayText: content.data.hero_overlay_text,
        featuresHeading: content.data.features_heading,
        affiliationsHeading: content.data.affiliations_heading,
        ctaHeading: content.data.cta_heading,
        ctaSubheading: content.data.cta_subheading,
      } : {},
      slider: (slider.data || []).map((s: any) => ({ id: s.id, imageUrl: s.image_url, order: s.order, isActive: s.is_active })),
      stats: (stats.data || []).map((s: any) => ({ id: s.id, label: s.label, number: s.number, icon: s.icon, iconUrl: s.icon_url, color: s.color })),
      affiliations: (affiliations.data || []).map((a: any) => ({ id: a.id, name: a.name, logoUrl: a.logo_url, link: a.link })),
      buttons: (buttons.data || []).map((b: any) => ({ id: b.id, section: b.section, text: b.text, link: b.link, isActive: b.is_active }))
    });
  }

  // Site settings route — map fields
  const settingsMatch = path.match(/\/api\/([^\/]+)\/settings$/);
  if (settingsMatch && req.method === 'GET') {
    const slug = settingsMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('site_settings').select('*').eq('college_id', col.id).maybeSingle();
    if (!data) return res.json({});
    return res.json({
      primaryColor: data.primary_color, navbarLogo: data.navbar_logo,
      instituteFullName: data.institute_full_name, instituteShortName: data.institute_short_name,
      footerTitle: data.footer_title, footerTagline: data.footer_tagline,
      contactAddress: data.contact_address, contactPhone: data.contact_phone, contactEmail: data.contact_email,
      mapEmbedUrl: data.map_embed_url, googleMapLink: data.google_map_link,
      cardHeaderText: data.card_header_text, cardSubheaderText: data.card_subheader_text,
      cardLogoUrl: data.card_logo_url, cardQrEnabled: data.card_qr_enabled,
      cardQrUrl: data.card_qr_url, cardTermsText: data.card_terms_text,
      cardContactAddress: data.card_contact_address, cardContactEmail: data.card_contact_email,
      cardContactPhone: data.card_contact_phone, easypaisaNumber: data.easypaisa_number,
      bankAccountNumber: data.bank_account_number, bankName: data.bank_name, bankBranch: data.bank_branch,
      rbWatermarkText: data.rb_watermark_text, rbWatermarkEnabled: data.rb_watermark_enabled,
      rbDisclaimerText: data.rb_disclaimer_text
    });
  }

  // Library card fields route — map fields
  const cardFieldsMatch = path.match(/\/api\/([^\/]+)\/library-card-fields$/);
  if (cardFieldsMatch && req.method === 'GET') {
    const slug = cardFieldsMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase.from('library_card_fields').select('*').eq('college_id', col.id).order('display_order');
    return res.json((data || []).map((f: any) => ({
      id: f.id, fieldLabel: f.field_label, fieldKey: f.field_key,
      fieldType: f.field_type, isRequired: f.is_required,
      showOnForm: f.show_on_form, showOnCard: f.show_on_card,
      showInAdmin: f.show_in_admin, displayOrder: f.display_order,
      options: f.options
    })));
  }

  // Rare books STREAM route
  const rareStreamMatch = path.match(/\/api\/([^\/]+)\/rare-books\/stream\/([^\/]+)$/);
  if (rareStreamMatch && req.method === 'GET') {
    const slug = rareStreamMatch[1];
    const id = rareStreamMatch[2];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const { data: book } = await supabase.from('rare_books').select('pdf_path').eq('id', id).eq('college_id', col.id).eq('status', 'active').maybeSingle();
    if (!book || !book.pdf_path) return res.status(404).json({ error: 'PDF not found' });
    // Redirect to the Supabase storage URL directly
    res.setHeader('Location', book.pdf_path);
    return res.status(302).end();
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
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // ── All other routes — return 404 for now ─────────────
  return res.status(404).json({ error: 'Route not found', path });
}
