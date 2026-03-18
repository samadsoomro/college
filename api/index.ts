import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || 'gcfm-admin-token-2026';

function isAdminRequest(req: VercelRequest): boolean {
  const authHeader = req.headers['x-admin-token'] as string;
  return authHeader === ADMIN_TOKEN;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Cookie,x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const path = url.pathname;
  const parts = path.split('/').filter(Boolean); // ["api", "slug", "module"]

  if (parts[parts.length - 1] === 'health') {
    return res.json({ status: 'ok', supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'MISSING' });
  }

  if (parts[0] !== 'api') return res.status(404).json({ error: 'Route not found', path });

  const collegeSlug = parts[1];
  if (collegeSlug === 'colleges' && parts[2]) {
    const slug = parts[2];
    const { data: college } = await supabase.from('colleges').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
    if (!college) return res.status(404).json({ error: 'College not found' });
    const { data: s } = await supabase.from('site_settings').select('*').eq('college_id', college.id).maybeSingle();
    return res.json({
      id: college.id, name: college.name, shortName: college.short_name, slug: college.slug,
      primaryColor: s?.primary_color || '#006600',
      instituteFullName: s?.institute_full_name || college.name,
      instituteShortName: s?.institute_short_name || college.short_name,
      navbarLogo: s?.navbar_logo, loadingLogo: s?.loading_logo,
      footerTitle: s?.footer_title, footerTagline: s?.footer_tagline,
      contactAddress: s?.contact_address, contactPhone: s?.contact_phone, contactEmail: s?.contact_email
    });
  }

  if (!collegeSlug) return res.status(404).json({ error: 'College slug required' });

  const { data: col } = await supabase.from('colleges').select('id').eq('slug', collegeSlug).maybeSingle();
  if (!col) return res.status(404).json({ error: 'College not found' });

  const isAdmin = isAdminRequest(req);
  const resource = parts[2];
  const subResource = parts[3];
  const subId = parts[4];

  // ── AUTH ──────────────────
  if (resource === 'auth' && subResource === 'login' && req.method === 'POST') {
    const { email, password } = req.body || {};
    const { data: admin } = await supabase.from('admin_credentials').select('*').eq('admin_email', email).eq('college_id', col.id).eq('is_active', true).maybeSingle();
    if (admin && await bcrypt.compare(password, admin.password_hash)) {
      return res.json({ redirect: `/${collegeSlug}/admin-dashboard`, role: 'admin', userId: admin.id, collegeSlug });
    }
    const { data: user } = await supabase.from('users').select('*').eq('email', email).eq('college_id', col.id).maybeSingle();
    if (user && await bcrypt.compare(password, user.password)) {
      return res.json({ redirect: `/${collegeSlug}`, role: 'user', userId: user.id, collegeSlug });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // ── PUBLIC GET ────────────
  if (req.method === 'GET' && !parts.includes('admin')) {
    if (resource === 'books') {
      const { data } = await supabase.from('books').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
      return res.json((data || []).map((b: any) => ({ id: b.id, bookName: b.book_name, authorName: b.author_name, shortIntro: b.short_intro, description: b.description, bookImage: b.book_image, totalCopies: b.total_copies, availableCopies: b.available_copies, createdAt: b.created_at })));
    }
    if (resource === 'events') {
      const { data } = await supabase.from('events').select('*').eq('college_id', col.id).order('date', { ascending: false });
      return res.json((data || []).map((e: any) => ({ id: e.id, title: e.title, description: e.description, images: e.images, date: e.date, createdAt: e.created_at, updatedAt: e.updated_at })));
    }
    if (resource === 'blog') {
      const { data } = await supabase.from('blog_posts').select('*').eq('college_id', col.id).eq('status', 'published').order('created_at', { ascending: false });
      return res.json((data || []).map((p: any) => ({ id: p.id, title: p.title, slug: p.slug, shortDescription: p.short_description, featuredImage: p.featured_image, createdAt: p.created_at })));
    }
    if (resource === 'notifications') {
      const { data } = await supabase.from('notifications').select('*').eq('college_id', col.id).eq('status', 'active').order('created_at', { ascending: false });
      return res.json((data || []).map((n: any) => ({ id: n.id, title: n.title, message: n.message, image: n.image, pin: n.pin, status: n.status, createdAt: n.created_at })));
    }
    if (resource === 'rare-books') {
      const { data } = await supabase.from('rare_books').select('*').eq('college_id', col.id).eq('status', 'active');
      return res.json((data || []).map((b: any) => ({ id: b.id, title: b.title, description: b.description, category: b.category, pdfPath: b.pdf_path, coverImage: b.cover_image, status: b.status, createdAt: b.created_at })));
    }
    if (resource === 'notes') {
      const { data } = await supabase.from('notes').select('*').eq('college_id', col.id).eq('status', 'active');
      return res.json((data || []).map((n: any) => ({ id: n.id, title: n.title, description: n.description, subject: n.subject, class: n.class, pdfPath: n.pdf_path, status: n.status, createdAt: n.created_at })));
    }
  }

  // ── ADMIN (ALL) ───────────
  if (resource === 'admin') {
    if (req.method === 'GET') {
      if (subResource === 'settings') {
        const { data: d } = await supabase.from('site_settings').select('*').eq('college_id', col.id).maybeSingle();
        if (!d) return res.json({});
        return res.json({
          id: d.id, primaryColor: d.primary_color, navbarLogo: d.navbar_logo, loadingLogo: d.loading_logo,
          instituteShortName: d.institute_short_name, instituteFullName: d.institute_full_name,
          footerTitle: d.footer_title, footerDescription: d.footer_description,
          facebookUrl: d.facebook_url, twitterUrl: d.twitter_url, instagramUrl: d.instagram_url, youtubeUrl: d.youtube_url,
          creditsText: d.credits_text, contributorsText: d.contributors_text, contactAddress: d.contact_address,
          contactPhone: d.contact_phone, contactEmail: d.contact_email, mapEmbedUrl: d.map_embed_url, googleMapLink: d.google_map_link,
          footerTagline: d.footer_tagline, heroBackgroundLogo: d.hero_background_logo, heroBackgroundOpacity: d.hero_background_opacity,
          cardHeaderText: d.card_header_text, cardSubheaderText: d.card_subheader_text, cardLogoUrl: d.card_logo_url,
          cardQrEnabled: d.card_qr_enabled, cardQrUrl: d.card_qr_url, cardTermsText: d.card_terms_text,
          cardContactAddress: d.card_contact_address, cardContactEmail: d.card_contact_email, cardContactPhone: d.card_contact_phone,
          rbWatermarkText: d.rb_watermark_text, rbWatermarkOpacity: d.rb_watermark_opacity, rbDisclaimerText: d.rb_disclaimer_text,
          rbWatermarkEnabled: d.rb_watermark_enabled, easypaisaNumber: d.easypaisa_number, bankAccountNumber: d.bank_account_number,
          bankName: d.bank_name, bankBranch: d.bank_branch, accountTitle: d.account_title
        });
      }
      if (subResource === 'books') {
        const { data } = await supabase.from('books').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
        // Corrected mapper for admin/books
        return res.json((data || []).map((b: any) => ({
          id: b.id, bookName: b.book_name, authorName: b.author_name, shortIntro: b.short_intro, description: b.description,
          bookImage: b.book_image, totalCopies: b.total_copies, availableCopies: b.available_copies
        })));
      }
      if (subResource === 'library-cards') {
        const { data } = await supabase.from('library_card_applications').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
        // Corrected mapper for admin/library-card-applications
        return res.json((data || []).map((c: any) => ({
          id: c.id, firstName: c.first_name, lastName: c.last_name, fatherName: c.father_name, email: c.email, phone: c.phone,
          class: c.class, field: c.field, rollNo: c.roll_no, cardNumber: c.card_number, status: c.status, createdAt: c.created_at, dynamicFields: c.dynamic_fields
        })));
      }
      if (subResource === 'donations') {
        const { data } = await supabase.from('donations').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
        return res.json((data || []).map((d: any) => ({ id: d.id, amount: d.amount, method: d.method, donorName: d.name, email: d.email, message: d.message, createdAt: d.created_at })));
      }
      if (subResource === 'notifications') {
        const { data } = await supabase.from('notifications').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
        return res.json((data || []).map((n: any) => ({ id: n.id, title: n.title, message: n.message, image: n.image, pin: n.pin, status: n.status, createdAt: n.created_at })));
      }
      if (subResource === 'events') {
        const { data } = await supabase.from('events').select('*').eq('college_id', col.id).order('date', { ascending: false });
        return res.json((data || []).map((e: any) => ({ id: e.id, title: e.title, description: e.description, images: e.images, date: e.date, createdAt: e.created_at })));
      }
      if (subResource === 'blog') {
        const { data } = await supabase.from('blog_posts').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
        return res.json((data || []).map((p: any) => ({ id: p.id, title: p.title, slug: p.slug, shortDescription: p.short_description, content: p.content, featuredImage: p.featured_image, isPinned: p.is_pinned, status: p.status, createdAt: p.created_at })));
      }
    }

    if (!isAdmin) return res.status(403).json({ error: 'Unauthorized: Admin token required' });

    if (subResource === 'settings' && req.method === 'PATCH') {
       const updates: any = { updated_at: new Date().toISOString() };
       const fieldMap: any = {
         instituteFullName: 'institute_full_name', instituteShortName: 'institute_short_name', primaryColor: 'primary_color',
         navbarLogo: 'navbar_logo', loadingLogo: 'loading_logo', heroBackgroundLogo: 'hero_background_logo',
         heroBackgroundOpacity: 'hero_background_opacity', footerTitle: 'footer_title', footerDescription: 'footer_description',
         footerTagline: 'footer_tagline', facebookUrl: 'facebook_url', twitterUrl: 'twitter_url', instagramUrl: 'instagram_url',
         youtubeUrl: 'youtube_url', contactAddress: 'contact_address', contactPhone: 'contact_phone', contactEmail: 'contact_email',
         mapEmbedUrl: 'map_embed_url', googleMapLink: 'google_map_link', cardHeaderText: 'card_header_text',
         cardSubheaderText: 'card_subheader_text', cardLogoUrl: 'card_logo_url', cardQrEnabled: 'card_qr_enabled',
         cardQrUrl: 'card_qr_url', cardTermsText: 'card_terms_text', cardContactAddress: 'card_contact_address',
         cardContactEmail: 'card_contact_email', cardContactPhone: 'card_contact_phone', rbWatermarkText: 'rb_watermark_text',
         rbWatermarkOpacity: 'rb_watermark_opacity', rbDisclaimerText: 'rb_disclaimer_text', rbWatermarkEnabled: 'rb_watermark_enabled',
         easypaisaNumber: 'easypaisa_number', bankAccountNumber: 'bank_account_number', bankName: 'bank_name',
         bankBranch: 'bank_branch', accountTitle: 'account_title', creditsText: 'credits_text', contributorsText: 'contributors_text'
       };
       for (const [k, v] of Object.entries(req.body || {})) {
         let value = v;
         if (k === 'rbWatermarkOpacity' || k === 'heroBackgroundOpacity') value = parseFloat(v as string) || 0;
         const dbKey = fieldMap[k] || k;
         updates[dbKey] = value;
       }
       const { data: existing } = await supabase.from('site_settings').select('id').eq('college_id', col.id).maybeSingle();
       if (existing) await supabase.from('site_settings').update(updates).eq('id', existing.id);
       else { updates.college_id = col.id; await supabase.from('site_settings').insert(updates); }
       return res.json({ success: true });
    }
  }

  return res.status(404).json({ error: 'Route not found', path, parts });
}


