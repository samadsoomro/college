import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || 'gcfm-admin-token-2026';

function isAdminRequest(req: VercelRequest): boolean {
  return req.headers['x-admin-token'] === ADMIN_TOKEN;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Cookie,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const path = url.pathname;
  const parts = path.split('/').filter(Boolean); // ["api", "slug", "module", ...]

  // Disable caching for all API routes to ensure real-time sync
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (parts[parts.length - 1] === 'health') return res.json({ status: 'ok' });
  if (parts[0] !== 'api') return res.status(404).json({ error: 'Route not found' });

  const collegeSlug = parts[1];
  if (!collegeSlug) return res.status(400).json({ error: 'College slug required' });

  // Special handle for /api/colleges/:slug (branding/initial load)
  if (collegeSlug === 'colleges' && parts[2]) {
    const slug = parts[2];
    const { data: college } = await supabase.from('colleges').select('*').eq('slug', slug).eq('is_active', true).maybeSingle();
    if (!college) return res.status(404).json({ error: 'College not found' });
    const { data: s } = await supabase.from('site_settings').select('*').eq('college_id', college.id).maybeSingle();
    return res.json({
      id: college.id, slug: college.slug, name: college.name, shortName: college.short_name,
      primaryColor: s?.primary_color || '#006600',
      instituteFullName: s?.institute_full_name || college.name,
      instituteShortName: s?.institute_short_name || college.short_name,
      navbarLogo: s?.navbar_logo, loadingLogo: s?.loading_logo,
      footerTitle: s?.footer_title, footerTagline: s?.footer_tagline,
      contactAddress: s?.contact_address, contactPhone: s?.contact_phone, contactEmail: s?.contact_email
    });
  }

  const { data: col } = await supabase.from('colleges').select('id').eq('slug', collegeSlug).maybeSingle();
  if (!col) return res.status(404).json({ error: 'College not found' });

  const isAdmin = isAdminRequest(req);
  const resource = parts[2];
  const subResource = parts[3];
  const itemId = parts[parts.length - 1]; // Fallback for DELETE/PATCH ids

  // ── AUTH ──────────────────────────────────────────────────────────────────
  // Handle Student/Visitor Login via Email OR Library Card
  if (resource === 'auth' && subResource === 'login' && req.method === 'POST') {
    const { email, password, collegeCardId } = req.body || {};
    
    // College Card Login
    if (collegeCardId) {
      const { data: card } = await supabase.from('library_card_applications').select('*').eq('card_number', collegeCardId).eq('college_id', col.id).maybeSingle();
      if (!card) return res.status(401).json({ error: 'Invalid College Card ID' });
      if (card.status === 'suspended') return res.status(403).json({ error: 'Your card has been suspended by college. Please contact the college library for assistance.' });
      if (card.status !== 'approved') return res.status(401).json({ error: 'Your card application is still pending approval.' });
      
      // Check password (matching the plain text password stored in DB for library cards)
      if (card.password === password) {
        return res.json({ redirect: `/${collegeSlug}/library-dashboard`, role: 'user', userId: card.id, collegeSlug, isLibraryCard: true });
      }
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Default Email Login
    const { data: admin } = await supabase.from('admin_credentials').select('*').eq('admin_email', email).eq('college_id', col.id).eq('is_active', true).maybeSingle();
    if (admin && (await bcrypt.compare(password, admin.password_hash))) {
      return res.json({ redirect: `/${collegeSlug}/admin-dashboard`, role: 'admin', userId: admin.id, collegeSlug });
    }
    const { data: user } = await supabase.from('registered_people').select('*').eq('email', email).eq('college_id', col.id).maybeSingle();
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      return res.json({ redirect: `/${collegeSlug}`, role: user.role, userId: user.id, collegeSlug });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // ── PUBLIC DATA ROUTES ────────────────────────────────────────────────────
  if (req.method === 'GET' && resource !== 'admin') {
    // 1. Full Home Data (content, slider, stats, affiliations)
    if (resource === 'home') {
      const [{ data: c }, { data: sl }, { data: st }, { data: af }] = await Promise.all([
        supabase.from('home_content').select('*').eq('college_id', col.id).maybeSingle(),
        supabase.from('home_slider_images').select('*').eq('college_id', col.id).eq('is_active', true).order('order'),
        supabase.from('home_stats').select('*').eq('college_id', col.id).order('order'),
        supabase.from('home_affiliations').select('*').eq('college_id', col.id).eq('is_active', true).order('order')
      ]);
      return res.json({
        content: {
          heroHeading: c?.hero_heading, heroSubheading: c?.hero_subheading, heroOverlayText: c?.hero_overlay_text,
          featuresHeading: c?.features_heading, featuresSubheading: c?.features_subheading,
          affiliationsHeading: c?.affiliations_heading, ctaHeading: c?.cta_heading, ctaSubheading: c?.cta_subheading
        },
        slider: (sl || []).map(s => ({ id: s.id, imageUrl: s.image_url, order: s.order, isActive: s.is_active })),
        stats: (st || []).map(s => ({ id: s.id, number: s.number, label: s.label, icon: s.icon, iconUrl: s.icon_url, color: s.color, order: s.order })),
        affiliations: (af || []).map(a => ({ id: a.id, name: a.name, logoUrl: a.logo_url, link: a.link, order: a.order, isActive: a.is_active }))
      });
    }

    // 2. Site Settings (for CollegeContext)
    if (resource === 'settings') {
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
        bankName: d.bank_name, bankBranch: d.bank_branch, accountTitle: d.account_title,
        storageBucket: d.storage_bucket || 'colleges'
      });
    }

    // 3. History
    if (resource === 'history') {
      if (subResource === 'page') {
        const { data } = await supabase.from('college_history_page').select('*').eq('college_id', col.id).maybeSingle();
        return res.json(data || { title: 'History of College', subtitle: '' });
      }
      if (subResource === 'sections') {
        const { data } = await supabase.from('college_history_sections').select('*').eq('college_id', col.id).order('display_order');
        return res.json((data || []).map(s => ({ id: s.id, title: s.title, description: s.description, imageUrl: s.image_url, iconName: s.icon_name, layoutType: s.layout_type, displayOrder: s.display_order })));
      }
      if (subResource === 'gallery') {
        const { data } = await supabase.from('college_history_gallery').select('*').eq('college_id', col.id).order('display_order');
        return res.json((data || []).map(g => ({ id: g.id, imageUrl: g.image_url, caption: g.caption, displayOrder: g.display_order })));
      }
    }

    // 4. Standard Modules
    if (resource === 'books') {
      const { data } = await supabase.from('books').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
      return res.json((data || []).map(b => ({ id: b.id, bookName: b.book_name, authorName: b.author_name, shortIntro: b.short_intro, description: b.description, bookImage: b.book_image, totalCopies: b.total_copies, availableCopies: b.available_copies })));
    }
    if (resource === 'events') {
      const { data } = await supabase.from('events').select('*').eq('college_id', col.id).order('date', { ascending: false });
      return res.json((data || []).map(e => ({ id: e.id, title: e.title, description: e.description, images: e.images, date: e.date })));
    }
    if (resource === 'blog') {
      // Individual blog post by slug or id
      if (subResource && !['stream'].includes(subResource)) {
        const { data: post } = await supabase.from('blog_posts').select('*').eq('college_id', col.id).eq('slug', subResource).eq('status', 'published').maybeSingle();
        if (!post) return res.status(404).json({ error: 'Post not found' });
        return res.json({ id: post.id, title: post.title, slug: post.slug, shortDescription: post.short_description, content: post.content, featuredImage: post.featured_image, createdAt: post.created_at, isPinned: post.is_pinned });
      }
      const { data } = await supabase.from('blog_posts').select('*').eq('college_id', col.id).eq('status', 'published').order('created_at', { ascending: false });
      return res.json((data || []).map((p: any) => ({ id: p.id, title: p.title, slug: p.slug, shortDescription: p.short_description, featuredImage: p.featured_image, createdAt: p.created_at })));
    }
    if (resource === 'notifications') {
      const { data } = await supabase.from('notifications').select('*').eq('college_id', col.id).eq('status', 'published').order('pin', { ascending: false }).order('created_at', { ascending: false });
      return res.json((data || []).map(n => ({ id: n.id, title: n.title, message: n.message, image: n.image, pin: n.pin, status: n.status, createdAt: n.created_at })));
    }
    if (resource === 'rare-books') {
      if (subResource === 'stream') {
        // Path: /api/:slug/rare-books/stream/:id
        const id = parts[4]; // parts=[api,slug,rare-books,stream,id]
        const { data: book } = await supabase.from('rare_books').select('*').eq('id', id).single();
        if (!book) return res.status(404).json({ error: 'Book not found' });
        
        // Proxy storage directly to avoid CORS/Auth issues for protected viewer
        const pdfPath = book.pdf_path || '';
        let bucket = 'rare-books'; // Default
        
        // Extract bucket from URL if present
        const bucketMatch = pdfPath.match(/\/storage\/v1\/object\/public\/([^\/?#]+)/);
        if (bucketMatch) {
          bucket = bucketMatch[1];
        } else if (pdfPath.includes('rare-books-pdfs/')) {
          bucket = 'rare-books-pdfs';
        }

        let fileName = pdfPath;
        if (pdfPath.includes('/')) {
          fileName = pdfPath.split('/').pop() || '';
        }
        // Ensure filename is decoded (e.g., %20 -> space) for storage download
        fileName = decodeURIComponent(fileName);
        
        let { data, error } = await supabase.storage.from(bucket).download(fileName);
        
        // Robust fallback: if initial attempt fails, try common alternative buckets
        if (error) {
          const alternatives = ['rare-books', 'rare-books-pdfs'].filter(b => b !== bucket);
          for (const altBucket of alternatives) {
            const { data: altData, error: altError } = await supabase.storage.from(altBucket).download(fileName);
            if (!altError && altData) {
              data = altData;
              error = null;
              break;
            }
          }
        }
        
        if (error || !data) {
          console.error('[RARE-BOOKS STREAM] Error:', error?.message || 'No data', 'bucket:', bucket, 'file:', fileName);
          return res.status(500).json({ error: 'Storage fetch failed' });
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        return res.send(Buffer.from(await data.arrayBuffer()));
      }
      const { data } = await supabase.from('rare_books').select('*').eq('college_id', col.id).eq('status', 'active');
      return res.json((data || []).map((b: any) => ({ id: b.id, title: b.title, description: b.description, category: b.category, pdfPath: b.pdf_path, coverImage: b.cover_image })));
    }
    if (resource === 'notes') {
      const { data } = await supabase.from('notes').select('*').eq('college_id', col.id).eq('status', 'active');
      return res.json((data || []).map(n => ({ id: n.id, title: n.title, description: n.description, subject: n.subject, class: n.class, pdfPath: n.pdf_path })));
    }
    if (resource === 'faculty') {
      const { data } = await supabase.from('faculty_staff').select('*').eq('college_id', col.id);
      return res.json((data || []).map(f => ({ id: f.id, name: f.name, designation: f.designation, description: f.description, imageUrl: f.image_url })));
    }
    if (resource === 'principal') {
      const { data } = await supabase.from('principal').select('*').eq('college_id', col.id).maybeSingle();
      return res.json(data ? { id: data.id, name: data.name, message: data.message, imageUrl: data.image_url } : {});
    }
  }

  // ── ADMIN PROTECTED ROUTES ────────────────────────────────────────────────
  if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

  // 1. Admin Universal Upload (Base64)
  if (parts[2] === 'admin' && parts[3] === 'upload') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { fileName, fileType, fileData } = req.body || {};
    if (!fileData) return res.status(400).json({ error: 'No file data provided' });

    const bucket = (url.searchParams.get('bucket')) || 'colleges';
    
    // Convert Base64 (data:image/png;base64,...) to Buffer
    const base64String = fileData.split(',')[1] || fileData;
    const buffer = Buffer.from(base64String, 'base64');
    
    const ext = fileName?.split('.').pop() || 'bin';
    const finalFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!(buckets || []).some(b => b.name === bucket)) {
      await supabase.storage.createBucket(bucket, { public: true });
    }

    const { data, error } = await supabase.storage.from(bucket).upload(finalFileName, buffer, {
      contentType: fileType || 'application/octet-stream',
      upsert: false
    });

    if (error) return res.status(500).json({ error: error.message });
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(finalFileName);
    return res.json({ url: publicUrl });
  }

  // 1b. Admin Home CMS
  if (parts[2] === 'admin' && parts[3] === 'home') {
    const sub = parts[4]; // content, slider, stats, affiliations
    if (sub === 'content') {
      if (req.method === 'GET') {
        const { data } = await supabase.from('home_content').select('*').eq('college_id', col.id).maybeSingle();
        return res.json(data ? { heroHeading: data.hero_heading, heroSubheading: data.hero_subheading, heroOverlayText: data.hero_overlay_text, featuresHeading: data.features_heading, featuresSubheading: data.features_subheading, affiliationsHeading: data.affiliations_heading, ctaHeading: data.cta_heading, ctaSubheading: data.cta_subheading } : {});
      }
      if (req.method === 'POST') {
        const { data: existing } = await supabase.from('home_content').select('id').eq('college_id', col.id).maybeSingle();
        const payload = {
          hero_heading: req.body.heroHeading, hero_subheading: req.body.heroSubheading, hero_overlay_text: req.body.heroOverlayText,
          features_heading: req.body.featuresHeading, features_subheading: req.body.featuresSubheading,
          affiliations_heading: req.body.affiliationsHeading, cta_heading: req.body.ctaHeading, cta_subheading: req.body.ctaSubheading,
          updated_at: new Date().toISOString()
        };
        if (existing) await supabase.from('home_content').update(payload).eq('id', existing.id);
        else await supabase.from('home_content').insert({ ...payload, college_id: col.id });
        return res.json({ success: true });
      }
    }
    // Generic handlers for slider, stats, affiliations
    const tableMap: any = { slider: 'home_slider_images', stats: 'home_stats', affiliations: 'home_affiliations' };
    const table = tableMap[sub];
    if (table) {
      if (req.method === 'GET') {
        const { data } = await supabase.from(table).select('*').eq('college_id', col.id).order('order');
        if (sub === 'slider') return res.json((data || []).map(s => ({ id: s.id, imageUrl: s.image_url, order: s.order, isActive: s.is_active })));
        if (sub === 'stats') return res.json((data || []).map(s => ({ id: s.id, label: s.label, number: s.number, icon: s.icon, color: s.color, iconUrl: s.icon_url, order: s.order })));
        if (sub === 'affiliations') return res.json((data || []).map(a => ({ id: a.id, name: a.name, logoUrl: a.logo_url, link: a.link, order: a.order, isActive: a.is_active })));
      }
      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: col.id };
        // Map camelCase to snake_case if needed
        if (sub === 'slider') { payload.image_url = req.body.imageUrl; delete payload.imageUrl; }
        if (sub === 'affiliations') { payload.logo_url = req.body.logoUrl; delete payload.logoUrl; payload.is_active = true; }
        if (sub === 'stats') { payload.icon_url = req.body.iconUrl; delete payload.iconUrl; }
        const { data, error } = await supabase.from(table).insert(payload).select().single();
        return res.json(data || { success: true });
      }
      if (req.method === 'PATCH') {
        const id = parts[5];
        await supabase.from(table).update(req.body).eq('id', id);
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        const id = parts[5];
        await supabase.from(table).delete().eq('id', id);
        return res.json({ success: true });
      }
    }
  }

  // 2. Admin History CMS
  if (parts[2] === 'admin' && parts[3] === 'history') {
    const sub = parts[4];
    const tableMap: any = { page: 'college_history_page', sections: 'college_history_sections', gallery: 'college_history_gallery' };
    const table = tableMap[sub];
    if (table) {
      if (req.method === 'GET') {
        const { data } = await supabase.from(table).select('*').eq('college_id', col.id).order('display_order');
        if (sub === 'sections') return res.json((data || []).map((s: any) => ({ id: s.id, title: s.title, description: s.description, imageUrl: s.image_url, iconName: s.icon_name, layoutType: s.layout_type, isFullWidth: s.is_full_width, displayOrder: s.display_order })));
        if (sub === 'gallery') return res.json((data || []).map((g: any) => ({ id: g.id, imageUrl: g.image_url, caption: g.caption, displayOrder: g.display_order })));
        if (sub === 'page') { const { data: d } = await supabase.from(table).select('*').eq('college_id', col.id).maybeSingle(); return res.json(d || {}); }
        return res.json(data || []);
      }
      if (req.method === 'POST') {
        if (sub === 'sections') {
          const payload = {
            college_id: col.id, title: req.body.title, description: req.body.description,
            image_url: req.body.imageUrl, icon_name: req.body.iconName, layout_type: req.body.layoutType,
            is_full_width: req.body.isFullWidth, display_order: req.body.displayOrder || 0
          };
          if (req.body.id) {
            await supabase.from(table).update(payload).eq('id', req.body.id);
          } else {
            await supabase.from(table).insert(payload);
          }
          return res.json({ success: true });
        }
        if (sub === 'gallery') {
          const payload = { college_id: col.id, image_url: req.body.imageUrl, caption: req.body.caption || '', display_order: req.body.displayOrder || 0 };
          await supabase.from(table).insert(payload);
          return res.json({ success: true });
        }
        if (sub === 'page') {
          const { data: existing } = await supabase.from(table).select('id').eq('college_id', col.id).maybeSingle();
          const payload = { title: req.body.title, subtitle: req.body.subtitle };
          if (existing) await supabase.from(table).update(payload).eq('id', (existing as any).id);
          else await supabase.from(table).insert({ ...payload, college_id: col.id });
          return res.json({ success: true });
        }
      }
      if (req.method === 'PATCH') {
        const itemId = parts[5];
        if (sub === 'sections') {
          const payload: any = {};
          if (req.body.title !== undefined) payload.title = req.body.title;
          if (req.body.description !== undefined) payload.description = req.body.description;
          if (req.body.imageUrl !== undefined) payload.image_url = req.body.imageUrl;
          if (req.body.iconName !== undefined) payload.icon_name = req.body.iconName;
          if (req.body.layoutType !== undefined) payload.layout_type = req.body.layoutType;
          if (req.body.isFullWidth !== undefined) payload.is_full_width = req.body.isFullWidth;
          if (req.body.displayOrder !== undefined) payload.display_order = req.body.displayOrder;
          await supabase.from(table).update(payload).eq('id', itemId);
          return res.json({ success: true });
        }
      }
      if (req.method === 'DELETE') {
        await supabase.from(table).delete().eq('id', parts[5]);
        return res.json({ success: true });
      }
    }
  }

  // 3. Admin Principal CMS
  if (parts[2] === 'admin' && parts[3] === 'principal') {
    if (req.method === 'GET') {
      const { data } = await supabase.from('principal').select('*').eq('college_id', col.id).maybeSingle();
      return res.json(data ? { id: data.id, name: data.name, message: data.message, imageUrl: data.image_url } : {});
    }
    if (req.method === 'POST') {
      const { data: ex } = await supabase.from('principal').select('id').eq('college_id', col.id).maybeSingle();
      const payload = {
        name: req.body.name,
        message: req.body.message,
        image_url: req.body.imageUrl,
        updated_at: new Date().toISOString()
      };
      if (ex) await supabase.from('principal').update(payload).eq('id', ex.id);
      else await supabase.from('principal').insert({ ...payload, college_id: col.id });
      return res.json({ success: true });
    }
  }

  // 3. Admin Settings (Theme & Branding)
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
      bankBranch: 'bank_branch', accountTitle: 'account_title', creditsText: 'credits_text',
      contributorsText: 'contributors_text', storageBucket: 'storage_bucket'
    };
    for (const [k, v] of Object.entries(req.body || {})) {
      if (!fieldMap[k]) continue; // Only allow mapped fields to be updated
      let val = v;
      if (k === 'rbWatermarkOpacity' || k === 'heroBackgroundOpacity') val = parseFloat(v as string) || 0;
      updates[fieldMap[k]] = val;
    }
    const { data: ex } = await supabase.from('site_settings').select('id').eq('college_id', col.id).maybeSingle();
    if (ex) await supabase.from('site_settings').update(updates).eq('id', ex.id);
    else await supabase.from('site_settings').insert({ ...updates, college_id: col.id });
    const { data: updated } = await supabase.from('site_settings').select('*').eq('college_id', col.id).single();
    // Return mapped object for frontend context
    return res.json({
      id: updated.id, primaryColor: updated.primary_color, navbarLogo: updated.navbar_logo, loadingLogo: updated.loading_logo,
      instituteShortName: updated.institute_short_name, instituteFullName: updated.institute_full_name,
      footerTitle: updated.footer_title, footerDescription: updated.footer_description,
      facebookUrl: updated.facebook_url, twitterUrl: updated.twitter_url, instagramUrl: updated.instagram_url, youtubeUrl: updated.youtube_url,
      creditsText: updated.credits_text, contributorsText: updated.contributors_text, contactAddress: updated.contact_address,
      contactPhone: updated.contact_phone, contactEmail: updated.contact_email, mapEmbedUrl: updated.map_embed_url, googleMapLink: updated.google_map_link,
      footerTagline: updated.footer_tagline, heroBackgroundLogo: updated.hero_background_logo, heroBackgroundOpacity: updated.hero_background_opacity,
      cardHeaderText: updated.card_header_text, cardSubheaderText: updated.card_subheader_text, cardLogoUrl: updated.card_logo_url,
      cardQrEnabled: updated.card_qr_enabled, cardQrUrl: updated.card_qr_url, cardTermsText: updated.card_terms_text,
      cardContactAddress: updated.card_contact_address, cardContactEmail: updated.card_contact_email, cardContactPhone: updated.card_contact_phone,
      rbWatermarkText: updated.rb_watermark_text, rbWatermarkOpacity: updated.rb_watermark_opacity, rbDisclaimerText: updated.rb_disclaimer_text,
      rbWatermarkEnabled: updated.rb_watermark_enabled, easypaisaNumber: updated.easypaisa_number, bankAccountNumber: updated.bank_account_number,
      bankName: updated.bank_name, bankBranch: updated.bank_branch, accountTitle: updated.account_title
    });
  }

  // 4. Other Admin Lists (Books, Donations, etc.)
  if (req.method === 'GET' && resource === 'admin') {
    if (subResource === 'books') {
      const { data } = await supabase.from('books').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
      return res.json((data || []).map(b => ({ id: b.id, bookName: b.book_name, authorName: b.author_name, shortIntro: b.short_intro, description: b.description, bookImage: b.book_image, totalCopies: b.total_copies, availableCopies: b.available_copies })));
    }
    if (subResource === 'library-cards') {
      const { data } = await supabase.from('library_card_applications').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
      return res.json((data || []).map(c => ({ 
        id: c.id, firstName: c.first_name, lastName: c.last_name, 
        fatherName: c.father_name, email: c.email, phone: c.phone, 
        class: c.class, field: c.field, rollNo: c.roll_no, 
        addressStreet: c.address_street, addressCity: c.address_city,
        addressState: c.address_state, addressZip: c.address_zip,
        dob: c.dob, cardNumber: c.card_number, status: c.status, 
        createdAt: c.created_at, dynamicFields: c.dynamic_fields 
      })));
    }
    if (subResource === 'borrowed-books') {
      const { data } = await supabase.from('borrowed_books').select(`
        *,
        library_card_applications (first_name, last_name, card_number, status)
      `).eq('college_id', col.id).order('borrow_date', { ascending: false });
      
      return res.json((data || []).map((b: any) => ({
        id: b.id,
        bookTitle: b.book_title,
        borrowerName: b.library_card_applications ? `${b.library_card_applications.first_name} ${b.library_card_applications.last_name}` : 'Card Deleted',
        cardNumber: b.library_card_applications?.card_number || 'N/A',
        cardDeleted: !b.library_card_applications,
        cardSuspended: b.library_card_applications?.status === 'suspended',
        borrowDate: b.borrow_date,
        dueDate: b.due_date,
        status: b.status
      })));
    }
    if (subResource === 'donations') {
       const { data } = await supabase.from('donations').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
       return res.json((data || []).map(d => ({ id: d.id, amount: d.amount, method: d.method, donorName: d.name, email: d.email, message: d.message, createdAt: d.created_at })));
    }
    if (subResource === 'notifications') {
      const { data } = await supabase.from('notifications').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
      return res.json((data || []).map(n => ({ id: n.id, title: n.title, message: n.message, image: n.image, pin: n.pin, status: n.status, createdAt: n.created_at })));
    }
    if (subResource === 'events') {
      const { data } = await supabase.from('events').select('*').eq('college_id', col.id).order('date', { ascending: false });
      return res.json((data || []).map(e => ({ id: e.id, title: e.title, description: e.description, images: e.images, date: e.date, createdAt: e.created_at })));
    }
    if (subResource === 'blog') {
      const { data } = await supabase.from('blog_posts').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
      return res.json((data || []).map(p => ({ id: p.id, title: p.title, slug: p.slug, shortDescription: p.short_description, content: p.content, featuredImage: p.featured_image, isPinned: p.is_pinned, status: p.status, createdAt: p.created_at })));
    }
    if (subResource === 'principal') {
      const { data } = await supabase.from('principal').select('*').eq('college_id', col.id).maybeSingle();
      return res.json(data ? { id: data.id, name: data.name, designation: data.designation, message: data.message, imageUrl: data.image_url } : {});
    }
    if (subResource === 'faculty') {
      const { data } = await supabase.from('faculty_staff').select('*').eq('college_id', col.id);
      return res.json((data || []).map(f => ({ id: f.id, name: f.name, designation: f.designation, description: f.description, imageUrl: f.image_url, supervises: f.supervises })));
    }
    if (subResource === 'history') {
      const sub = parts[4]; // sections, gallery
      if (sub === 'sections') {
        const { data } = await supabase.from('college_history_sections').select('*').eq('college_id', col.id).order('display_order');
        return res.json((data || []).map(s => ({ id: s.id, title: s.title, description: s.description, imageUrl: s.image_url, layoutType: s.layout_type, displayOrder: s.display_order })));
      }
      if (sub === 'gallery') {
        const { data } = await supabase.from('college_history_gallery').select('*').eq('college_id', col.id).order('display_order');
        return res.json((data || []).map(g => ({ id: g.id, imageUrl: g.image_url, caption: g.caption, displayOrder: g.display_order })));
      }
    }
    if (subResource === 'users') {
      const { data } = await supabase.from('profiles').select('*').eq('college_id', col.id);
      // Filter for non-admin profiles if needed, or return all
      return res.json({ nonStudents: (data || []).map(u => ({ id: u.id, name: u.full_name, role: u.role, email: u.email, phone: u.phone_number, createdAt: u.created_at })) });
    }
    if (subResource === 'notes') {
      const { data } = await supabase.from('notes').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
      return res.json((data || []).map(n => ({ id: n.id, title: n.title, description: n.description, subject: n.subject, class: n.class, pdfPath: n.pdf_path, status: n.status })));
    }
    if (subResource === 'rare-books') {
      const { data } = await supabase.from('rare_books').select('*').eq('college_id', col.id).order('created_at', { ascending: false });
      return res.json((data || []).map((b: any) => ({ id: b.id, title: b.title, description: b.description, category: b.category, pdfPath: b.pdf_path, coverImage: b.cover_image, status: b.status })));
    }
  }

  // 5. Admin POST/PATCH/DELETE Operations
  if (req.method !== 'GET' && parts[2] === 'admin') {
    const resrc = parts[3];
    const sub = parts[4];
    const id = parts[5];
    
    // Admin History
    if (resrc === 'history') {
      const tableMap: any = { page: 'college_history_page', sections: 'college_history_sections', gallery: 'college_history_gallery' };
      const table = tableMap[sub];
      if (!table) return res.status(400).json({ error: 'Invalid history sub-resource' });

      if (req.method === 'POST' || req.method === 'PATCH') {
        const payload: any = { ...req.body, college_id: col.id };
        if (req.body.imageUrl !== undefined) { payload.image_url = req.body.imageUrl; delete payload.imageUrl; }
        if (req.body.iconName !== undefined) { payload.icon_name = req.body.iconName; delete payload.iconName; }
        if (req.body.layoutType !== undefined) { payload.layout_type = req.body.layoutType; delete payload.layoutType; }
        if (req.body.displayOrder !== undefined) { payload.display_order = req.body.displayOrder; delete payload.displayOrder; }
        
        const itemId = (sub === 'page') ? null : (id || req.body.id);
        if (itemId && itemId !== sub) {
          await supabase.from(table).update(payload).eq('id', itemId);
        } else if (sub === 'page') {
          const { data: ex } = await supabase.from(table).select('id').eq('college_id', col.id).maybeSingle();
          if (ex) await supabase.from(table).update(payload).eq('id', ex.id);
          else await supabase.from(table).insert(payload);
        } else {
          await supabase.from(table).insert(payload);
        }
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from(table).delete().eq('id', id);
        return res.json({ success: true });
      }
    }

    // Admin Principal
    if (resrc === 'principal') {
      const payload = { ...req.body, college_id: col.id, image_url: req.body.imageUrl, updated_at: new Date().toISOString() };
      delete payload.imageUrl;
      const { data: ex } = await supabase.from('principal').select('id').eq('college_id', col.id).maybeSingle();
      if (ex) await supabase.from('principal').update(payload).eq('id', ex.id);
      else await supabase.from('principal').insert(payload);
      return res.json({ success: true });
    }

    // Admin Faculty
    if (resrc === 'faculty') {
      if (req.method === 'POST' || req.method === 'PATCH') {
        const payload = { ...req.body, college_id: col.id, image_url: req.body.imageUrl };
        delete payload.imageUrl;
        const itemId = id || req.body.id;
        if (itemId && itemId !== 'faculty') await supabase.from('faculty_staff').update(payload).eq('id', itemId);
        else await supabase.from('faculty_staff').insert(payload);
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from('faculty_staff').delete().eq('id', id);
        return res.json({ success: true });
      }
    }

    // Admin Notes
    if (resrc === 'notes') {
      if (id && id.includes('/toggle')) {
        const actualId = id.split('/')[0];
        const { data: curr } = await supabase.from('notes').select('status').eq('id', actualId).single();
        const newStatus = (curr as any)?.status === 'active' ? 'inactive' : 'active';
        await supabase.from('notes').update({ status: newStatus }).eq('id', actualId);
        return res.json({ success: true, status: newStatus });
      }
      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: col.id, pdf_path: req.body.pdfPath };
        delete payload.pdfPath;
        await supabase.from('notes').insert(payload);
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from('notes').delete().eq('id', id);
        return res.json({ success: true });
      }
    }

    // Admin Rare Books
    if (resrc === 'rare-books') {
      if (id && id.includes('/toggle')) {
        const actualId = id.split('/')[0];
        const { data: curr } = await supabase.from('rare_books').select('status').eq('id', actualId).single();
        const newStatus = (curr as any)?.status === 'active' ? 'inactive' : 'active';
        await supabase.from('rare_books').update({ status: newStatus }).eq('id', actualId);
        return res.json({ success: true, status: newStatus });
      }
      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: col.id, pdf_path: req.body.pdfPath, cover_image: req.body.coverImage };
        delete payload.pdfPath; delete payload.coverImage;
        const { error } = await supabase.from('rare_books').insert(payload);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from('rare_books').delete().eq('id', id);
        return res.json({ success: true });
      }
    }

    // Admin Events
    if (resrc === 'events') {
      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: col.id, images: req.body.images || [] };
        const { data, error } = await supabase.from('events').insert(payload).select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }
      if (req.method === 'PATCH') {
        await supabase.from('events').update(req.body).eq('id', id);
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from('events').delete().eq('id', id);
        return res.json({ success: true });
      }
    }

    // Admin Notifications
    if (resrc === 'notifications') {
      const subAction = parts[5]; 
      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: col.id, pin: req.body.pin || false, status: req.body.status || 'active' };
        const { data, error } = await supabase.from('notifications').insert(payload).select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }
      if (req.method === 'PATCH') {
        if (subAction === 'status') {
          const { data: curr } = await supabase.from('notifications').select('status').eq('id', id).single();
          const newStatus = (curr as any)?.status === 'active' ? 'inactive' : 'active';
          await supabase.from('notifications').update({ status: newStatus }).eq('id', id);
          return res.json({ success: true, status: newStatus });
        }
        if (subAction === 'pin') {
          const { data: curr } = await supabase.from('notifications').select('pin').eq('id', id).single();
          const newPin = !(curr as any)?.pin;
          await supabase.from('notifications').update({ pin: newPin }).eq('id', id);
          return res.json({ success: true, pin: newPin });
        }
        await supabase.from('notifications').update(req.body).eq('id', id);
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from('notifications').delete().eq('id', id);
        return res.json({ success: true });
      }
    }

    // Admin Books
    if (resrc === 'books') {
      if (req.method === 'POST' || req.method === 'PATCH') {
        const payload = { 
          ...req.body, college_id: col.id, 
          book_name: req.body.bookName, author_name: req.body.authorName, 
          short_intro: req.body.shortIntro, book_image: req.body.bookImage, 
          total_copies: req.body.totalCopies, available_copies: req.body.availableCopies 
        };
        delete payload.bookName; delete payload.authorName; delete payload.shortIntro; delete payload.bookImage; delete payload.totalCopies; delete payload.availableCopies;
        if (id && id !== 'books') await supabase.from('books').update(payload).eq('id', id);
        else await supabase.from('books').insert(payload);
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from('books').delete().eq('id', id);
        return res.json({ success: true });
      }
    }

    // Admin Blog
    if (resrc === 'blog') {
      if (req.method === 'POST' || req.method === 'PATCH') {
        const payload: any = {
          college_id: col.id,
          title: req.body.title,
          content: req.body.content,
          featured_image: req.body.featuredImage,
          short_description: req.body.shortDescription,
          slug: req.body.slug,
          is_pinned: req.body.isPinned || false,
          status: req.body.status || 'published',
          updated_at: new Date().toISOString()
        };
        if (id && id !== 'blog') {
          await supabase.from('blog_posts').update(payload).eq('id', id);
        } else {
          await supabase.from('blog_posts').insert(payload);
        }
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from('blog_posts').delete().eq('id', id);
        return res.json({ success: true });
      }
    }

    // Admin Library Cards
    if (resrc === 'library-cards') {
      if (req.method === 'PATCH') {
        if (id && id.includes('/status')) {
          const actualId = id.split('/')[0];
          await supabase.from('library_card_applications').update(req.body).eq('id', actualId);
          return res.json({ success: true });
        }
        await supabase.from('library_card_applications').update(req.body).eq('id', id);
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        // Soft delete/Suspend instead of hard delete to preserve history and show suspension message
        await supabase.from('library_card_applications').update({ status: 'suspended' }).eq('id', id);
        return res.json({ success: true });
      }
    }

    if (resrc === 'borrowed-books') {
      if (req.method === 'DELETE') {
        await supabase.from('borrowed_books').delete().eq('id', id);
        return res.json({ success: true });
      }
    }

    if (resrc === 'users') {
      if (req.method === 'PATCH') {
        await supabase.from('profiles').update(req.body).eq('id', id);
        return res.json({ success: true });
      }
      if (req.method === 'DELETE') {
        await supabase.from('profiles').delete().eq('id', id);
        return res.json({ success: true });
      }
    }
  }

  return res.status(404).json({ error: 'Endpoint not found', path });
}


