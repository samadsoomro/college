import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '');

if (!supabaseUrl || !supabaseKey) {
  console.error('[INIT] Missing Supabase credentials!',
    'URL:', supabaseUrl ? 'set' : 'MISSING',
    'KEY:', supabaseKey ? 'set' : 'MISSING'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || 'gcfm-admin-token-2026';

function checkAdminToken(req: VercelRequest): boolean {
  const token = req.headers['x-admin-token'] as string;
  const valid = process.env.ADMIN_API_TOKEN || 'gcfm-admin-token-2026';
  return token === valid;
}

async function getCollegeId(slug: string): Promise<string | null> {
  const { data } = await supabase.from('colleges').select('id').eq('slug', slug).maybeSingle();
  return data?.id || null;
}

async function deleteStorageFile(url: string | null) {
  if (!url) return;

  try {
    // ── Cloudinary URL ─────────────────────────────────────
    if (url.includes('cloudinary.com')) {
      const isRaw = url.includes('/raw/upload/');
      const resourceType = isRaw ? 'raw' : 'image';

      const uploadIndex = url.indexOf('/upload/');
      if (uploadIndex === -1) return;

      const afterUpload = url.substring(uploadIndex + 8);
      const withoutVersion = afterUpload.replace(/^v\d+\//, '');
      const publicId = withoutVersion.replace(/\.[^/.]+$/, '');

      console.log('[CLOUDINARY DELETE] publicId:', publicId, 'resourceType:', resourceType);

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });

      console.log('[CLOUDINARY DELETE] result:', result.result);
      return;
    }

    // ── Supabase URL (old files) ───────────────────────────
    if (url.includes('supabase')) {
      const parts = url.split('/storage/v1/object/public/');
      if (parts.length < 2) return;
      const rest = parts[1];
      const bucket = rest.split('/')[0];
      const filePath = rest.substring(bucket.length + 1);
      await supabase.storage.from(bucket).remove([filePath]);
      console.log('[SUPABASE DELETE]', bucket, filePath);
    }
  } catch (e: any) {
    console.error('[DELETE FILE ERROR]', e.message);
  }
}



function isAdminRequest(req: VercelRequest): boolean {
  return checkAdminToken(req);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Cookie,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Handle /og/:slug — must be checked using req.url directly
  // because vercel.json routes /og/:slug to api/index.ts
  // URL will be: /og/gcfm or /og/dj
  const rawUrl = req.url || '';
  const ogMatch = rawUrl.match(/^\/og\/([^\/\?]+)/);

  if (ogMatch) {
    const ogSlug = ogMatch[1];

    const { data: college } = await supabase
      .from('colleges').select('id, name')
      .eq('slug', ogSlug.toLowerCase()).maybeSingle();

    if (!college) return res.status(404).send('College not found');

    const { data: settings } = await supabase
      .from('site_settings')
      .select('navbar_logo, loading_logo, institute_full_name, footer_tagline')
      .eq('college_id', college.id).maybeSingle();

    // HARDCODED — never relative:
    const siteUrl = `https://college-managment-system-coral.vercel.app/${ogSlug}`;
    const rawLogo = settings?.navbar_logo || settings?.loading_logo || `https://college-managment-system-coral.vercel.app/logo.png`;
    const logoUrl = rawLogo.split('?')[0];
    const title = settings?.institute_full_name || college.name;
    const description = settings?.footer_tagline || `${title} - Digital Library Portal`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${logoUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${siteUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${title}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${logoUrl}">
  <meta http-equiv="refresh" content="0; url=${siteUrl}">
  <script>window.location.href = '${siteUrl}';</script>
</head>
<body>
  <p>Redirecting... <a href="${siteUrl}">Click here if not redirected</a></p>
</body>
</html>`);
  }



  const url = new URL(req.url || '', `http://${req.headers.host}`);

  const path = url.pathname;
  const parts = path.split('/').filter(Boolean); // ["api", "slug", "module", ...]
  const isApi = parts[0] === 'api';

  // Disable caching for all API routes to ensure real-time sync
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');

  if (parts[parts.length - 1] === 'health') {
    return res.json({
      status: 'ok',
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'MISSING',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
      cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'MISSING',
      cloudinaryKey: process.env.CLOUDINARY_API_KEY ? 'set' : 'MISSING',
    });
  }

  if (parts[0] !== 'api') return res.status(404).json({ error: 'Route not found' });

  const collegeSlug = parts[1];
  if (!collegeSlug) return res.status(400).json({ error: 'College slug required' });

  // Special handle for /api/colleges/:slug (branding/initial load)
  if (collegeSlug === 'colleges' && parts[2]) {
    const slug = parts[2];
    const { data: college } = await supabase.from('colleges').select('*').eq('slug', slug).maybeSingle();
    if (!college) return res.status(404).json({ error: 'College not found' });
    const { data: s } = await supabase.from('site_settings').select('*').eq('college_id', college.id).maybeSingle();
    return res.json({
      id: college.id, slug: college.slug, name: college.name, shortName: college.short_name,
      primaryColor: s?.primary_color || '#006600',
      instituteFullName: s?.institute_full_name || college.name,
      instituteShortName: s?.institute_short_name || college.short_name,
      navbarLogo: s?.navbar_logo, loadingLogo: s?.loading_logo,
      footerTitle: s?.footer_title, footerTagline: s?.footer_tagline,
      contactAddress: s?.contact_address, contactPhone: s?.contact_phone, contactEmail: s?.contact_email,
      termCardMenu: s?.term_card_menu || 'College Card',
      termInstitution: s?.term_institution || 'College',
      termPrincipal: s?.term_principal || 'Principal',
      officeHours: s?.office_hours || 'Mon–Fri: 9:00 AM – 1:00 PM\nSat: 9:00 AM – 12:00 PM\nSun: Closed',
      blogHeading: s?.blog_heading || 'College News & Updates',
      blogDescription: s?.blog_description || 'Stay informed with the latest academic updates',
      notesHeading: s?.notes_heading || 'Study Notes',
      notesDescription: s?.notes_description || 'Download notes shared by our faculty',
      eventsHeading: s?.events_heading || 'Events',
      eventsDescription: s?.events_description || 'Stay updated with upcoming college events',
      notificationsHeading: s?.notifications_heading || 'Notifications',
      notificationsDescription: s?.notifications_description || 'Official announcements and updates',
      contactHeading: s?.contact_heading || 'Contact Us',
      contactDescription: s?.contact_description || 'Get in touch with us for official information and student support',
    });
  }

  const { data: col } = await supabase.from('colleges').select('id').eq('slug', collegeSlug.toLowerCase()).maybeSingle();
  
  // Allow 'super-admin' virtual slug to pass without a DB record
  if (!col && collegeSlug !== 'super-admin') {
    return res.status(404).json({ error: 'College not found' });
  }
  let colId = col?.id;

  const isAdmin = isAdminRequest(req);
  const slug = collegeSlug; // Alias for standard logic
  const resource = parts[2];
  const subResource = parts[3];
  const sub1 = subResource; // Alias for standard logic
  const sub2 = parts[4];
  const sub3 = parts[5] || '';
  
  console.log('[DEBUG]', req.method, path, '→ parts:', JSON.stringify(parts), 'resource:', resource, 'sub1:', sub1, 'sub2:', sub2, 'sub3:', sub3);
  
  // itemId is usually the last part, but if we have /status, /return or similar, it's the second to last
  let itemId = parts[parts.length - 1]; 
  if (sub3 === 'status' || sub3 === 'return') itemId = sub2;

  // GET /api/:slug/library-card-applications/by-card/:cardNumber
  if (resource === 'library-card-applications' && subResource === 'by-card' && sub2 && req.method === 'GET') {
    if (!col) return res.status(404).json({ error: 'College not found' });

    const { data } = await supabase
      .from('library_card_applications')
      .select('*')
      .ilike('card_number', sub2)
      .eq('college_id', colId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return res.status(404).json({ error: 'Card not found' });

    return res.json({
      cardNumber: data.card_number,
      studentId: data.student_id,
      name: `${data.first_name} ${data.last_name}`,
      firstName: data.first_name,
      lastName: data.last_name,
      fatherName: data.father_name,
      dob: data.dob,
      email: data.email,
      phone: data.phone,
      class: data.class,
      field: data.field,
      rollNo: data.roll_no,
      issueDate: data.issue_date,
      validThrough: data.valid_through,
      status: data.status,
      dynamicFields: data.dynamic_fields || {}
    });
  }

  // ── SUPER ADMIN "ME" CHECK ───────────────────────────────────────────────
  if (collegeSlug === 'super-admin' && resource === 'me' && req.method === 'GET') {
    // For now, return 200 to satisfy SuperAdminProtectedRoute redirection check.
    // In production, this should verify a session cookie or JWT.
    return res.json({ authenticated: true, role: 'superadmin' });
  }

  // ── SUPER ADMIN COLLEGES (GET, POST, DELETE) ──────────────────────────────
  if (collegeSlug === 'super-admin' && resource === 'colleges') {
    if (!subResource) {
      if (req.method === 'GET') {
        const { data, error } = await supabase.from('colleges').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        
        // Map to camelCase for frontend
        const mapped = (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          shortName: c.short_name,
          slug: c.slug,
          isActive: c.is_active,
          createdAt: c.created_at
        }));
        
        return res.json(mapped);
      }
      if (req.method === 'POST') {
        const { name, shortName, slug: newSlug, adminEmail, adminPassword } = req.body || {};

        if (!name || !shortName || !newSlug) {
          return res.status(400).json({ error: 'Missing required college fields' });
        }

        const bucketName = `college-${newSlug}`;

        const { data, error } = await supabase
          .from('colleges')
          .insert({ 
            name, 
            short_name: shortName, 
            slug: newSlug, 
            storage_bucket: bucketName,
            is_active: true 
          })
          .select()
          .single();
          
        if (error) return res.status(500).json({ error: error.message });
        
        if (adminEmail && adminPassword) {
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          const { error: adminError } = await supabase
            .from('admin_credentials')
            .insert({
              college_id: data.id,
              admin_email: adminEmail.trim().toLowerCase(),
              password_hash: hashedPassword,
              secret_key: '',
              is_active: true,
              role: 'client_admin'
            });

          if (adminError) {
            console.error("Failed to create admin auth for new college:", adminError);
          }
        }

        return res.json({
          id: data.id,
          name: data.name,
          shortName: data.short_name,
          slug: data.slug,
          isActive: data.is_active,
          createdAt: data.created_at
        });
      }
    }
    
    if (req.method === 'DELETE' && sub1) {
      const { error } = await supabase.from('colleges').delete().eq('id', sub1);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }
  }

  // ── SUPER ADMIN LOGOUT ────────────────────────────────────────────────────
  if (collegeSlug === 'super-admin' && resource === 'logout' && req.method === 'POST') {
    return res.json({ success: true });
  }

  // ── SUPER ADMIN RECENT REGISTRATIONS ──────────────────────────────────────
  if (collegeSlug === 'super-admin' && resource === 'recent-registrations' && req.method === 'GET') {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, created_at, colleges(name)')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (error) return res.status(500).json({ error: error.message });
    
    // Flatten the college name for the frontend
    const flattened = data.map((p: any) => ({
      ...p,
      collegeName: p.colleges?.name || 'Unknown'
    }));
    
    return res.json(flattened);
  }

  // Safety check: for all other routes, we MUST have a valid college
  if (!col) return res.status(404).json({ error: 'College context required' });
  colId = col.id;

  // ── AUTH ──────────────────────────────────────────────────────────────────
  // Handle Student/Visitor Login via Email OR Library Card
  if (resource === 'auth' && subResource === 'login' && req.method === 'POST') {
    const { email, password, collegeCardId } = req.body || {};
    
    // College Card Login
    if (collegeCardId) {
      const { data: cards } = await supabase
        .from('library_card_applications')
        .select('*')
        .ilike('card_number', collegeCardId)
        .eq('college_id', colId)
        .order('created_at', { ascending: false });

      if (!cards || cards.length === 0)
        return res.status(401).json({ error: 'Card ID not found.' });

      const approved = cards.find((c: any) => c.status === 'approved');
      const suspended = cards.find((c: any) => c.status === 'suspended');
      const pending = cards.find((c: any) => c.status === 'pending');

      // Priority checks:
      if (!approved && suspended)
        return res.status(403).json({ error: 'Your card has been suspended. Please visit the college.' });

      if (!approved && pending)
        return res.status(403).json({ error: 'Your card is pending approval. Please wait for admin.' });

      if (!approved)
        return res.status(401).json({ error: 'Card not found.' });

      // Verify password (plaintext compared against bcrypt hash)
      const match = await bcrypt.compare(String(password), String(approved.password));
      console.log('[LOGIN] bcrypt match:', match, 'cardNumber:', approved.card_number);
      if (!match) return res.status(401).json({ error: 'Incorrect password.' });

      return res.json({
        redirect: `/${collegeSlug}`,
        role: 'user',
        isLibraryCard: true,
        cardNumber: approved.card_number,
        firstName: approved.first_name,
        lastName: approved.last_name,
        name: `${approved.first_name} ${approved.last_name}`,
        userId: approved.id
      });
    }

    // Default Email Login
    if (email && password && !collegeCardId) {
      // ── Super Admin Check (FIRST — before any college check) ──────────
      const { data: superAdmin } = await supabase
        .from('admin_credentials')
        .select('id, admin_email, password_hash, role')
        .eq('admin_email', email.trim().toLowerCase())
        .eq('role', 'developer')
        .eq('is_active', true)
        .maybeSingle();

      if (superAdmin) {
        const match = await bcrypt.compare(String(password), String(superAdmin.password_hash));
        if (match) {
          return res.json({
            redirect: '/super-admin/dashboard',
            role: 'superadmin',
            email: superAdmin.admin_email,
            userId: superAdmin.id
          });
        }
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // ── College Admin Check ────────────────────────────────────────────
      const { data: admin } = await supabase
        .from('admin_credentials')
        .select('id, admin_email, password_hash, role')
        .eq('admin_email', email.trim().toLowerCase())
        .eq('college_id', colId)
        .eq('role', 'client_admin')
        .eq('is_active', true)
        .maybeSingle();

      if (admin) {
        const match = await bcrypt.compare(String(password), String(admin.password_hash));
        if (match) {
          return res.json({
            redirect: `/${collegeSlug}/admin-dashboard`,
            role: 'admin',
            userId: admin.id,
            collegeSlug
          });
        }
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      // ── Regular User Check ────────────────────────────────────────────
      const { data: userAccount } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('college_id', colId)
        .maybeSingle();
      
      if (userAccount && (await bcrypt.compare(String(password), String(userAccount.password)))) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userAccount.id)
          .maybeSingle();
        
        return res.json({ 
          redirect: `/${collegeSlug}`, 
          role: profile?.role || 'visitor', 
          name: profile?.full_name || 'User',
          userId: userAccount.id, 
          collegeSlug 
        });
      }
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Route: GET /api/:slug/auth/check-email?email=...
  if (resource === 'auth' && subResource === 'check-email' && req.method === 'GET') {
    const email = (req.query?.email as string || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return res.json({ available: true });
    
    // Check ACTIVE card with same email in THIS college
    const { data: existing } = await supabase
      .from('library_card_applications')
      .select('id, status')
      .eq('email', email)
      .eq('college_id', colId)
      .in('status', ['pending', 'approved']) // suspended = email is free again
      .maybeSingle();

    return res.json({ available: !existing });
  }

  // Route: POST /api/:slug/auth/register
  if (resource === 'auth' && subResource === 'register' && req.method === 'POST') {
    const { fullName, email, password, phone, classification } = req.body || {};
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Check if email exists in 'users'
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).eq('college_id', colId).maybeSingle();
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Insert into 'users'
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        college_id: colId
      })
      .select('id')
      .single();

    if (userError || !newUser) {
      console.error('[REGISTRATION] Error creating user account:', userError);
      return res.status(500).json({ error: 'Registration failed during account creation' });
    }

    // 4. Insert into 'profiles'
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: newUser.id,
        full_name: fullName,
        phone,
        role: classification || 'visitor',
        college_id: colId
      });

    if (profileError) {
      console.error('[REGISTRATION] Error creating profile:', profileError);
      // We don't rollback 'users' to keep it simple, but log it
    }

    return res.json({ 
      success: true, 
      message: 'Registration successful',
      userId: newUser.id,
      name: fullName,
      email: email,
      role: classification || 'visitor'
    });
  }

  // ── PUBLIC DATA ROUTES ────────────────────────────────────────────────────
  if (req.method === 'GET' && resource !== 'admin') {
    // 1a. Home FAQs (must be checked before generic home block)
    if (resource === 'home' && sub1 === 'faqs') {
      const { data } = await supabase
        .from('home_faqs').select('id, question, answer, display_order')
        .eq('college_id', colId).eq('is_active', true)
        .order('display_order', { ascending: true });
      return res.json(data || []);
    }

    // 1. Full Home Data (content, slider, stats, affiliations)
    if (resource === 'home' && !subResource) {
      const [{ data: c }, { data: sl }, { data: st }, { data: af }, { data: programs }, { data: examPaper }, { data: examLinks }] = await Promise.all([
        supabase.from('home_content').select('*').eq('college_id', colId).maybeSingle(),
        supabase.from('home_slider_images').select('*').eq('college_id', colId).eq('is_active', true).order('order'),
        supabase.from('home_stats').select('*').eq('college_id', colId).order('order'),
        supabase.from('home_affiliations').select('*').eq('college_id', colId).eq('is_active', true).order('order'),
        supabase.from('home_academic_programs').select('*').eq('college_id', colId).order('display_order', { ascending: true }),
        supabase.from('home_exam_papers').select('*').eq('college_id', colId).maybeSingle(),
        supabase.from('home_exam_links').select('*').eq('college_id', colId).order('display_order')
      ]);
      return res.json({
        content: {
          heroHeading: c?.hero_heading, heroSubheading: c?.hero_subheading, heroOverlayText: c?.hero_overlay_text,
          featuresHeading: c?.features_heading, featuresSubheading: c?.features_subheading,
          affiliationsHeading: c?.affiliations_heading, ctaHeading: c?.cta_heading, ctaSubheading: c?.cta_subheading,
          heroTagline: c?.hero_tagline || '', heroTaglineEnabled: c?.hero_tagline_enabled || false,
          academicSectionEnabled: c?.academic_section_enabled ?? true, academicSectionHeading: c?.academic_section_heading || 'Academic Programs',
          academicSectionSubheading: c?.academic_section_subheading || 'Excellence in Education',
          examSectionEnabled: c?.exam_section_enabled ?? true, examSectionHeading: c?.exam_section_heading || 'Examination Papers'
        },
        slider: (sl || []).map(s => ({ id: s.id, imageUrl: s.image_url, order: s.order, isActive: s.is_active })),
        stats: (st || []).map(s => ({ id: s.id, number: s.number, label: s.label, icon: s.icon, iconUrl: s.icon_url, color: s.color, order: s.order })),
        affiliations: (af || []).map(a => ({ id: a.id, name: a.name, logoUrl: a.logo_url, link: a.link, order: a.order, isActive: a.is_active })),
        programs: programs || [],
        examPaper: examPaper ? { 
          ...examPaper, 
          is_enabled: !!examPaper.is_enabled,
          id: examPaper.id || 'default',
          title: examPaper.title || 'Download Exam Paper',
          button_text: examPaper.button_text || 'Download'
        } : { is_enabled: false, title: 'Download Exam Paper', button_text: 'Download', pdf_url: '' },
        examLinks: (examLinks || []).map(l => ({
          ...l,
          title: l.title || 'Exam Paper',
          buttonText: l.button_text,
          url: l.url || l.pdf_url // Handle mixed field names during transition
        }))
      });
    }

    // GET /api/:slug/home/academic-programs
    if (isApi && resource === 'home' && sub1 === 'academic-programs' && req.method === 'GET') {
        if (!colId) return res.status(404).json({ error: 'Not found' });
      const { data } = await supabase.from('home_academic_programs')
        .select('*').eq('college_id', colId)
        .order('display_order', { ascending: true });
      return res.json(data || []);
    }

    // GET /api/:slug/home/exam-paper
    if (isApi && resource === 'home' && sub1 === 'exam-paper' && req.method === 'GET') {
        if (!colId) return res.status(404).json({ error: 'Not found' });
      const { data } = await supabase.from('home_exam_papers')
        .select('*').eq('college_id', colId).maybeSingle();
      return res.json(data || { is_enabled: false, title: '', button_text: '', pdf_url: '' });
    }

    // 2. Site Settings (for CollegeContext)
    if (resource === 'settings') {
      const { data: d } = await supabase.from('site_settings').select('*').eq('college_id', colId).maybeSingle();
      if (!d) return res.json({});
      return res.json({
        id: d.id, primaryColor: d.primary_color || '#006600', navbarLogo: d.navbar_logo, loadingLogo: d.loading_logo,
        instituteShortName: d.institute_short_name, instituteFullName: d.institute_full_name,
        footerTitle: d.footer_title, footerDescription: d.footer_description,
        facebookUrl: d.facebook_url, twitterUrl: d.twitter_url, instagramUrl: d.instagram_url, youtubeUrl: d.youtube_url,
        creditsText: d.credits_text, contributorsText: d.contributors_text, contactAddress: d.contact_address,
        contactPhone: d.contact_phone, contactEmail: d.contact_email, mapEmbedUrl: d.map_embed_url, googleMapLink: d.google_map_link,
        footerTagline: d.footer_tagline, heroBackgroundLogo: d.hero_background_logo, heroBackgroundOpacity: d.hero_background_opacity,
        cardHeaderText: d.card_header_text, cardSubheaderText: d.card_subheader_text, cardLogoUrl: d.card_logo_url,
        cardQrEnabled: d.card_qr_enabled, cardQrUrl: d.card_qr_url, cardTermsText: d.card_terms_text,
        cardContactAddress: d.card_contact_address, cardContactEmail: d.card_contact_email, cardContactPhone: d.card_contact_phone,
        cardAuthorityLine1: d.card_authority_line1, cardAuthorityLine2: d.card_authority_line2,
        rbWatermarkText: d.rb_watermark_text, rbWatermarkOpacity: d.rb_watermark_opacity, rbDisclaimerText: d.rb_disclaimer_text,
        rbWatermarkEnabled: d.rb_watermark_enabled, easypaisaNumber: d.easypaisa_number, bankAccountNumber: d.bank_account_number,
        accountTitle: d.account_title,
        termCardMenu: d.term_card_menu || 'College Card',
        termInstitution: d.term_institution || 'College',
        termPrincipal: d.term_principal || 'Principal',
        officeHours: d.office_hours || 'Mon–Fri: 9:00 AM – 1:00 PM\nSat: 9:00 AM – 12:00 PM\nSun: Closed',
        blogHeading: d.blog_heading || 'College News & Updates',
        blogDescription: d.blog_description || 'Stay informed with the latest academic updates',
        notesHeading: d.notes_heading || 'Study Notes',
        notesDescription: d.notes_description || 'Download notes shared by our faculty',
        eventsHeading: d.events_heading || 'Events',
        eventsDescription: d.events_description || 'Stay updated with upcoming college events',
        notificationsHeading: d.notifications_heading || 'Notifications',
        notificationsDescription: d.notifications_description || 'Official announcements and updates',
        contactHeading: d.contact_heading || 'Contact Us',
        contactDescription: d.contact_description || 'Get in touch with us for official information and student support',
      });
    }

    // 3. History
    if (resource === 'history') {
      if (subResource === 'page') {
        const { data } = await supabase.from('college_history_page').select('*').eq('college_id', colId).maybeSingle();
        return res.json(data || { title: 'History of College', subtitle: '' });
      }
      if (subResource === 'sections') {
        const { data } = await supabase.from('college_history_sections').select('*').eq('college_id', colId).order('display_order');
        return res.json((data || []).map(s => ({ id: s.id, title: s.title, description: s.description, imageUrl: s.image_url, iconName: s.icon_name, layoutType: s.layout_type, displayOrder: s.display_order })));
      }
      if (subResource === 'gallery') {
        const { data } = await supabase.from('college_history_gallery').select('*').eq('college_id', colId).order('display_order');
        return res.json((data || []).map(g => ({ id: g.id, imageUrl: g.image_url, caption: g.caption, displayOrder: g.display_order })));
      }
    }

    // 4. Standard Modules
    if (resource === 'books') {
      const { data } = await supabase.from('books').select('*').eq('college_id', colId).order('created_at', { ascending: false });
      return res.json((data || []).map((b: any) => ({
        id: b.id,
        bookName: b.book_name,
        authorName: b.author_name,
        shortIntro: b.short_intro,
        description: b.description,
        bookImage: b.book_image,
        totalCopies: Number(b.total_copies) || 0,
        availableCopies: Number(b.available_copies) || 0,
        createdAt: b.created_at
      })));
    }
    if (resource === 'events') {
      const { data } = await supabase.from('events').select('*').eq('college_id', colId).order('date', { ascending: false });
      return res.json((data || []).map(e => ({ id: e.id, title: e.title, description: e.description, images: e.images, date: e.date })));
    }
    if (resource === 'blog') {
      // Individual blog post by slug or id
      if (subResource && !['stream'].includes(subResource)) {
        const { data: post } = await supabase.from('blog_posts').select('*').eq('college_id', colId).eq('slug', subResource).eq('status', 'published').maybeSingle();
        if (!post) return res.status(404).json({ error: 'Post not found' });
        return res.json({ id: post.id, title: post.title, slug: post.slug, shortDescription: post.short_description, content: post.content, featuredImage: post.featured_image, createdAt: post.created_at, isPinned: post.is_pinned });
      }
      const { data } = await supabase.from('blog_posts').select('*').eq('college_id', colId).eq('status', 'published').order('created_at', { ascending: false });
      return res.json((data || []).map((p: any) => ({ id: p.id, title: p.title, slug: p.slug, shortDescription: p.short_description, featuredImage: p.featured_image, createdAt: p.created_at })));
    }
    if (resource === 'notifications') {
      const { data } = await supabase.from('notifications').select('*').eq('college_id', colId).eq('status', 'published').order('pin', { ascending: false }).order('created_at', { ascending: false });
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
        // Ensure filename is decoded and handles potential '+' as space
        fileName = decodeURIComponent(fileName.replace(/\+/g, ' '));
        
        let { data, error } = await supabase.storage.from(bucket).download(fileName);
        
        // Robust fallback: if initial attempt fails, try common alternative buckets
        if (error) {
          const alternatives = ['rare-books', 'rare-books-pdfs', 'rare-book-reader', 'rare-books-covers'].filter(b => b !== bucket);
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
      const { data } = await supabase.from('rare_books').select('*').eq('college_id', colId).eq('status', 'active');
      return res.json((data || []).map((b: any) => ({ id: b.id, title: b.title, description: b.description, category: b.category, pdfPath: b.pdf_path, coverImage: b.cover_image })));
    }
    if (resource === 'notes') {
      const { data } = await supabase.from('notes').select('*').eq('college_id', colId).eq('status', 'active');
      return res.json((data || []).map(n => ({ id: n.id, title: n.title, description: n.description, subject: n.subject, class: n.class, pdfPath: n.pdf_path })));
    }
    if (resource === 'faculty') {
      const { data } = await supabase.from('faculty_staff').select('*').eq('college_id', colId);
      return res.json((data || []).map(f => ({ id: f.id, name: f.name, designation: f.designation, description: f.description, imageUrl: f.image_url })));
    }
    if (resource === 'principal') {
      const { data } = await supabase.from('principal').select('*').eq('college_id', colId).maybeSingle();
      return res.json(data ? { id: data.id, name: data.name, message: data.message, imageUrl: data.image_url } : {});
    }

    // 5. Library Card Fields (for dynamic forms)
    if (resource === 'library-card-fields') {
      const { data, error } = await supabase
        .from('library_card_fields')
        .select('*')
        .eq('college_id', colId)
        .eq('show_on_form', true)
        .order('display_order', { ascending: true });

      if (error) return res.status(500).json({ error: error.message });

      return res.json((data || []).map((f: any) => ({
        id: f.id,
        fieldLabel: f.field_label,
        fieldKey: f.field_key,
        fieldType: f.field_type,
        isRequired: f.is_required,
        showOnForm: f.show_on_form,
        displayOrder: f.display_order,
        options: Array.isArray(f.options) ? f.options : []
      })));
    }
  }

  // ── CONTACT MESSAGES (POST & GET) ─────────────────────────────────────────────
  if (resource === 'contact-messages' && !subResource) {
    if (req.method === 'POST') {
      const { name, email, subject, message } = req.body || {};
      const { error } = await supabase.from('contact_messages').insert({
        college_id: colId,
        name,
        email: (email || '').toLowerCase(),
        subject,
        message,
        is_seen: false
      });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }
    
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('college_id', colId)
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json((data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        isSeen: m.is_seen,
        createdAt: m.created_at
      })));
    }
  }

  // ─── POST /api/:slug/library-card-applications ───────────────────────────
  if (resource === 'library-card-applications' && !subResource && req.method === 'POST') {
    // 1. Get college (with short_name for student ID prefix)
    const { data: college, error: colErr } = await supabase
      .from('colleges')
      .select('id, short_name')
      .eq('slug', collegeSlug)
      .maybeSingle();

    if (colErr || !college) {
      console.error('[CARD POST] College not found for slug:', collegeSlug);
      return res.status(404).json({ error: 'College not found' });
    }

    // 2. Read body
    const b = req.body || {};
    const email = (b.email || '').trim().toLowerCase();
    console.log('[CARD POST] email:', email, 'field:', b.field, 'rollNo:', b.rollNo, 'class:', b.class);

    // 3. Check for existing ACTIVE card with same email
    const { data: activeCard } = await supabase
      .from('library_card_applications')
      .select('id, status')
      .eq('email', email)
      .eq('college_id', college.id)
      .in('status', ['pending', 'approved'])
      .maybeSingle();

    if (activeCard) {
      return res.status(400).json({ error: 'An active college card already exists for this email.' });
    }

    // 4. Generate card number: CS-E10-12
    const fieldMap: Record<string, string> = {
      'Computer Science': 'CS', 'Pre-Medical': 'PM',
      'Pre-Engineering': 'PE', 'Humanities': 'HM', 'Commerce': 'COM'
    };
    const fieldCode = fieldMap[b.field] || (b.field || 'XX').substring(0, 3).toUpperCase();
    const rollNo = (b.rollNo || b.roll_no || '').trim();
    const classNum = (b.class || '').replace(/^Class\s*/i, '').trim();
    let cardNumber = `${fieldCode}-${rollNo}-${classNum}`;

    // 5. Ensure card number is unique
    for (let i = 1; i <= 10; i++) {
      const { data: dup } = await supabase
        .from('library_card_applications')
        .select('id').eq('card_number', cardNumber).eq('college_id', college.id).maybeSingle();
      if (!dup) break;
      cardNumber = `${fieldCode}-${rollNo}-${classNum}-${i}`;
    }

    // 6. Generate student ID (sequential per college) and dates
    const { count: cardCount } = await supabase
      .from('library_card_applications')
      .select('id', { count: 'exact', head: true })
      .eq('college_id', college.id);

    const nextSeq = (cardCount || 0) + 1;
    const shortName = (college.short_name || slug).toUpperCase();
    const studentId = `${shortName}-${nextSeq}`;
    const issueDate = new Date().toISOString().split('T')[0];
    const validThrough = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 7. Hash password
    let hashedPassword: string | null = null;
    if (b.password) {
      hashedPassword = await bcrypt.hash(String(b.password), 10);
    }

    // 8. Build insert object — explicit column names
    const insertRow = {
      college_id:     college.id,
      first_name:     b.firstName   || b.first_name   || '',
      last_name:      b.lastName    || b.last_name    || '',
      father_name:    b.fatherName  || b.father_name  || '',
      dob:            b.dob         || null,
      class:          b.class       || '',
      field:          b.field       || '',
      roll_no:        rollNo,
      email:          email,
      phone:          b.phone       || '',
      address_street: b.addressStreet || b.address_street || '',
      address_city:   b.addressCity   || b.address_city   || '',
      address_state:  b.addressState  || b.address_state  || '',
      address_zip:    b.addressZip    || b.address_zip    || '',
      password:       hashedPassword,
      card_number:    cardNumber,
      student_id:     studentId,
      issue_date:     issueDate,
      valid_through:  validThrough,
      status:         'pending',
      dynamic_fields: b.dynamicFields || b.dynamic_fields || {},
    };

    console.log('[CARD POST] Inserting card_number:', cardNumber, 'student_id:', studentId);

    // 9. Insert
    const { data: newCard, error: insertErr } = await supabase
      .from('library_card_applications')
      .insert(insertRow)
      .select('id, card_number, student_id, issue_date, valid_through, status')
      .single();

    if (insertErr) {
      console.error('[CARD INSERT ERROR]', insertErr.message, insertErr.details, insertErr.hint);
      return res.status(500).json({ error: insertErr.message });
    }

    console.log('[CARD POST] Success! id:', newCard.id, 'card:', newCard.card_number);

    // 10. Return success
    return res.json({
      id:           newCard.id,
      cardNumber:   newCard.card_number,
      studentId:    newCard.student_id,
      issueDate:    newCard.issue_date,
      validThrough: newCard.valid_through,
      status:       newCard.status
    });
  }

  // ── BOOK BORROWING (CARD USERS & ADMINS) ──────────────────────────────────
  // POST /api/:slug/books/:bookId/borrow
  if (resource === 'books' && sub2 === 'borrow' && req.method === 'POST') {
    const b = req.body || {};
    const token = req.headers['x-admin-token'] as string;
    const isAdminToken = token === (process.env.ADMIN_API_TOKEN || 'gcfm-admin-token-2026');
    const isCardUser = !!(b.libraryCardId || b.cardNumber);

    if (!isAdminToken && !isCardUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: book } = await supabase.from('books').select('*')
      .eq('id', subResource).eq('college_id', colId).maybeSingle();
    
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (book.available_copies < 1) return res.status(400).json({ error: 'No copies available' });

    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: borrow, error: borrowErr } = await supabase
      .from('book_borrows')
      .insert({
        college_id: colId,
        book_id: subResource,
        book_title: book.book_name,
        borrower_name: b.borrowerName || b.name || 'Student',
        borrower_email: b.borrowerEmail || b.email || '',
        borrower_phone: b.borrowerPhone || b.phone || '',
        library_card_id: b.libraryCardId || b.cardNumber || null,
        user_id: b.userId || null,
        borrow_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        status: 'borrowed'
      })
      .select('*').single();

    if (borrowErr) return res.status(500).json({ error: borrowErr.message });

    await supabase.from('books')
      .update({ available_copies: book.available_copies - 1 })
      .eq('id', subResource);

    return res.json({
      id: borrow.id,
      bookTitle: borrow.book_title,
      dueDate: borrow.due_date,
      status: borrow.status
    });
  }

  // GET /api/:slug/home/faqs — public route
  if (isApi && resource === 'home' && sub1 === 'faqs' && !sub2 && req.method === 'GET') {
    if (!colId) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase
      .from('home_faqs').select('id, question, answer, display_order')
      .eq('college_id', colId).eq('is_active', true)
      .order('display_order', { ascending: true });
    return res.json(data || []);
  }

  // GET /api/:slug/exam-papers — all groups for public
  if (isApi && resource === 'exam-papers' && !sub1 && req.method === 'GET') {
    if (!colId) return res.status(404).json({ error: 'Not found' });

    const { data: groups } = await supabase
      .from('exam_paper_groups').select('*')
      .eq('college_id', colId).eq('is_enabled', true)
      .order('display_order');

    return res.json(groups || []);
  }

  // GET /api/:slug/exam-papers/:groupId/classes — get classes + subjects for popup
  if (isApi && resource === 'exam-papers' && sub1 && sub2 === 'classes' && req.method === 'GET') {
    if (!colId) return res.status(404).json({ error: 'Not found' });

    const { data: classes } = await supabase
      .from('exam_paper_classes').select('*')
      .eq('group_id', sub1).eq('college_id', colId)
      .order('display_order');

    // Get subjects for each class:
    const classesWithSubjects = await Promise.all(
      (classes || []).map(async (cls: any) => {
        const { data: subjects } = await supabase
          .from('exam_paper_subjects').select('*')
          .eq('class_id', cls.id).eq('college_id', colId);
        return { ...cls, subjects: subjects || [] };
      })
    );

    return res.json(classesWithSubjects);
  }

  // ── ADMIN PROTECTED ROUTES ────────────────────────────────────────────────
  if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

  // GET /api/:slug/admin/faqs — admin route
  if (isApi && resource === 'admin' && sub1 === 'faqs' && !sub2 && req.method === 'GET') {
    if (!colId) return res.status(404).json({ error: 'College not found' });
    const { data } = await supabase
      .from('home_faqs').select('*')
      .eq('college_id', colId)
      .order('display_order', { ascending: true });
    return res.json(data || []);
  }

  // POST /api/:slug/admin/faqs — add new FAQ
  if (isApi && resource === 'admin' && sub1 === 'faqs' && !sub2 && req.method === 'POST') {
    if (!colId) return res.status(404).json({ error: 'College not found' });
    const { question, answer, displayOrder } = req.body || {};
    if (!question || !answer) return res.status(400).json({ error: 'Question and answer required' });
    const { data, error } = await supabase.from('home_faqs')
      .insert({ college_id: colId, question, answer, display_order: displayOrder || 0, is_active: true })
      .select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // PATCH /api/:slug/admin/faqs/:id — update FAQ
  if (isApi && resource === 'admin' && sub1 === 'faqs' && sub2 && !sub3 && req.method === 'PATCH') {
    if (!colId) return res.status(404).json({ error: 'College not found' });
    const { question, answer } = req.body || {};
    const { data, error } = await supabase.from('home_faqs')
      .update({ question, answer, updated_at: new Date().toISOString() })
      .eq('id', sub2).eq('college_id', colId)
      .select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // DELETE /api/:slug/admin/faqs/:id — delete FAQ
  if (req.method === 'DELETE' && isApi && resource === 'admin' && sub1 === 'faqs' && sub2 && !sub3) {
    if (!colId) return res.status(404).json({ error: 'College not found' });
    await supabase.from('home_faqs').delete().eq('id', sub2).eq('college_id', colId);
    return res.json({ success: true });
  }

  // GET /api/:slug/admin/academic-programs
  if (isApi && resource === 'admin' && sub1 === 'academic-programs' && !sub2 && req.method === 'GET') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { data } = await supabase.from('home_academic_programs')
      .select('*').eq('college_id', colId).order('display_order');
    return res.json(data || []);
  }

  // POST /api/:slug/admin/academic-programs
  if (isApi && resource === 'admin' && sub1 === 'academic-programs' && !sub2 && req.method === 'POST') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { title, subjects, icon, displayOrder } = req.body || {};
    const { data, error } = await supabase.from('home_academic_programs')
      .insert({ college_id: colId, title, subjects, icon: icon || 'BookOpen', display_order: displayOrder || 0 })
      .select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // PATCH /api/:slug/admin/academic-programs/:id
  if (isApi && resource === 'admin' && sub1 === 'academic-programs' && sub2 && req.method === 'PATCH') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { title, subjects, icon } = req.body || {};
    const { data, error } = await supabase.from('home_academic_programs')
      .update({ title, subjects, icon })
      .eq('id', sub2).eq('college_id', colId).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // DELETE /api/:slug/admin/academic-programs/:id
  if (req.method === 'DELETE' && isApi && resource === 'admin' && sub1 === 'academic-programs' && sub2) {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    await supabase.from('home_academic_programs').delete().eq('id', sub2).eq('college_id', colId);
    return res.json({ success: true });
  }

  // PATCH /api/:slug/admin/exam-paper
  if (isApi && resource === 'admin' && sub1 === 'exam-paper' && !sub2 && req.method === 'PATCH') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const body = req.body || {};
    
    // Unified mapping for both camelCase and snake_case
    const title = body.title || body.titleText || '';
    const button_text = body.buttonText || body.button_text || '';
    const pdf_url = body.pdfUrl || body.pdf_url || '';
    const is_enabled = body.isEnabled !== undefined ? !!body.isEnabled : !!body.is_enabled;

    if (!colId) return res.status(404).json({ error: 'College not found' });

    // 1. Check if record exists
    const { data: existing } = await supabase.from('home_exam_papers')
      .select('id').eq('college_id', colId).maybeSingle();

    let error;
    if (existing) {
      // 2. Update existing
      const { error: err } = await supabase.from('home_exam_papers')
        .update({ 
          title, 
          button_text, 
          pdf_url, 
          is_enabled, 
          updated_at: new Date().toISOString() 
        })
        .eq('college_id', colId);
      error = err;
    } else {
      // 3. Insert new
      const { error: err } = await supabase.from('home_exam_papers')
        .insert({ 
          college_id: colId, 
          title, 
          button_text, 
          pdf_url, 
          is_enabled 
        });
      error = err;
    }

    if (error) {
      console.error('[EXAM PAPER SAVE ERROR]', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  }

  // --- NEW: Multi-Link Exam Paper Management ---

  // GET /api/:slug/admin/exam-links
  if (isApi && resource === 'admin' && sub1 === 'exam-links' && !sub2 && req.method === 'GET') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { data } = await supabase.from('home_exam_links').select('*').eq('college_id', colId).order('display_order');
    return res.json(data || []);
  }

  // POST /api/:slug/admin/exam-links
  if (isApi && resource === 'admin' && sub1 === 'exam-links' && !sub2 && req.method === 'POST') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { title, buttonText, url, isEnabled, displayOrder } = req.body || {};
    const { data, error } = await supabase.from('home_exam_links').insert({
      college_id: colId,
      title: title || 'Examination Paper',
      button_text: buttonText || 'Access Papers',
      url: url || '',
      is_enabled: isEnabled !== undefined ? isEnabled : true,
      display_order: displayOrder || 0
    }).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // PATCH /api/:slug/admin/exam-links/:id
  if (isApi && resource === 'admin' && sub1 === 'exam-links' && sub2 && req.method === 'PATCH') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { title, buttonText, url, isEnabled, displayOrder } = req.body || {};
    const updatePayload: any = {};
    if (title !== undefined) updatePayload.title = title;
    if (buttonText !== undefined) updatePayload.button_text = buttonText;
    if (url !== undefined) updatePayload.url = url;
    if (isEnabled !== undefined) updatePayload.is_enabled = isEnabled;
    if (displayOrder !== undefined) updatePayload.display_order = displayOrder;
    updatePayload.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('home_exam_links')
      .update(updatePayload)
      .eq('id', sub2).eq('college_id', colId).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // DELETE /api/:slug/admin/exam-links/:id
  if (isApi && resource === 'admin' && sub1 === 'exam-links' && sub2 && req.method === 'DELETE') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    await supabase.from('home_exam_links').delete().eq('id', sub2).eq('college_id', colId);
    return res.json({ success: true });
  }

  // ── Admin Exam Papers ──

  // GET /api/:slug/admin/exam-papers — all groups for admin
  if (isApi && resource === 'admin' && sub1 === 'exam-papers' && !sub2 && req.method === 'GET') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { data } = await supabase.from('exam_paper_groups').select('*')
      .eq('college_id', colId).order('display_order');
    return res.json(data || []);
  }

  // POST /api/:slug/admin/exam-papers — add new group
  if (isApi && resource === 'admin' && sub1 === 'exam-papers' && !sub2 && req.method === 'POST') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { title, buttonText, displayOrder } = req.body || {};
    const { data, error } = await supabase.from('exam_paper_groups')
      .insert({ college_id: colId, title: title || 'New Group', button_text: buttonText || 'Access Now', is_enabled: true, display_order: displayOrder || 0 })
      .select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // PATCH /api/:slug/admin/exam-papers/:id — update group
  if (isApi && resource === 'admin' && sub1 === 'exam-papers' && sub2 && sub3 !== 'classes' && req.method === 'PATCH') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { title, buttonText, isEnabled, displayOrder } = req.body || {};
    await supabase.from('exam_paper_groups')
      .update({ title, button_text: buttonText, is_enabled: isEnabled, display_order: displayOrder || 0, updated_at: new Date().toISOString() })
      .eq('id', sub2).eq('college_id', colId);
    return res.json({ success: true });
  }

  // DELETE /api/:slug/admin/exam-papers/:id
  if (req.method === 'DELETE' && isApi && resource === 'admin' && sub1 === 'exam-papers' && sub2 && !sub3) {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    await supabase.from('exam_paper_groups').delete().eq('id', sub2).eq('college_id', colId);
    return res.json({ success: true });
  }

  // GET /api/:slug/admin/exam-papers/:groupId/classes
  if (isApi && resource === 'admin' && sub1 === 'exam-papers' && sub2 && sub3 === 'classes' && req.method === 'GET') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { data: classes } = await supabase.from('exam_paper_classes').select('*')
      .eq('group_id', sub2).eq('college_id', colId).order('display_order');
    const withSubjects = await Promise.all((classes || []).map(async (cls: any) => {
      const { data: subjects } = await supabase.from('exam_paper_subjects').select('*')
        .eq('class_id', cls.id).eq('college_id', colId);
      return { ...cls, subjects: subjects || [] };
    }));
    return res.json(withSubjects);
  }

  // POST /api/:slug/admin/exam-papers/:groupId/classes — add class
  if (isApi && resource === 'admin' && sub1 === 'exam-papers' && sub2 && sub3 === 'classes' && req.method === 'POST') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { className, displayOrder } = req.body || {};
    const { data, error } = await supabase.from('exam_paper_classes')
      .insert({ group_id: sub2, college_id: colId, class_name: className, display_order: displayOrder || 0 })
      .select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // DELETE /api/:slug/admin/exam-classes/:classId
  if (req.method === 'DELETE' && isApi && resource === 'admin' && sub1 === 'exam-classes' && sub2) {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    await supabase.from('exam_paper_classes').delete().eq('id', sub2).eq('college_id', colId);
    return res.json({ success: true });
  }

  // POST /api/:slug/admin/exam-subjects — add subject with PDF
  if (isApi && resource === 'admin' && sub1 === 'exam-subjects' && !sub2 && req.method === 'POST') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    const { classId, subjectName, pdfUrl, fileSizeKb } = req.body || {};
    const { data, error } = await supabase.from('exam_paper_subjects')
      .insert({ class_id: classId, college_id: colId, subject_name: subjectName, pdf_url: pdfUrl, file_size_kb: fileSizeKb || 0 })
      .select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  // DELETE /api/:slug/admin/exam-subjects/:subjectId
  if (req.method === 'DELETE' && isApi && resource === 'admin' && sub1 === 'exam-subjects' && sub2) {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    // Delete PDF from Cloudinary:
    const { data: subject } = await supabase.from('exam_paper_subjects')
      .select('pdf_url').eq('id', sub2).maybeSingle();
    // Assuming deleteStorageFile is already imported/in-scope
    if (subject?.pdf_url) await deleteStorageFile(subject.pdf_url);
    await supabase.from('exam_paper_subjects').delete().eq('id', sub2).eq('college_id', colId);
    return res.json({ success: true });
  }

  // 1. Admin Universal Upload (Cloudinary)
  if (parts[2] === 'admin' && parts[3] === 'upload' && req.method === 'POST') {
    const token = req.headers['x-admin-token'];
    if (token !== (process.env.ADMIN_API_TOKEN || 'gcfm-admin-token-2026'))
      return res.status(403).json({ error: 'Unauthorized' });

    const { file, filename, mimetype, category } = req.body || {};
    if (!file) return res.status(400).json({ error: 'No file provided' });

    const isPDF = mimetype === 'application/pdf' || filename?.endsWith('.pdf');

    try {
      // Upload to Cloudinary:
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `colleges/${slug}/${category || 'uploads'}`,
            resource_type: isPDF ? 'raw' : 'image',
            // Auto-optimize images:
            ...(isPDF ? {} : {
              transformation: [
                { quality: 'auto', fetch_format: 'webp' },
                { width: 1200, crop: 'limit' }
              ]
            }),
            public_id: `${Date.now()}-${(filename || 'file').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_')}`
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        // Write base64 buffer to stream:
        const buffer = Buffer.from(file, 'base64');
        uploadStream.end(buffer);
      });

      return res.json({
        url: result.secure_url,
        publicId: result.public_id
      });

    } catch (err: any) {
      console.error('[CLOUDINARY ERROR]', err.message);
      // Common errors:
      if (err.message?.includes('Invalid API key')) {
        return res.status(500).json({ error: 'Cloudinary configuration error. Contact admin.' });
      }
      if (err.message?.includes('File size too large')) {
        return res.status(413).json({ error: 'File too large. Maximum 50MB allowed.' });
      }
      return res.status(500).json({ error: 'Upload failed: ' + err.message });
    }
  }


  // 1b. Admin Home CMS
  if (parts[2] === 'admin' && parts[3] === 'home') {
    if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const sub = parts[4]; // content, slider, stats, affiliations
    if (sub === 'content') {
      if (req.method === 'GET') {
        const { data } = await supabase.from('home_content').select('*').eq('college_id', colId).maybeSingle();
        return res.json(data ? { 
          heroHeading: data.hero_heading, heroSubheading: data.hero_subheading, heroOverlayText: data.hero_overlay_text, 
          featuresHeading: data.features_heading, featuresSubheading: data.features_subheading, 
          affiliationsHeading: data.affiliations_heading, ctaHeading: data.cta_heading, ctaSubheading: data.cta_subheading,
          heroTagline: data.hero_tagline, heroTaglineEnabled: data.hero_tagline_enabled,
          academicSectionEnabled: data.academic_section_enabled, academicSectionHeading: data.academic_section_heading,
          academicSectionSubheading: data.academic_section_subheading,
          examSectionEnabled: data.exam_section_enabled, examSectionHeading: data.exam_section_heading
        } : {});
      }
      if (req.method === 'POST') {
        const { data: existing } = await supabase.from('home_content').select('id').eq('college_id', colId).maybeSingle();
        const payload = {
          hero_heading: req.body.heroHeading, hero_subheading: req.body.heroSubheading, hero_overlay_text: req.body.heroOverlayText,
          features_heading: req.body.featuresHeading, features_subheading: req.body.featuresSubheading,
          affiliations_heading: req.body.affiliationsHeading, cta_heading: req.body.ctaHeading, cta_subheading: req.body.ctaSubheading,
          hero_tagline: req.body.heroTagline, hero_tagline_enabled: req.body.heroTaglineEnabled,
          academic_section_enabled: req.body.academicSectionEnabled, academic_section_heading: req.body.academicSectionHeading,
          academic_section_subheading: req.body.academicSectionSubheading,
          exam_section_enabled: req.body.examSectionEnabled, exam_section_heading: req.body.examSectionHeading,
          updated_at: new Date().toISOString()
        };
        if (existing) await supabase.from('home_content').update(payload).eq('id', existing.id);
        else await supabase.from('home_content').insert({ ...payload, college_id: colId });
        return res.json({ success: true });
      }
    }
    // Generic handlers for slider, stats, affiliations
    const tableMap: any = { slider: 'home_slider_images', stats: 'home_stats', affiliations: 'home_affiliations' };
    const table = tableMap[sub];
    if (table) {
      if (req.method === 'GET') {
        const { data } = await supabase.from(table).select('*').eq('college_id', colId).order('order');
        if (sub === 'slider') return res.json((data || []).map(s => ({ id: s.id, imageUrl: s.image_url, order: s.order, isActive: s.is_active })));
        if (sub === 'stats') return res.json((data || []).map(s => ({ id: s.id, label: s.label, number: s.number, icon: s.icon, color: s.color, iconUrl: s.icon_url, order: s.order })));
        if (sub === 'affiliations') return res.json((data || []).map(a => ({ id: a.id, name: a.name, logoUrl: a.logo_url, link: a.link, order: a.order, isActive: a.is_active })));
      }
      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: colId };
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
        // Cleanup storage if needed (Slider images, Affiliation logos)
        if (sub === 'slider' || sub === 'affiliations') {
          const { data: item } = await supabase.from(table).select('*').eq('id', id).single();
          const fileUrl = sub === 'slider' ? (item as any)?.image_url : (item as any)?.logo_url;
          if (fileUrl) await deleteStorageFile(fileUrl);
        }
        await supabase.from(table).delete().eq('id', id);
        return res.json({ success: true });
      }
    }
  }

  // 2. Admin History CMS
  if (parts[2] === 'admin' && parts[3] === 'history') {
    if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });
    const sub = parts[4];
    const tableMap: any = { page: 'college_history_page', sections: 'college_history_sections', gallery: 'college_history_gallery' };
    const table = tableMap[sub];
    if (table) {
      if (req.method === 'GET') {
        const { data } = await supabase.from(table).select('*').eq('college_id', colId).order('display_order');
        if (sub === 'sections') return res.json((data || []).map((s: any) => ({ id: s.id, title: s.title, description: s.description, imageUrl: s.image_url, iconName: s.icon_name, layoutType: s.layout_type, isFullWidth: s.is_full_width, displayOrder: s.display_order })));
        if (sub === 'gallery') return res.json((data || []).map((g: any) => ({ id: g.id, imageUrl: g.image_url, caption: g.caption, displayOrder: g.display_order })));
        if (sub === 'page') { const { data: d } = await supabase.from(table).select('*').eq('college_id', colId).maybeSingle(); return res.json(d || {}); }
        return res.json(data || []);
      }
      if (req.method === 'POST') {
        if (sub === 'sections') {
          const payload = {
            college_id: colId, title: req.body.title, description: req.body.description,
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
          const payload = { college_id: colId, image_url: req.body.imageUrl, caption: req.body.caption || '', display_order: req.body.displayOrder || 0 };
          await supabase.from(table).insert(payload);
          return res.json({ success: true });
        }
        if (sub === 'page') {
          const { data: existing } = await supabase.from(table).select('id').eq('college_id', colId).maybeSingle();
          const payload = { title: req.body.title, subtitle: req.body.subtitle };
          if (existing) await supabase.from(table).update(payload).eq('id', (existing as any).id);
          else await supabase.from(table).insert({ ...payload, college_id: colId });
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
        const itemId = parts[5];
        const { data: item } = await supabase.from(table).select('*').eq('id', itemId).single();
        if ((item as any)?.image_url) await deleteStorageFile((item as any).image_url);
        await supabase.from(table).delete().eq('id', itemId);
        return res.json({ success: true });
      }
    }
  }

  // 3. Admin Principal CMS
  if (parts[2] === 'admin' && parts[3] === 'principal') {
    if (req.method === 'GET') {
      const { data } = await supabase.from('principal').select('*').eq('college_id', colId).maybeSingle();
      return res.json(data ? { id: data.id, name: data.name, message: data.message, imageUrl: data.image_url } : {});
    }
    if (req.method === 'POST') {
      const { data: ex } = await supabase.from('principal').select('id').eq('college_id', colId).maybeSingle();
      const payload = {
        name: req.body.name,
        message: req.body.message,
        image_url: req.body.imageUrl,
        updated_at: new Date().toISOString()
      };
      if (ex) await supabase.from('principal').update(payload).eq('id', ex.id);
      else await supabase.from('principal').insert({ ...payload, college_id: colId });
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
      cardAuthorityLine1: 'card_authority_line1', cardAuthorityLine2: 'card_authority_line2',
      cardContactEmail: 'card_contact_email', cardContactPhone: 'card_contact_phone', rbWatermarkText: 'rb_watermark_text',
      rbWatermarkOpacity: 'rb_watermark_opacity', rbDisclaimerText: 'rb_disclaimer_text', rbWatermarkEnabled: 'rb_watermark_enabled',
      easypaisaNumber: 'easypaisa_number', bankAccountNumber: 'bank_account_number', bankName: 'bank_name',
      bankBranch: 'bank_branch', accountTitle: 'account_title', creditsText: 'credits_text',
      contributorsText: 'contributors_text',
      termCardMenu: 'term_card_menu',
      termInstitution: 'term_institution',
      termPrincipal: 'term_principal',
      officeHours: 'office_hours',
      blogHeading: 'blog_heading',
      blogDescription: 'blog_description',
      notesHeading: 'notes_heading',
      notesDescription: 'notes_description',
      eventsHeading: 'events_heading',
      eventsDescription: 'events_description',
      notificationsHeading: 'notifications_heading',
      notificationsDescription: 'notifications_description',
      contactHeading: 'contact_heading',
      contactDescription: 'contact_description'
    };
    for (const [k, v] of Object.entries(req.body || {})) {
      if (!fieldMap[k]) continue; // Only allow mapped fields to be updated
      
      let val = v;
      // Handle Numeric fields
      if (k === 'rbWatermarkOpacity' || k === 'heroBackgroundOpacity') {
        val = (v !== null && v !== undefined && v !== '') ? parseFloat(v as string) : null;
        if (typeof val === 'number' && isNaN(val)) val = null;
      }
      // Handle Boolean fields
      else if (k === 'cardQrEnabled' || k === 'rbWatermarkEnabled') {
        if (v === 'true' || v === true) val = true;
        else if (v === 'false' || v === false) val = false;
        else val = null;
      }
      // Handle empty strings for URLs/Logos (normalize to null)
      else if (v === '') {
        val = null;
      }

      updates[fieldMap[k]] = val;
    }
    const { data: ex } = await supabase.from('site_settings').select('id').eq('college_id', colId).maybeSingle();
    let updated: any;
    if (ex) {
      const { data, error: upErr } = await supabase.from('site_settings').update(updates).eq('id', ex.id).select().single();
      if (upErr) return res.status(500).json({ error: 'Update failed', detail: upErr.message });
      updated = data;
    } else {
      const { data, error: inErr } = await supabase.from('site_settings').insert({ ...updates, college_id: colId }).select().single();
      if (inErr) return res.status(500).json({ error: 'Insert failed', detail: inErr.message });
      updated = data;
    }

    if (!updated) return res.status(500).json({ error: 'Failed to retrieve updated settings' });

    // Return mapped object for frontend context
    return res.json({
      id: updated.id, primaryColor: updated.primary_color || '#006600', navbarLogo: updated.navbar_logo, loadingLogo: updated.loading_logo,
      instituteShortName: updated.institute_short_name, instituteFullName: updated.institute_full_name,
      footerTitle: updated.footer_title, footerDescription: updated.footer_description,
      facebookUrl: updated.facebook_url, twitterUrl: updated.twitter_url, instagramUrl: updated.instagram_url, youtubeUrl: updated.youtube_url,
      creditsText: updated.credits_text, contributorsText: updated.contributors_text, contactAddress: updated.contact_address,
      contactPhone: updated.contact_phone, contactEmail: updated.contact_email, mapEmbedUrl: updated.map_embed_url, googleMapLink: updated.google_map_link,
      footerTagline: updated.footer_tagline, heroBackgroundLogo: updated.hero_background_logo, heroBackgroundOpacity: updated.hero_background_opacity,
      cardHeaderText: updated.card_header_text, cardSubheaderText: updated.card_subheader_text, cardLogoUrl: updated.card_logo_url,
      cardQrEnabled: updated.card_qr_enabled, cardQrUrl: updated.card_qr_url, cardTermsText: updated.card_terms_text,
      cardContactAddress: updated.card_contact_address, cardContactEmail: updated.card_contact_email, cardContactPhone: updated.card_contact_phone,
      cardAuthorityLine1: updated.card_authority_line1, cardAuthorityLine2: updated.card_authority_line2,
      rbWatermarkText: updated.rb_watermark_text, rbWatermarkOpacity: updated.rb_watermark_opacity, rbDisclaimerText: updated.rb_disclaimer_text,
      rbWatermarkEnabled: updated.rb_watermark_enabled, easypaisaNumber: updated.easypaisa_number, bankAccountNumber: updated.bank_account_number,
      bankName: updated.bank_name, bankBranch: updated.bank_branch, accountTitle: updated.account_title,
      termCardMenu: updated.term_card_menu || 'College Card',
      termInstitution: updated.term_institution || 'College',
      termPrincipal: updated.term_principal || 'Principal',
      officeHours: updated.office_hours || 'Mon–Fri: 9:00 AM – 1:00 PM\nSat: 9:00 AM – 12:00 PM\nSun: Closed',
      blogHeading: updated.blog_heading || 'College News & Updates',
      blogDescription: updated.blog_description || 'Stay informed with the latest academic updates',
      notesHeading: updated.notes_heading || 'Study Notes',
      notesDescription: updated.notes_description || 'Download notes shared by our faculty',
      eventsHeading: updated.events_heading || 'Events',
      eventsDescription: updated.events_description || 'Stay updated with upcoming college events',
      notificationsHeading: updated.notifications_heading || 'Notifications',
      notificationsDescription: updated.notifications_description || 'Official announcements and updates',
      contactHeading: updated.contact_heading || 'Contact Us',
      contactDescription: updated.contact_description || 'Get in touch with us for official information and student support'
    });
  }

  // GET /api/:slug/og-meta — returns HTML with dynamic OG tags for bot previews
  if (isApi && resource === 'og-meta' && !subResource && req.method === 'GET') {
    const { data: college } = await supabase
      .from('colleges')
      .select('id, name, short_name')
      .eq('slug', collegeSlug.toLowerCase())
      .maybeSingle();

    if (!college) return res.status(404).send('Not found');

    const { data: settings } = await supabase
      .from('site_settings')
      .select('navbar_logo, loading_logo, institute_full_name, footer_tagline')
      .eq('college_id', college.id)
      .maybeSingle();

    const logoUrl = settings?.navbar_logo || settings?.loading_logo || '';
    const title = settings?.institute_full_name || college.name;
    const description = settings?.footer_tagline || `${title} - Digital Library Portal`;
    const siteUrl = `https://collegewebsite-three-ruddy.vercel.app/${collegeSlug}`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${logoUrl}" />
  <meta property="og:url" content="${siteUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${logoUrl}" />
  <script>window.location.replace('${siteUrl}');</script>
</head>
<body>Redirecting to ${title}...</body>
</html>`);
  }

  // 4. Other Admin Lists (Books, Donations, etc.)
  if (req.method === 'GET' && resource === 'admin') {
    if (subResource === 'books') {
      const { data } = await supabase.from('books').select('*').eq('college_id', colId).order('created_at', { ascending: false });
      return res.json((data || []).map((b: any) => ({
        id: b.id,
        bookName: b.book_name,
        authorName: b.author_name,
        shortIntro: b.short_intro,
        description: b.description,
        bookImage: b.book_image,
        totalCopies: Number(b.total_copies) || 0,
        availableCopies: Number(b.available_copies) || 0,
        createdAt: b.created_at
      })));
    }
    if (subResource === 'library-cards') {
      const token = req.headers['x-admin-token'];
      const validToken = process.env.ADMIN_API_TOKEN || 'gcfm-admin-token-2026';
      if (token !== validToken) return res.status(403).json({ error: 'Unauthorized' });

      const { data, error } = await supabase
        .from('library_card_applications')
        .select('*')
        .eq('college_id', colId)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ADMIN LIBRARY-CARDS] Fetch error:', error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.json((data || []).map((c: any) => ({
        id: c.id,
        firstName: c.first_name, lastName: c.last_name,
        fatherName: c.father_name, email: c.email, phone: c.phone,
        class: c.class, field: c.field, rollNo: c.roll_no,
        cardNumber: c.card_number, studentId: c.student_id,
        issueDate: c.issue_date, validThrough: c.valid_through,
        addressStreet: c.address_street, addressCity: c.address_city,
        addressState: c.address_state, addressZip: c.address_zip,
        status: c.status, createdAt: c.created_at
      })));
    }
    if (subResource === 'student-addresses') {
      const { data } = await supabase
        .from('library_card_applications')
        .select('*')
        .eq('college_id', colId)
        .order('created_at', { ascending: false });

      // De-duplicate by email — keep approved over suspended
      const emailMap = new Map();
      for (const card of (data || [])) {
        const existing = emailMap.get(card.email);
        if (!existing) {
          emailMap.set(card.email, card);
        } else if (card.status === 'approved') {
          emailMap.set(card.email, card); // approved always wins
        }
      }
      const list = Array.from(emailMap.values());
      return res.json(list.map(c => ({ 
        id: c.id, firstName: c.first_name, lastName: c.last_name, 
        fatherName: c.father_name, email: c.email, phone: c.phone, 
        class: c.class, field: c.field, rollNo: c.roll_no, 
        addressStreet: c.address_street, addressCity: c.address_city,
        addressState: c.address_state, addressZip: c.address_zip,
        dob: c.dob, cardNumber: c.card_number, status: c.status, 
        createdAt: c.created_at, dynamicFields: c.dynamic_fields 
      })));
    }
    if (subResource === 'borrowed-books' || subResource === 'book-borrows') {
      const { data: borrows, error } = await supabase.from('book_borrows')
        .select('*')
        .eq('college_id', colId)
        .order('created_at', { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      const cardIds = [...new Set((borrows || [])
        .map((b: any) => b.library_card_id).filter(Boolean))];

      let suspendedSet = new Set<string>();
      if (cardIds.length > 0) {
        const { data: cards } = await supabase
          .from('library_card_applications')
          .select('card_number, status')
          .in('card_number', cardIds)
          .eq('college_id', colId)
          .eq('status', 'suspended');
        suspendedSet = new Set((cards || []).map((c: any) => c.card_number));
      }

      // Look up father names from library_card_applications
      const allCardIds = [...new Set((borrows || [])
        .map((b: any) => b.library_card_id).filter(Boolean))];

      let fatherNameMap: Record<string, string> = {};
      if (allCardIds.length > 0) {
        const { data: cardDetails } = await supabase
          .from('library_card_applications')
          .select('card_number, father_name')
          .in('card_number', allCardIds)
          .eq('college_id', colId);

        (cardDetails || []).forEach((c: any) => {
          if (c.card_number && c.father_name) {
            fatherNameMap[c.card_number] = c.father_name;
          }
        });
      }

      return res.json((borrows || []).map((b: any) => ({
        id: b.id,
        bookId: b.book_id,
        bookTitle: b.book_title,
        borrowerName: b.borrower_name,
        borrowerEmail: b.borrower_email,
        borrowerPhone: b.borrower_phone,
        fatherName: fatherNameMap[b.library_card_id] || null,
        libraryCardId: b.library_card_id,
        userId: b.user_id,
        borrowDate: b.borrow_date,
        dueDate: b.due_date,
        returnDate: b.return_date,
        status: b.status,
        cardSuspended: suspendedSet.has(b.library_card_id)
      })));
    }
    if (subResource === 'donations') {
       const { data } = await supabase.from('donations').select('*').eq('college_id', colId).order('created_at', { ascending: false });
       return res.json((data || []).map(d => ({ id: d.id, amount: d.amount, method: d.method, donorName: d.name, email: d.email, message: d.message, createdAt: d.created_at })));
    }
    if (subResource === 'notifications') {
      const { data } = await supabase.from('notifications').select('*').eq('college_id', colId).order('created_at', { ascending: false });
      return res.json((data || []).map(n => ({ id: n.id, title: n.title, message: n.message, image: n.image, pin: n.pin, status: n.status, createdAt: n.created_at })));
    }
    if (subResource === 'events') {
      const { data } = await supabase.from('events').select('*').eq('college_id', colId).order('date', { ascending: false });
      return res.json((data || []).map(e => ({ id: e.id, title: e.title, description: e.description, images: e.images, date: e.date, createdAt: e.created_at })));
    }
    if (subResource === 'blog') {
      const { data } = await supabase.from('blog_posts').select('*').eq('college_id', colId).order('created_at', { ascending: false });
      return res.json((data || []).map(p => ({ id: p.id, title: p.title, slug: p.slug, shortDescription: p.short_description, content: p.content, featuredImage: p.featured_image, isPinned: p.is_pinned, status: p.status, createdAt: p.created_at })));
    }
    if (subResource === 'principal') {
      const { data } = await supabase.from('principal').select('*').eq('college_id', colId).maybeSingle();
      return res.json(data ? { id: data.id, name: data.name, designation: data.designation, message: data.message, imageUrl: data.image_url } : {});
    }
    if (subResource === 'faculty') {
      const { data } = await supabase.from('faculty_staff').select('*').eq('college_id', colId);
      return res.json((data || []).map(f => ({ id: f.id, name: f.name, designation: f.designation, description: f.description, imageUrl: f.image_url, supervises: f.supervises })));
    }
    if (subResource === 'history') {
      const sub = parts[4]; // sections, gallery
      if (sub === 'sections') {
        const { data } = await supabase.from('college_history_sections').select('*').eq('college_id', colId).order('display_order');
        return res.json((data || []).map(s => ({ id: s.id, title: s.title, description: s.description, imageUrl: s.image_url, layoutType: s.layout_type, displayOrder: s.display_order })));
      }
      if (sub === 'gallery') {
        const { data } = await supabase.from('college_history_gallery').select('*').eq('college_id', colId).order('display_order');
        return res.json((data || []).map(g => ({ id: g.id, imageUrl: g.image_url, caption: g.caption, displayOrder: g.display_order })));
      }
    }
    if (subResource === 'contact-messages') {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('college_id', colId)
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json((data || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        subject: m.subject,
        message: m.message,
        isSeen: m.is_seen,
        createdAt: m.created_at
      })));
    }

    if (subResource === 'users') {
      // Step 1: Fetch Students
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('college_id', colId);

      // Step 2: Fetch all profiles for this college
      const { data: profiles } = await supabase.from('profiles').select('*').eq('college_id', colId);

      // Step 3: Fetch Approved Library Card Applications (as fallback students and main data source for phone/cardId)
      const { data: cardApps } = await supabase
        .from('library_card_applications')
        .select('*')
        .eq('college_id', colId)
        .eq('status', 'approved');

      const phoneMap: Record<string, string> = {};
      const cardEmailMap: Record<string, string> = {}; // Secondary email map from apps

      (cardApps || []).forEach(app => {
        const appPhone = app.phone;
        const appEmail = (app.email || '').toLowerCase();
        const appRoll = (app.roll_no || '').trim();
        const appName = `${app.first_name} ${app.last_name}`.trim();

        if (app.user_id) {
          phoneMap[app.user_id] = appPhone;
          cardEmailMap[app.user_id] = appEmail;
        }
        if (appEmail) phoneMap[appEmail] = appPhone;
        if (appRoll) phoneMap[appRoll] = appPhone;
        if (appName) phoneMap[appName.toLowerCase()] = appPhone;
      });

      (profiles || []).forEach(p => {
        if (p.user_id) phoneMap[p.user_id] = p.phone || phoneMap[p.user_id];
        const pName = (p.full_name || '').trim().toLowerCase();
        if (pName) phoneMap[pName] = p.phone || phoneMap[pName];
      });
      
      const emailMap: Record<string, string> = {};
      const userIds = [
        ...(studentsData || []).map(s => s.user_id),
        ...(profiles || []).map(p => p.user_id),
        ...(cardApps || []).map(a => a.user_id)
      ].filter(Boolean);

      const uniqueUserIds = [...new Set(userIds)];
      if (uniqueUserIds.length > 0) {
        const { data: userAccounts } = await supabase.from('users').select('id, email').in('id', uniqueUserIds);
        (userAccounts || []).forEach(ua => {
          emailMap[ua.id] = ua.email;
        });
      }

      const students = (studentsData || []).map(s => {
        const studentEmail = emailMap[s.user_id] || cardEmailMap[s.user_id] || '-';
        const sRoll = (s.roll_no || '').trim();
        const sName = (s.name || '').trim().toLowerCase();

        const studentPhone = phoneMap[s.user_id] || 
                             phoneMap[studentEmail.toLowerCase()] || 
                             (sRoll ? phoneMap[sRoll] : null) ||
                             (sName ? phoneMap[sName] : null) ||
                             '-';
        
        return {
          id: s.id,
          userId: s.user_id,
          cardId: s.card_id,
          name: s.name,
          class: s.class,
          field: s.field,
          rollNo: s.roll_no,
          createdAt: s.created_at,
          email: studentEmail,
          phone: studentPhone,
          type: 'student',
          role: 'Student'
        };
      });

      // Add students from approved apps if not already in students list
      const existingUserIds = new Set(students.map(s => s.userId));
      (cardApps || []).forEach(app => {
        if (!existingUserIds.has(app.user_id)) {
          const appEmail = emailMap[app.user_id] || app.email || '-';
          students.push({
            id: app.id,
            userId: app.user_id,
            cardId: app.card_number,
            name: `${app.first_name} ${app.last_name}`,
            class: app.class,
            field: app.field,
            rollNo: app.roll_no,
            createdAt: app.created_at,
            email: appEmail,
            phone: app.phone || phoneMap[appEmail.toLowerCase()] || '-',
            type: 'student',
            role: 'Student'
          });
          existingUserIds.add(app.user_id);
        }
      });

      const nonStudents = (profiles || [])
        .filter(p => (p.role || '').toLowerCase() !== 'student')
        .map(p => ({
          id: p.id,
          userId: p.user_id,
          name: p.full_name,
          role: p.role,
          email: emailMap[p.user_id] || '-',
          phone: p.phone,
          createdAt: p.created_at,
          type: 'registered people'
        }));

      return res.json({ students, nonStudents });
    }
    if (subResource === 'notes') {
      const { data } = await supabase.from('notes').select('*').eq('college_id', colId).order('created_at', { ascending: false });
      return res.json((data || []).map(n => ({ id: n.id, title: n.title, description: n.description, subject: n.subject, class: n.class, pdfPath: n.pdf_path, status: n.status })));
    }
    if (subResource === 'rare-books') {
      const { data } = await supabase.from('rare_books').select('*').eq('college_id', colId).order('created_at', { ascending: false });
      return res.json((data || []).map((b: any) => ({ id: b.id, title: b.title, description: b.description, category: b.category, pdfPath: b.pdf_path, coverImage: b.cover_image, status: b.status })));
    }
  }

  // PUT /api/:slug/admin/library-card-fields - Save hybrid fields (System + Custom)
  if (req.method === 'PUT' && resource === 'admin' && subResource === 'library-card-fields') {
    if (!checkAdminToken(req)) return res.status(403).json({ error: 'Unauthorized' });
    colId = await getCollegeId(collegeSlug);
    if (!colId) return res.status(404).json({ error: 'College not found' });

    const { systemFields, customFields } = req.body || {};

    // 1. Upsert System Fields (class and field)
    for (const f of (systemFields || [])) {
      if (f.fieldKey === 'class' || f.fieldKey === 'field') {
        const { data: existing } = await supabase
          .from('library_card_fields')
          .select('id')
          .eq('college_id', colId)
          .eq('field_key', f.fieldKey)
          .maybeSingle();

        if (existing) {
          await supabase.from('library_card_fields')
            .update({ 
              options: f.options, 
              field_label: f.fieldLabel, // allow changing label like "Class" -> "Semester"
              updated_at: new Date().toISOString() 
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('library_card_fields').insert({
            college_id: colId,
            field_label: f.fieldLabel,
            field_key: f.fieldKey,
            field_type: 'select',
            is_required: true,
            show_on_form: true,
            show_on_card: true,
            show_in_admin: true,
            display_order: f.fieldKey === 'class' ? 1 : 2,
            options: f.options
          });
        }
      }
    }

    // 2. Clear out existing Custom Fields (not class or field)
    await supabase.from('library_card_fields')
      .delete()
      .eq('college_id', colId)
      .not('field_key', 'in', '("class","field")');

    // 3. Insert New Custom Fields
    if (customFields && customFields.length > 0) {
      const customPayload = customFields.map((f: any, idx: number) => ({
        college_id: colId,
        field_label: f.fieldLabel,
        field_key: f.fieldKey || `custom_${Date.now()}_${idx}`,
        field_type: 'select',
        is_required: f.isRequired || false,
        show_on_form: true,
        show_on_card: true,
        show_in_admin: true,
        display_order: 10 + idx,
        options: f.options
      }));
      await supabase.from('library_card_fields').insert(customPayload);
    }

    return res.json({ success: true });
  }

  // 5. Admin POST/PATCH/DELETE Operations — Consolidating below at unified handlers.
  if (req.method !== 'GET' && resource === 'admin') {
    // This block is now handled by the unified section at the end of the file.
    // Proceeding to specific resource handlers...
  }

    // Admin Library Cards Status & Suspend
    // PATCH /api/:slug/admin/library-card-applications/:id/status
    if (resource === 'admin' && subResource === 'library-card-applications' && itemId && parts[5] === 'status' && req.method === 'PATCH') {
      const token = req.headers['x-admin-token'];
      const validToken = process.env.ADMIN_API_TOKEN || 'gcfm-admin-token-2026';
      if (token !== validToken) return res.status(403).json({ error: 'Unauthorized' });

      const { status } = req.body || {};
      if (!['approved', 'pending', 'suspended'].includes(status))
        return res.status(400).json({ error: 'Invalid status' });

      const { data, error } = await supabase
        .from('library_card_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('college_id', colId)
        .select('id, card_number, status')
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true, card: data });
    }

    // PATCH /api/:slug/admin/borrowed-books/:id/return
    if (resource === 'admin' && subResource === 'borrowed-books' && sub2 && sub3 === 'return' && req.method === 'PATCH') {
      const token = req.headers['x-admin-token'];
      const validToken = process.env.ADMIN_API_TOKEN || 'gcfm-admin-token-2026';
      if (token !== validToken) return res.status(403).json({ error: 'Unauthorized' });

      // Get the borrow record to find the book
      const { data: borrow } = await supabase
        .from('book_borrows').select('book_id, status')
        .eq('id', sub2).eq('college_id', colId).maybeSingle();

      if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });
      if (borrow.status === 'returned') return res.status(400).json({ error: 'Book already returned' });

      // Mark as returned
      const returnDate = new Date().toISOString().split('T')[0];
      const { error: updateErr } = await supabase
        .from('book_borrows')
        .update({ status: 'returned', return_date: returnDate })
        .eq('id', sub2).eq('college_id', colId);

      if (updateErr) return res.status(500).json({ error: updateErr.message });

      // Increment available copies back
      if (borrow.book_id) {
        const { data: book } = await supabase.from('books')
          .select('available_copies').eq('id', borrow.book_id).maybeSingle();
        if (book) {
          await supabase.from('books')
            .update({ available_copies: book.available_copies + 1 })
            .eq('id', borrow.book_id);
        }
      }

      return res.json({ success: true, returnDate });
    }

    // DELETE /api/:slug/admin/library-card-applications/:id (Soft Suspend)
    if (resource === 'admin' && subResource === 'library-card-applications' && itemId && !parts[5] && req.method === 'DELETE') {
      console.log('[DELETE LIBRARY-CARD-APP] soft-suspend id:', itemId);
      if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

      // Soft delete — set to suspended
      const { error } = await supabase
        .from('library_card_applications')
        .update({ status: 'suspended', updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('college_id', colId);

      if (error) {
        console.error('[DELETE LIBRARY-CARD-APP] DB error:', error.message);
        return res.status(500).json({ error: error.message });
      }
      console.log('[DELETE LIBRARY-CARD-APP] Success: suspended %s', itemId);
      return res.json({ success: true });
    }

    // DELETE /api/:slug/admin/student-addresses/:id
    if (resource === 'admin' && subResource === 'student-addresses' && sub2 && !sub3 && req.method === 'DELETE') {
      console.log('[DELETE STUDENT-ADDRESS] id:', sub2);
      if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

      // Get card details before deleting to clean up related data
      const { data: card } = await supabase
        .from('library_card_applications')
        .select('card_number, email')
        .eq('id', sub2)
        .eq('college_id', colId)
        .maybeSingle();

      if (!card) {
        console.log('[DELETE STUDENT-ADDRESS] Card not found for id:', sub2);
        return res.status(404).json({ error: 'Card not found' });
      }

      // Hard delete from library_card_applications
      const { error: delErr } = await supabase
        .from('library_card_applications')
        .delete()
        .eq('id', sub2)
        .eq('college_id', colId);

      if (delErr) {
        console.error('[DELETE STUDENT-ADDRESS] Card delete error:', delErr.message);
        return res.status(500).json({ error: delErr.message });
      }

      // Also delete from students table
      const { error: stuErr } = await supabase.from('students')
        .delete()
        .eq('card_id', card.card_number)
        .eq('college_id', colId);
      
      if (stuErr) {
        console.error('[DELETE STUDENT-ADDRESS] Student delete error:', stuErr.message);
      }

      console.log('[DELETE STUDENT-ADDRESS] Success for id: %s, card_number: %s', sub2, card.card_number);
      return res.json({ success: true });
    }

    // ── BOOKS (POST, PATCH, DELETE) ────────────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'books' && isApi) {
      if (req.method === 'DELETE' && sub2 && !sub3) {
        if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });
        
        // Step 1: Get data FIRST
        const { data: item } = await supabase.from('books').select('book_image').eq('id', sub2).eq('college_id', colId).maybeSingle();
        console.log('[DELETE BOOK] book_image URL:', item?.book_image);

        // Step 2: Delete from Storage
        if (item?.book_image) {
          await deleteStorageFile(item.book_image);
        }

        // Step 3: Delete from DB
        const { error } = await supabase.from('books').delete().eq('id', sub2).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        console.log('[DELETE BOOKS] Success:', sub2);
        return res.json({ success: true });
      }

      if (req.method === 'POST' || req.method === 'PATCH') {
        console.log('[UPSERT BOOKS] method:', req.method, 'id:', sub2);
        if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });
        const payload: any = { 
          ...req.body, college_id: colId, 
          book_name: req.body.bookName || req.body.book_name, 
          author_name: req.body.authorName || req.body.author_name, 
          short_intro: req.body.shortIntro || req.body.short_intro || '', 
          description: req.body.description || '',
          book_image: req.body.bookImage || req.body.book_image || null, 
          total_copies: Number(req.body.totalCopies || req.body.total_copies) || 1, 
        };
        if (req.method === 'POST') {
          payload.available_copies = payload.total_copies;
        } else if (req.body.availableCopies !== undefined || req.body.available_copies !== undefined) {
          payload.available_copies = Number(req.body.availableCopies ?? req.body.available_copies) || 0;
        }
        delete payload.bookName; delete payload.authorName; delete payload.shortIntro; delete payload.bookImage; delete payload.totalCopies; delete payload.availableCopies;
        if (req.method === 'PATCH' && sub2) {
          const { error } = await supabase.from('books').update(payload).eq('id', sub2).eq('college_id', colId);
          if (error) return res.status(500).json({ error: error.message });
        } else {
          const { error } = await supabase.from('books').insert(payload);
          if (error) return res.status(500).json({ error: error.message });
        }
        return res.json({ success: true });
      }
    }

    // ── NOTES (POST, PATCH, DELETE) ────────────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'notes' && isApi) {
      if (req.method === 'DELETE' && sub2 && !sub3) {
        if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

        const { data: item } = await supabase.from('notes').select('pdf_path').eq('id', sub2).eq('college_id', colId).maybeSingle();
        if (item?.pdf_path) await deleteStorageFile(item.pdf_path);

        const { error } = await supabase.from('notes').delete().eq('id', sub2).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        console.log('[DELETE NOTES] Success:', sub2);
        return res.json({ success: true });
      }

      if (req.method === 'PATCH' && sub2 && sub3 === 'toggle') {
        const { data: curr } = await supabase.from('notes').select('status').eq('id', sub2).eq('college_id', colId).single();
        const newStatus = curr?.status === 'active' ? 'inactive' : 'active';
        await supabase.from('notes').update({ status: newStatus }).eq('id', sub2).eq('college_id', colId);
        return res.json({ success: true, status: newStatus });
      }
      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: colId, pdf_path: req.body.pdfPath };
        delete payload.pdfPath;
        const { error } = await supabase.from('notes').insert(payload);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }
    }

    // ── RARE BOOKS (POST, PATCH, DELETE) ───────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'rare-books' && isApi) {
      if (req.method === 'DELETE' && sub2 && !sub3) {
        if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

        const { data: item } = await supabase.from('rare_books').select('pdf_path, cover_image').eq('id', sub2).eq('college_id', colId).maybeSingle();
        if (item?.pdf_path) await deleteStorageFile(item.pdf_path);
        if (item?.cover_image) await deleteStorageFile(item.cover_image);

        const { error } = await supabase.from('rare_books').delete().eq('id', sub2).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      if (req.method === 'PATCH' && sub2 && sub3 === 'toggle') {
        const { data: curr } = await supabase.from('rare_books').select('status').eq('id', sub2).eq('college_id', colId).single();
        const newStatus = curr?.status === 'active' ? 'inactive' : 'active';
        await supabase.from('rare_books').update({ status: newStatus }).eq('id', sub2).eq('college_id', colId);
        return res.json({ success: true, status: newStatus });
      }
      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: colId, pdf_path: req.body.pdfPath, cover_image: req.body.coverImage };
        delete payload.pdfPath; delete payload.coverImage;
        const { error } = await supabase.from('rare_books').insert(payload);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }
    }

    // ── EVENTS (POST, PATCH, DELETE) ────────────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'events' && isApi) {
      if (req.method === 'DELETE' && sub2 && !sub3) {
        if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

        const { data: item } = await supabase.from('events').select('images').eq('id', sub2).eq('college_id', colId).maybeSingle();
        for (const img of (item?.images || [])) await deleteStorageFile(img);

        const { error } = await supabase.from('events').delete().eq('id', sub2).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: colId, images: req.body.images || [] };
        const { data, error } = await supabase.from('events').insert(payload).select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }
      if (req.method === 'PATCH' && sub2) {
        const { error } = await supabase.from('events').update(req.body).eq('id', sub2).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }
    }

    // ── NOTIFICATIONS (POST, PATCH, DELETE) ─────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'notifications' && isApi) {
      if (req.method === 'DELETE' && sub2 && !sub3) {
        if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

        const { data: item } = await supabase.from('notifications').select('image').eq('id', sub2).eq('college_id', colId).maybeSingle();
        if (item?.image) await deleteStorageFile(item.image);

        const { error } = await supabase.from('notifications').delete().eq('id', sub2).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      if (req.method === 'POST') {
        const payload = { ...req.body, college_id: colId, pin: req.body.pin || false, status: req.body.status || 'published' };
        const { data, error } = await supabase.from('notifications').insert(payload).select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
      }
      if (req.method === 'PATCH' && sub2) {
        if (sub3 === 'status') {
          const { data: curr } = await supabase.from('notifications').select('status').eq('id', sub2).eq('college_id', colId).single();
          const newStatus = curr?.status === 'published' ? 'inactive' : 'published';
          await supabase.from('notifications').update({ status: newStatus }).eq('id', sub2).eq('college_id', colId);
          return res.json({ success: true, status: newStatus });
        }
        if (sub3 === 'pin') {
          const { data: curr } = await supabase.from('notifications').select('pin').eq('id', sub2).eq('college_id', colId).single();
          await supabase.from('notifications').update({ pin: !curr?.pin }).eq('id', sub2).eq('college_id', colId);
          return res.json({ success: true, pin: !curr?.pin });
        }
        const { error } = await supabase.from('notifications').update(req.body).eq('id', sub2).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }
    }

    // ── BLOG (POST, PATCH, DELETE) ──────────────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'blog' && isApi) {
      if (req.method === 'DELETE' && sub2 && !sub3) {
        if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

        const { data: item } = await supabase.from('blog_posts').select('featured_image').eq('id', sub2).eq('college_id', colId).maybeSingle();
        if (item?.featured_image) await deleteStorageFile(item.featured_image);

        const { error } = await supabase.from('blog_posts').delete().eq('id', sub2).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      if (req.method === 'POST' || req.method === 'PATCH') {
        const payload: any = {
          college_id: colId, title: req.body.title, content: req.body.content,
          featured_image: req.body.featuredImage, short_description: req.body.shortDescription,
          slug: req.body.slug, is_pinned: req.body.isPinned || false,
          status: req.body.status || 'published', updated_at: new Date().toISOString()
        };
        if (req.method === 'PATCH' && sub2) {
          const { error } = await supabase.from('blog_posts').update(payload).eq('id', sub2).eq('college_id', colId);
          if (error) return res.status(500).json({ error: error.message });
        } else {
          const { error } = await supabase.from('blog_posts').insert(payload);
          if (error) return res.status(500).json({ error: error.message });
        }
        return res.json({ success: true });
      }
    }

    // ── FACULTY (POST, PATCH, DELETE) ───────────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'faculty' && isApi) {
      if (req.method === 'DELETE' && sub2 && !sub3) {
        if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });

        const { data: item } = await supabase.from('faculty_staff').select('image_url').eq('id', sub2).eq('college_id', colId).maybeSingle();
        if (item?.image_url) await deleteStorageFile(item.image_url);

        const { error } = await supabase.from('faculty_staff').delete().eq('id', sub2).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      if (req.method === 'POST' || req.method === 'PATCH') {
        const payload = { ...req.body, college_id: colId, image_url: req.body.imageUrl };
        delete payload.imageUrl;
        if (req.method === 'PATCH' && sub2) {
          const { error } = await supabase.from('faculty_staff').update(payload).eq('id', sub2).eq('college_id', colId);
          if (error) return res.status(500).json({ error: error.message });
        } else {
          const { error } = await supabase.from('faculty_staff').insert(payload);
          if (error) return res.status(500).json({ error: error.message });
        }
        return res.json({ success: true });
      }
    }

    // ── BORROWED BOOKS (DELETE) ─────────────────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'borrowed-books' && isApi && req.method === 'DELETE' && sub2 && !sub3) {
      const { error } = await supabase.from('book_borrows').delete().eq('id', sub2).eq('college_id', colId);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    // ── CONTACT MESSAGES (DELETE) ───────────────────────────────────────────────────
    if (resource === 'contact-messages' && isApi && req.method === 'DELETE' && sub1 && !sub2) {
      const { error } = await supabase.from('contact_messages').delete().eq('id', sub1).eq('college_id', colId);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    // ── HISTORY CMS (Special Case) ──────────────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'history' && isApi) {
      const sub = sub2; // sections, gallery, page
      const id = sub3;
      const tableMap: any = { page: 'college_history_page', sections: 'college_history_sections', gallery: 'college_history_gallery' };
      const table = tableMap[sub];
      if (!table) return res.status(404).json({ error: 'History sub-resource not found' });

      if (req.method === 'DELETE' && id) {
        const { data: item } = await supabase.from(table).select('*').eq('id', id).eq('college_id', colId).maybeSingle();
        if ((item as any)?.image_url) await deleteStorageFile((item as any).image_url);

        const { error } = await supabase.from(table).delete().eq('id', id).eq('college_id', colId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      if (req.method === 'POST' || req.method === 'PATCH') {
        const payload: any = { ...req.body, college_id: colId };
        if (req.body.imageUrl !== undefined) { payload.image_url = req.body.imageUrl; delete payload.imageUrl; }
        if (req.body.iconName !== undefined) { payload.icon_name = req.body.iconName; delete payload.iconName; }
        if (req.body.layoutType !== undefined) { payload.layout_type = req.body.layoutType; delete payload.layoutType; }
        if (req.body.displayOrder !== undefined) { payload.display_order = req.body.displayOrder; delete payload.displayOrder; }
        if (sub === 'page') {
          const { data: ex } = await supabase.from(table).select('id').eq('college_id', col.id).maybeSingle();
          if (ex) await supabase.from(table).update(payload).eq('id', ex.id);
          else await supabase.from(table).insert(payload);
        } else {
          const itemId = id || req.body.id;
          if (itemId) await supabase.from(table).update(payload).eq('id', itemId).eq('college_id', col.id);
          else await supabase.from(table).insert(payload);
        }
        return res.json({ success: true });
      }
    }

    // ── REGISTERED PEOPLE (DELETE) ──────────────────────────────────────────────────
    if (resource === 'admin' && sub1 === 'users' && isApi && req.method === 'DELETE' && sub2 && !sub3) {
      if (!isAdmin) return res.status(403).json({ error: 'Unauthorized' });
      
      const { data: profile } = await supabase.from('profiles').select('user_id').eq('id', sub2).eq('college_id', col.id).maybeSingle();
      if (!profile) return res.status(404).json({ error: 'Profile not found' });

      const { error: profErr } = await supabase.from('profiles').delete().eq('id', sub2);
      if (profErr) return res.status(500).json({ error: profErr.message });

      if (profile.user_id) {
        const { error: userErr } = await supabase.from('users').delete().eq('id', profile.user_id).eq('college_id', col.id);
        if (userErr) console.error('[DELETE USER] Error deleting account:', userErr);
      }
      return res.json({ success: true });
    }

  return res.status(404).json({ error: 'Endpoint not found', path });
}

// Simple multipart parser helper:
function parseMultipart(body: Buffer, boundary: string) {
  const parts: any[] = [];
  const delimiter = Buffer.from('--' + boundary);
  let start = 0;

  while (start < body.length) {
    const end = body.indexOf(delimiter, start + delimiter.length);
    if (end === -1) break;
    const part = body.slice(start + delimiter.length + 2, end - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = end; continue; }

    const headers = part.slice(0, headerEnd).toString();
    const data = part.slice(headerEnd + 4);
    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    const ctMatch = headers.match(/Content-Type:\s*([^\r\n]+)/);

    parts.push({
      name: nameMatch?.[1],
      filename: filenameMatch?.[1],
      contentType: ctMatch?.[1]?.trim(),
      data: data
    });
    start = end;
  }
  return parts;
}


