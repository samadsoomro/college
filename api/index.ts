import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdminRequest(req: VercelRequest): boolean {
  const authHeader = req.headers['x-admin-token'] as string;
  return authHeader === process.env.ADMIN_API_TOKEN;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://collegewebsite-three-ruddy.vercel.app');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Cookie,x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = (req.url || '').split('?')[0];

  // ── Health check ───────────────────────────────────
  if (path.endsWith('/health')) {
    return res.json({ status: 'ok', supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'MISSING' });
  }

  // ── Admin Middleware (Simple) ──────────────────────
  const isAdmin = isAdminRequest(req);

  // ── Public college branding ─────────────────────────
  const collegeMatch = path.match(/\/api\/colleges\/([^\/\?]+)$/);
  if (collegeMatch && req.method === 'GET') {
    const slug = collegeMatch[1];
    const { data: college } = await supabase.from('colleges').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
    if (!college) return res.status(404).json({ error: 'College not found' });
    const { data: settings } = await supabase.from('site_settings').select('*').eq('college_id', college.id).maybeSingle();
    return res.json({
      id: college.id, name: college.name, shortName: college.short_name, slug: college.slug,
      primaryColor: settings?.primary_color || '#006600',
      instituteFullName: settings?.institute_full_name || college.name,
      instituteShortName: settings?.institute_short_name || college.short_name,
      navbarLogo: settings?.navbar_logo, loadingLogo: settings?.loading_logo,
      footerTitle: settings?.footer_title, footerTagline: settings?.footer_tagline,
      contactAddress: settings?.contact_address, contactPhone: settings?.contact_phone, contactEmail: settings?.contact_email
    });
  }

  // ── Unified Login ────────────────────────────────────
  const loginMatch = path.match(/\/api\/([^\/]+)\/auth\/login$/);
  if (loginMatch && req.method === 'POST') {
    const collegeSlug = loginMatch[1];
    const { email, password } = req.body || {};
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', collegeSlug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });

    // Try Admin
    const { data: admin } = await supabase.from('admin_credentials').select('*')
      .eq('admin_email', email).eq('college_id', col.id).eq('is_active', true).maybeSingle();
    if (admin && await bcrypt.compare(password, admin.password_hash)) {
      return res.json({ redirect: `/${collegeSlug}/admin-dashboard`, role: 'admin', userId: admin.id, collegeSlug });
    }

    // Try User
    const { data: user } = await supabase.from('users').select('*').eq('email', email).eq('college_id', col.id).maybeSingle();
    if (user && await bcrypt.compare(password, user.password)) {
      return res.json({ redirect: `/${collegeSlug}`, role: 'user', userId: user.id, collegeSlug });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // ── ADMIN WRITE ROUTES (PROTECTED) ───────────────────
  if (path.includes('/admin/') || path.includes('/contact-messages/') || path.includes('/book-borrows/')) {
    if (!isAdmin && req.method !== 'GET' && !path.endsWith('/contact-messages')) {
      return res.status(403).json({ error: 'Forbidden: Admin token required' });
    }
  }

  // ── Admin Settings (PATCH) ───────────────────────────
  const adminSettingsMatch = path.match(/\/api\/([^\/]+)\/admin\/settings$/);
  if (adminSettingsMatch && req.method === 'PATCH') {
    const slug = adminSettingsMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'College not found' });
    const updates: any = { updated_at: new Date().toISOString() };
    const fieldMap: any = {
      instituteFullName: 'institute_full_name',
      instituteShortName: 'institute_short_name',
      primaryColor: 'primary_color',
      navbarLogo: 'navbar_logo', loadingLogo: 'loading_logo',
      heroBackgroundLogo: 'hero_background_logo',
      heroBackgroundOpacity: 'hero_background_opacity',
      footerTitle: 'footer_title', footerDescription: 'footer_description',
      footerTagline: 'footer_tagline',
      facebookUrl: 'facebook_url', twitterUrl: 'twitter_url',
      instagramUrl: 'instagram_url', youtubeUrl: 'youtube_url',
      contactAddress: 'contact_address', contactPhone: 'contact_phone',
      contactEmail: 'contact_email', mapEmbedUrl: 'map_embed_url',
      googleMapLink: 'google_map_link',
      cardHeaderText: 'card_header_text', cardSubheaderText: 'card_subheader_text',
      cardLogoUrl: 'card_logo_url', cardQrEnabled: 'card_qr_enabled',
      cardQrUrl: 'card_qr_url', cardTermsText: 'card_terms_text',
      cardContactAddress: 'card_contact_address', cardContactEmail: 'card_contact_email',
      cardContactPhone: 'card_contact_phone',
      rbWatermarkText: 'rb_watermark_text', rbWatermarkOpacity: 'rb_watermark_opacity',
      rbDisclaimerText: 'rb_disclaimer_text', rbWatermarkEnabled: 'rb_watermark_enabled',
      easypaisaNumber: 'easypaisa_number', bankAccountNumber: 'bank_account_number',
      bankName: 'bank_name', bankBranch: 'bank_branch',
      accountTitle: 'account_title',
      creditsText: 'credits_text', contributorsText: 'contributors_text',
    };

    for (const [k, v] of Object.entries(req.body || {})) {
      let value = v;
      if (k === 'rbWatermarkOpacity' || k === 'heroBackgroundOpacity') value = parseFloat(v as string) || 0;
      const dbKey = fieldMap[k] || k;
      updates[dbKey] = value;
    }

    const { data: existing } = await supabase.from('site_settings').select('id').eq('college_id', col.id).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('site_settings').update(updates).eq('id', existing.id).eq('college_id', col.id);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      updates.college_id = col.id;
      const { error } = await supabase.from('site_settings').insert(updates);
      if (error) return res.status(500).json({ error: error.message });
    }
    return res.json({ success: true });
  }

  // ── Admin Notifications (POST/PATCH/DELETE) ──────────
  const adminNotifMatch = path.match(/\/api\/([^\/]+)\/admin\/notifications(?:\/([^\/]+))?$/);
  if (adminNotifMatch) {
    const [_, slug, id] = adminNotifMatch;
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (req.method === 'POST') {
      const { title, message, pin } = req.body;
      const { data } = await supabase.from('notifications').insert({ title, message, pin: !!pin, college_id: col!.id }).select().single();
      return res.json(data);
    }
    if (req.method === 'PATCH' && id) {
      if (path.endsWith('/status')) await supabase.from('notifications').update({ status: req.body.status }).eq('id', id);
      else if (path.endsWith('/pin')) await supabase.from('notifications').update({ pin: req.body.pin }).eq('id', id);
      return res.json({ success: true });
    }
    if (req.method === 'DELETE' && id) {
      await supabase.from('notifications').delete().eq('id', id);
      return res.json({ success: true });
    }
  }

  // ── Admin Home Slider (POST/PATCH/DELETE) ────────────
  const adminHomeSliderMatch = path.match(/\/api\/([^\/]+)\/admin\/home\/slider(?:\/([^\/]+))?$/);
  if (adminHomeSliderMatch) {
    const [_, slug, id] = adminHomeSliderMatch;
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (req.method === 'POST') {
      const { imageUrl } = req.body;
      const { data: currentImages } = await supabase.from('home_slider_images').select('display_order').eq('college_id', col!.id);
      const nextOrder = (currentImages?.length || 0);
      const { data } = await supabase.from('home_slider_images').insert({ image_url: imageUrl, display_order: nextOrder, college_id: col!.id }).select().single();
      return res.json(data);
    }
    if (req.method === 'PATCH' && id) {
      const { isActive, order } = req.body;
      const updates: any = {};
      if (isActive !== undefined) updates.is_active = isActive;
      if (order !== undefined) updates.display_order = order;
      await supabase.from('home_slider_images').update(updates).eq('id', id);
      return res.json({ success: true });
    }
    if (req.method === 'DELETE' && id) {
      await supabase.from('home_slider_images').delete().eq('id', id);
      return res.json({ success: true });
    }
  }

  // ── Admin Home Affiliations (POST/PATCH/DELETE) ──────
  const adminAffilMatch = path.match(/\/api\/([^\/]+)\/admin\/home\/affiliations(?:\/([^\/]+))?$/);
  if (adminAffilMatch) {
    const [_, slug, id] = adminAffilMatch;
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (req.method === 'POST') {
      const { name, link, logoUrl } = req.body;
      const { data } = await supabase.from('affiliations').insert({ name, link, logo_url: logoUrl, college_id: col!.id }).select().single();
      return res.json(data);
    }
    if (req.method === 'PATCH' && id) {
      const { isActive, order } = req.body;
      const updates: any = {};
      if (isActive !== undefined) updates.is_active = isActive;
      if (order !== undefined) updates.display_order = order;
      await supabase.from('affiliations').update(updates).eq('id', id);
      return res.json({ success: true });
    }
    if (req.method === 'DELETE' && id) {
      await supabase.from('affiliations').delete().eq('id', id);
      return res.json({ success: true });
    }
  }

  // ── Admin Home Stats (POST/DELETE) ───────────────────
  const adminStatsMatch = path.match(/\/api\/([^\/]+)\/admin\/home\/stats(?:\/([^\/]+))?$/);
  if (adminStatsMatch) {
    const [_, slug, id] = adminStatsMatch;
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (req.method === 'POST') {
      const { label, number, icon, color, iconUrl } = req.body;
      const { data } = await supabase.from('home_stats').insert({ label, number, icon, color, icon_url: iconUrl, college_id: col!.id }).select().single();
      return res.json(data);
    }
    if (req.method === 'DELETE' && id) {
      await supabase.from('home_stats').delete().eq('id', id);
      return res.json({ success: true });
    }
  }

  // ── Admin Books (POST/PATCH/DELETE/ISSUE) ────────────
  const adminBooksMatch = path.match(/\/api\/([^\/]+)\/admin\/books(?:\/([^\/]+))?$/);
  if (adminBooksMatch) {
    const [_, slug, id] = adminBooksMatch;
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (req.method === 'POST') {
      const { bookName, authorName, shortIntro, description, totalCopies, bookImage } = req.body;
      const { data } = await supabase.from('books').insert({ book_name: bookName, author_name: authorName, short_intro: shortIntro, description, total_copies: parseInt(totalCopies), available_copies: parseInt(totalCopies), book_image: bookImage, college_id: col!.id }).select().single();
      return res.json(data);
    }
    if (req.method === 'PATCH' && id) {
      const { bookName, authorName, shortIntro, description, totalCopies, bookImage } = req.body;
      const updates: any = { book_name: bookName, author_name: authorName, short_intro: shortIntro, description, total_copies: parseInt(totalCopies), book_image: bookImage };
      // Note: simplistic availableCopies update logic here for brevity, in real app would be more complex
      await supabase.from('books').update(updates).eq('id', id);
      return res.json({ success: true });
    }
    if (req.method === 'DELETE' && id) {
      await supabase.from('books').delete().eq('id', id);
      return res.json({ success: true });
    }
  }

  const issueBookMatch = path.match(/\/api\/([^\/]+)\/admin\/issue-book$/);
  if (issueBookMatch && req.method === 'POST') {
    const slug = issueBookMatch[1];
    const { bookId, cardNumber } = req.body;
    const { data: book } = await supabase.from('books').select('available_copies').eq('id', bookId).single();
    if (!book || book.available_copies <= 0) return res.status(400).json({ error: 'Book not available' });
    
    const { data: app } = await supabase.from('library_card_applications').select('name').eq('card_number', cardNumber).eq('status', 'approved').single();
    if (!app) return res.status(400).json({ error: 'Valid library card not found' });

    await supabase.from('book_borrows').insert({ book_id: bookId, borrower_name: app.name, card_number: cardNumber, status: 'borrowed', borrow_date: new Date().toISOString() });
    await supabase.from('books').update({ available_copies: book.available_copies - 1 }).eq('id', bookId);
    return res.json({ success: true });
  }

  // ── Admin History Gallery (POST/DELETE) ──────────────
  const adminHistoryGalleryMatch = path.match(/\/api\/([^\/]+)\/admin\/history\/gallery(?:\/([^\/]+))?$/);
  if (adminHistoryGalleryMatch) {
    const [_, slug, id] = adminHistoryGalleryMatch;
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (req.method === 'POST') {
      const { imageUrl, caption, displayOrder } = req.body;
      const { data } = await supabase.from('college_history_gallery').insert({ image_url: imageUrl, caption, display_order: parseInt(displayOrder), college_id: col!.id }).select().single();
      return res.json(data);
    }
    if (req.method === 'DELETE' && id) {
      await supabase.from('college_history_gallery').delete().eq('id', id);
      return res.json({ success: true });
    }
  }

  // ── Admin Blog (POST/PATCH) ──────────────────────────
  const adminBlogMatch = path.match(/\/api\/([^\/]+)\/admin\/blog(?:\/([^\/]+))?$/);
  if (adminBlogMatch && (req.method === 'POST' || req.method === 'PATCH')) {
    const slug = adminBlogMatch[1];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    const b = req.body;
    const post = { title: b.title, content: b.content, slug: b.slug, short_description: b.shortDescription, status: b.status, featured_image: b.featuredImage };
    if (req.method === 'POST') await supabase.from('blog_posts').insert({ ...post, college_id: col!.id });
    else await supabase.from('blog_posts').update(post).eq('id', adminBlogMatch[2]!);
    return res.json({ success: true });
  }

  // ── Admin Library Card Apps (PATCH/DELETE) ───────────
  const adminLcaMatch = path.match(/\/api\/([^\/]+)\/admin\/library-card-applications\/([^\/]+)(?:\/status)?$/);
  if (adminLcaMatch) {
    const [_, slug, id] = adminLcaMatch;
    if (req.method === 'PATCH') {
      await supabase.from('library_card_applications').update({ status: req.body.status }).eq('id', id);
      return res.json({ success: true });
    }
    if (req.method === 'DELETE') {
      await supabase.from('library_card_applications').delete().eq('id', id);
      return res.json({ success: true });
    }
  }

  // ── Book Borrows (DELETE/PATCH) ──────────────────────
  const borrowMatch = path.match(/\/api\/([^\/]+)\/book-borrows\/([^\/]+)(?:\/return)?$/);
  if (borrowMatch) {
    const id = borrowMatch[2];
    if (req.method === 'DELETE') { await supabase.from('book_borrows').delete().eq('id', id); return res.json({ success: true }); }
    if (req.method === 'PATCH' && path.endsWith('/return')) {
      await supabase.from('book_borrows').update({ status: 'returned', return_date: new Date().toISOString() }).eq('id', id);
      return res.json({ success: true });
    }
  }

  // ── Admin History (POST/DELETE) ──────────────────────
  if (path.includes('/admin/history/')) {
    const slug = path.split('/')[2];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (path.endsWith('/page') && req.method === 'POST') {
      await supabase.from('college_history_page').upsert({ title: req.body.title, subtitle: req.body.subtitle, college_id: col!.id }, { onConflict: 'college_id' });
    } else if (path.endsWith('/sections') && req.method === 'POST') {
      await supabase.from('college_history_sections').insert({ ...req.body, college_id: col!.id });
    } else if (req.method === 'DELETE') {
      const id = path.split('/').pop();
      const table = path.includes('/sections/') ? 'college_history_sections' : 'college_history_gallery';
      await supabase.from(table).delete().eq('id', id!);
    }
    return res.json({ success: true });
  }

  // ── Contact Messages (PATCH/DELETE/POST) ─────────────
  const contactMatch = path.match(/\/api\/([^\/]+)\/contact-messages(?:\/([^\/]+))?(?:\/seen)?$/);
  if (contactMatch) {
    const [_, slug, id] = contactMatch;
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (req.method === 'POST') {
      await supabase.from('contact_messages').insert({ ...req.body, college_id: col!.id });
      return res.json({ success: true });
    }
    if (req.method === 'PATCH' && id && path.endsWith('/seen')) {
      await supabase.from('contact_messages').update({ is_seen: req.body.isSeen }).eq('id', id);
      return res.json({ success: true });
    }
    if (req.method === 'DELETE' && id) {
      await supabase.from('contact_messages').delete().eq('id', id);
      return res.json({ success: true });
    }
  }

  // ── Public GET routes ──────────────────────────────
  if (req.method === 'GET') {
    const slug = path.split('/')[2];
    const { data: col } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
    if (!col) return res.status(404).json({ error: 'Not found' });

    if (path.endsWith('/books')) {
      const { data } = await supabase.from('books').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
      return res.json((data || []).map((b: any) => ({
        id: b.id, bookName: b.book_name, authorName: b.author_name, shortIntro: b.short_intro, description: b.description,
        bookImage: b.book_image, totalCopies: b.total_copies, availableCopies: b.available_copies, createdAt: b.created_at
      })));
    }
    if (path.endsWith('/notes')) {
      const { data } = await supabase.from('notes').select('*').eq('college_id', col.id).eq('status', 'active');
      return res.json((data || []).map((n: any) => ({ id: n.id, title: n.title, description: n.description, subject: n.subject, class: n.class, pdfPath: n.pdf_path, status: n.status })));
    }
    if (path.endsWith('/faculty')) {
      const { data } = await supabase.from('faculty_staff').select('*').eq('college_id', col.id);
      return res.json((data || []).map((f: any) => ({ id: f.id, name: f.name, designation: f.designation, description: f.description, imageUrl: f.image_url })));
    }
    if (path.endsWith('/principal')) {
      const { data } = await supabase.from('principal').select('*').eq('college_id', col.id).maybeSingle();
      return res.json(data ? { id: data.id, name: data.name, message: data.message, imageUrl: data.image_url } : {});
    }
  }

  return res.status(404).json({ error: 'Route not found', path });
}
