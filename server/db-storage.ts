import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("CRITICAL ERROR: Missing Supabase URL or Key in environment variables. Backend will fail.");
}

const SUPABASE_BACKEND_SECRET =
  process.env.SUPABASE_BACKEND_SECRET || "admin-backend-secret-8829";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      "x-backend-secret": SUPABASE_BACKEND_SECRET,
    },
  },
});

import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

function generateId(): string {
  return uuidv4();
}

function toSnakeCase(obj: any): any {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;

  const newObj: any = {};
  for (const key in obj) {
    let value = obj[key];

    // Handle common type conversions from form data
    if (value === "true") value = true;
    if (value === "false") value = false;

    // Manual map for site_settings to ensure 100% accuracy
    const manualMap: Record<string, string> = {
      cardHeaderText: "card_header_text",
      cardSubheaderText: "card_subheader_text",
      cardLogoUrl: "card_logo_url",
      cardQrEnabled: "card_qr_enabled",
      cardQrUrl: "card_qr_url",
      cardTermsText: "card_terms_text",
      cardContactAddress: "card_contact_address",
      cardContactEmail: "card_contact_email",
      cardContactPhone: "card_contact_phone",
      primaryColor: "primary_color",
      navbarLogo: "navbar_logo",
      loadingLogo: "loading_logo",
      instituteShortName: "institute_short_name",
      instituteFullName: "institute_full_name",
      footerTitle: "footer_title",
      footerDescription: "footer_description",
      facebookUrl: "facebook_url",
      twitterUrl: "twitter_url",
      instagramUrl: "instagram_url",
      youtubeUrl: "youtube_url",
      creditsText: "credits_text",
      contributorsText: "contributors_text",
      contactAddress: "contact_address",
      contactPhone: "contact_phone",
      contactEmail: "contact_email",
      mapEmbedUrl: "map_embed_url",
      googleMapLink: "google_map_link",
      footerTagline: "footer_tagline",
      rbWatermarkText: "rb_watermark_text",
      rbWatermarkOpacity: "rb_watermark_opacity",
      rbDisclaimerText: "rb_disclaimer_text",
      rbWatermarkEnabled: "rb_watermark_enabled",
      heroBackgroundLogo: "hero_background_logo",
      heroBackgroundOpacity: "hero_background_opacity",
      easypaisaNumber: "easypaisa_number",
      bankAccountNumber: "bank_account_number",
      bankName: "bank_name",
      bankBranch: "bank_branch",
      accountTitle: "account_title",
    };

    // Specific numeric conversions
    if (key === "rbWatermarkOpacity" || key === "heroBackgroundOpacity")
      value = parseFloat(value) || 0;
    else if (key === "displayOrder") value = parseInt(value) || 0;
    else if (key === "totalCopies" || key === "availableCopies")
      value = parseInt(value) || 0;

    const snakeKey =
      manualMap[key] ||
      key.replace(
        /[A-Z]/g,
        (letter, offset) => (offset > 0 ? "_" : "") + letter.toLowerCase(),
      );
    newObj[snakeKey] = value;
  }
  return newObj;
}

const USER_SELECT = "id, email, password, collegeId:college_id, createdAt:created_at";
const PROFILE_SELECT =
  "id, userId:user_id, fullName:full_name, phone, rollNumber:roll_number, department, studentClass:student_class, role, createdAt:created_at, updatedAt:updated_at";
const USER_ROLE_SELECT = "id, userId:user_id, role, createdAt:created_at";
const MESSAGE_SELECT =
  "id, name, email, subject, message, isSeen:is_seen, createdAt:created_at";
const BOOK_BORROW_SELECT =
  "id, userId:user_id, bookId:book_id, bookTitle:book_title, borrowerName:borrower_name, borrowerPhone:borrower_phone, borrowerEmail:borrower_email, libraryCardId:library_card_id, borrowDate:borrow_date, dueDate:due_date, returnDate:return_date, status, createdAt:created_at";
const LIBRARY_CARD_SELECT =
  "id, userId:user_id, firstName:first_name, lastName:last_name, fatherName:father_name, dob, class, field, rollNo:roll_no, email, phone, addressStreet:address_street, addressCity:address_city, addressState:address_state, addressZip:address_zip, status, cardNumber:card_number, studentId:student_id, issueDate:issue_date, validThrough:valid_through, password, dynamicFields:dynamic_fields, createdAt:created_at, updatedAt:updated_at";
const DONATION_SELECT =
  "id, amount, method, name, email, message, createdAt:created_at";
const STUDENT_SELECT =
  "id, userId:user_id, cardId:card_id, name, class, field, rollNo:roll_no, createdAt:created_at";
const NON_STUDENT_SELECT =
  "id, userId:user_id, name, role, phone, createdAt:created_at";
const BOOK_SELECT =
  "id, bookName:book_name, authorName:author_name, shortIntro:short_intro, description, bookImage:book_image, totalCopies:total_copies, availableCopies:available_copies, createdAt:created_at, updatedAt:updated_at";
const NOTE_SELECT =
  "id, title, description, subject, class, pdfPath:pdf_path, status, createdAt:created_at, updatedAt:updated_at";
const RARE_BOOK_SELECT =
  "id, title, description, category, pdfPath:pdf_path, coverImage:cover_image, status, createdAt:created_at";
const EVENT_SELECT =
  "id, title, description, images, date, createdAt:created_at, updatedAt:updated_at";
const NOTIFICATION_SELECT =
  "id, title, message, image, pin, status, createdAt:created_at";
const BLOG_SELECT =
  "id, title, slug, shortDescription:short_description, content, featuredImage:featured_image, isPinned:is_pinned, status, createdAt:created_at, updatedAt:updated_at";
const PRINCIPAL_SELECT =
  "id, name, imageUrl:image_url, message, createdAt:created_at, updatedAt:updated_at";
const HISTORY_PAGE_SELECT = "id, title, subtitle, updatedAt:updated_at";
const HISTORY_SECTION_SELECT =
  "id, title, description, iconName:icon_name, imageUrl:image_url, layoutType:layout_type, displayOrder:display_order, createdAt:created_at, updatedAt:updated_at";
const HISTORY_GALLERY_SELECT =
  "id, imageUrl:image_url, caption, displayOrder:display_order, createdAt:created_at";
const FACULTY_SELECT =
  "id, name, designation, description, imageUrl:image_url, createdAt:created_at, updatedAt:updated_at";

const HOME_CONTENT_SELECT =
  "id, heroHeading:hero_heading, heroSubheading:hero_subheading, heroOverlayText:hero_overlay_text, featuresHeading:features_heading, featuresSubheading:features_subheading, affiliationsHeading:affiliations_heading, ctaHeading:cta_heading, ctaSubheading:cta_subheading, createdAt:created_at";
const HOME_SLIDER_SELECT =
  "id, imageUrl:image_url, order, isActive:is_active, createdAt:created_at";
const HOME_STAT_SELECT =
  "id, label, number, icon, iconUrl:icon_url, color, order, createdAt:created_at";
const HOME_AFFILIATION_SELECT =
  "id, name, logoUrl:logo_url, link, order, isActive:is_active, createdAt:created_at";
const HOME_BUTTON_SELECT =
  "id, section, text, link, isActive:is_active, createdAt:created_at";
const SITE_SETTINGS_SELECT =
  "id, primaryColor:primary_color, navbarLogo:navbar_logo, heroBackgroundLogo:hero_background_logo, heroBackgroundOpacity:hero_background_opacity, loadingLogo:loading_logo, instituteShortName:institute_short_name, instituteFullName:institute_full_name, footerTitle:footer_title, footerDescription:footer_description, facebookUrl:facebook_url, twitterUrl:twitter_url, instagramUrl:instagram_url, youtubeUrl:youtube_url, creditsText:credits_text, contributorsText:contributors_text, contactAddress:contact_address, contactPhone:contact_phone, contactEmail:contact_email, mapEmbedUrl:map_embed_url, googleMapLink:google_map_link, footerTagline:footer_tagline, cardHeaderText:card_header_text, cardSubheaderText:card_subheader_text, cardLogoUrl:card_logo_url, cardQrEnabled:card_qr_enabled, cardQrUrl:card_qr_url, cardTermsText:card_terms_text, cardContactAddress:card_contact_address, cardContactEmail:card_contact_email, cardContactPhone:card_contact_phone, rbWatermarkText:rb_watermark_text, rbWatermarkOpacity:rb_watermark_opacity, rbDisclaimerText:rb_disclaimer_text, rbWatermarkEnabled:rb_watermark_enabled, easypaisaNumber:easypaisa_number, bankAccountNumber:bank_account_number, bankName:bank_name, bankBranch:bank_branch, accountTitle:account_title, updatedAt:updated_at";
const LIBRARY_CARD_FIELD_SELECT =
  "id, fieldLabel:field_label, fieldKey:field_key, fieldType:field_type, isRequired:is_required, showOnForm:show_on_form, showOnCard:show_on_card, showInAdmin:show_in_admin, displayOrder:display_order, options, createdAt:created_at, updatedAt:updated_at";
const ADMIN_CREDENTIALS_SELECT =
  "id, adminEmail:admin_email, passwordHash:password_hash, role, isActive:is_active, collegeId:college_id, createdAt:created_at, updatedAt:updated_at";

class DbStorage {
  async init() {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      console.error("Supabase connection error:", error);
    } else {
      console.log("Supabase connected successfully.");
      // Ensure GCFM storage bucket exists
      await this.ensureBucket("college-gcfm");
      // CRITICAL: Safeguard admin credentials
      await this.seedAdminIfEmpty();
    }
  }

  private async seedAdminIfEmpty() {
    try {
      const { count, error: countErr } = await supabase
        .from('admin_credentials')
        .select('*', { count: 'exact', head: true });

      if (countErr) {
        console.error("[SEED] Error checking admin_credentials count:", countErr.message);
        return;
      }

      if (count && count > 0) {
        console.log('[SEED] Skipping — admin_credentials already has data.');
        return; // STOP. Never overwrite existing rows.
      }

      // COMPLETELY DISABLE SEEDING TO PREVENT OVERWRITES
      console.log("[SEED] Table is empty. Seeding is DISABLED to prevent unintended overwrites.");
      return;

      /* 
      const adminsToSeed = [
        { email: 'gcfm@admin.com', password: 'gcfm@123', role: 'client_admin' },
        { email: 'superadmin@cms.com', password: 'SuperCMS@123', role: 'developer' }
      ];

      for (const admin of adminsToSeed) {
        const hash = await bcrypt.hash(admin.password, 10);
        const { error: insErr } = await supabase.from('admin_credentials').insert({
          admin_email: admin.email,
          password_hash: hash,
          role: admin.role,
          is_active: true
        });
        if (insErr) {
          console.error(`[SEED] Error seeding ${admin.email}:`, insErr.message);
        } else {
          console.log(`[SEED] ${admin.email} seeded successfully.`);
        }
      }
      */
    } catch (err) {
      console.error("[SEED] Unexpected error during seeding:", err);
    }
  }

  /** Ensure a Supabase storage bucket exists, create it if missing. */
  async ensureBucket(bucketName: string) {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = (buckets || []).some((b: any) => b.name === bucketName);
      if (!exists) {
        const { error } = await supabase.storage.createBucket(bucketName, { public: true });
        if (error) console.error(`Failed to create bucket '${bucketName}':`, error.message);
        else console.log(`✅ Storage bucket '${bucketName}' created`);
      }
    } catch (err) {
      console.error(`Error checking bucket '${bucketName}':`, err);
    }
  }

  // ── College Management ───────────────────────────────────────────────────
  async getColleges() {
    const { data } = await supabase
      .from("colleges")
      .select("id, name, short_name, slug, storage_bucket, is_active, created_at, updated_at")
      .order("created_at", { ascending: true });
    return (data || []).map((c: any) => ({
      id: c.id, name: c.name, shortName: c.short_name, slug: c.slug,
      storageBucket: c.storage_bucket, isActive: c.is_active,
      createdAt: c.created_at, updatedAt: c.updated_at,
    }));
  }

  async getCollegeBySlug(slug: string) {
    const { data } = await supabase
      .from("colleges")
      .select("id, name, short_name, slug, storage_bucket, is_active")
      .eq("slug", slug.toLowerCase())
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id, name: data.name, shortName: data.short_name,
      slug: data.slug, storageBucket: data.storage_bucket, isActive: data.is_active,
    };
  }

  async createCollege(college: any) {
    const { data, error } = await supabase
      .from("colleges")
      .insert({
        name: college.name,
        short_name: college.shortName,
        slug: college.slug.toLowerCase(),
        storage_bucket: `college-${college.slug.toLowerCase()}`,
        is_active: true,
      })
      .select("id, name, short_name, slug, storage_bucket, is_active, created_at")
      .single();
    if (error) throw new Error(error.message);
    // Ensure storage bucket exists for the new college
    await this.ensureBucket(`college-${college.slug.toLowerCase()}`);
    return data;
  }

  async updateCollege(id: string, college: any) {
    const toUpdate: any = {};
    if (college.name !== undefined) toUpdate.name = college.name;
    if (college.shortName !== undefined) toUpdate.short_name = college.shortName;
    if (college.isActive !== undefined) toUpdate.is_active = college.isActive;
    toUpdate.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("colleges")
      .update(toUpdate)
      .eq("id", id)
      .select("id, name, short_name, slug, storage_bucket, is_active, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteCollege(id: string) {
    await supabase.from("colleges").delete().eq("id", id);
  }

  async getCollegeCount() {
    const { count } = await supabase
      .from("colleges")
      .select("id", { count: "exact", head: true });
    return count || 0;
  }

  // ── Admin Auth ───────────────────────────────────────────────────────────
  async getAdminCredentials(collegeId?: string) {
    let query = supabase
      .from("admin_credentials")
      .select(ADMIN_CREDENTIALS_SELECT)
      .eq("is_active", true);
    if (collegeId) {
      query = query.eq("college_id", collegeId).eq("role", "client_admin");
    } else {
      query = query.eq("role", "client_admin");
    }
    const { data } = await query.maybeSingle();
    return data;
  }

  async getAdminByEmail(email: string) {
    // Check DATABASE only - developer backdoor replaced by superadmin@cms.com
    const { data: admin } = await supabase
      .from("admin_credentials")
      .select(ADMIN_CREDENTIALS_SELECT)
      .eq("admin_email", email)
      .eq("is_active", true)
      .maybeSingle();
    return admin;
  }

  /**
   * Get admin for a specific college slug (college-scoped login).
   * Returns the admin whose college_id matches the slug's college.
   */
  async getAdminByEmailAndCollege(email: string, collegeId: string) {
    const { data } = await supabase
      .from("admin_credentials")
      .select(ADMIN_CREDENTIALS_SELECT)
      .eq("admin_email", email)
      .eq("college_id", collegeId)
      .eq("is_active", true)
      .maybeSingle();
    return data;
  }

  /** Get super admin (role = developer) by email for super-admin login. */
  async getSuperAdminByEmail(email: string) {
    const { data } = await supabase
      .from("admin_credentials")
      .select(ADMIN_CREDENTIALS_SELECT)
      .eq("admin_email", email)
      .eq("role", "developer")
      .eq("is_active", true)
      .maybeSingle();
    return data;
  }

  async updateAdminCredentials(data: any, collegeId?: string) {
    console.warn("updateAdminCredentials write operation is DISABLED per security policy.");
    return null;
  }

  /** Create a new college admin (called by Super Admin when creating a new college). */
  async createCollegeAdmin(email: string, password: string, collegeId: string) {
    console.warn("createCollegeAdmin write operation via storage is DISABLED. Use routes.ts implementation.");
    return null;
  }

  /** Update super admin password. */
  async updateSuperAdminPassword(email: string, newPassword: string) {
    console.warn("updateSuperAdminPassword write operation is DISABLED.");
    return null;
  }

  async getUser(id: string, collegeId?: string) {
    let query = supabase
      .from("users")
      .select(USER_SELECT)
      .eq("id", id);
    if (collegeId) {
      query = query.eq("college_id", collegeId);
    }
    const { data } = await query.maybeSingle();
    return data;
  }

  async getUserByEmail(email: string, collegeId?: string) {
    let query = supabase
      .from("users")
      .select(USER_SELECT)
      .eq("email", email);
    if (collegeId) {
      query = query.eq("college_id", collegeId);
    }
    const { data } = await query.maybeSingle();
    return data;
  }

  async createUser(user: any, collegeId: string) {
    const userToInsert = {
      email: user.email,
      password: user.password,
      college_id: collegeId,
    };
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert(userToInsert)
      .select(USER_SELECT)
      .single();
    if (userError) throw new Error(userError.message);

    if (userData) {
      const profileToInsert = {
        user_id: userData.id,
        full_name: user.fullName || "User",
        phone: user.phone,
        roll_number: user.rollNumber,
        department: user.department,
        student_class: user.studentClass,
        role: user.classification,
        college_id: collegeId,
      };
      const { error: profErr } = await supabase
        .from("profiles")
        .insert(profileToInsert);
      if (profErr) {
        console.error("[ERROR] Failed to create profile:", profErr);
      }

      if (!(user.type === "student" || user.studentClass)) {
        const { error: syncErr } = await supabase.from("non_students").insert({
          user_id: userData.id,
          name: profileToInsert.full_name,
          role: user.classification || "Visitor",
          phone: user.phone,
          college_id: collegeId,
        });
        if (syncErr) console.error("non_students sync error:", syncErr);
      }
    }

    return userData;
  }

  async deleteUser(id: string, collegeId: string) {
    // Delete by User ID (triggers comprehensive wipe)
    await supabase.from("users").delete().eq("id", id).eq("college_id", collegeId);
    await supabase.from("profiles").delete().eq("user_id", id).eq("college_id", collegeId);
    await supabase.from("user_roles").delete().eq("user_id", id).eq("college_id", collegeId);
    await supabase.from("non_students").delete().eq("user_id", id).eq("college_id", collegeId);
    await supabase.from("students").delete().eq("user_id", id).eq("college_id", collegeId);
    await supabase.from("library_card_applications").delete().eq("user_id", id).eq("college_id", collegeId);
    await supabase.from("book_borrows").delete().eq("user_id", id).eq("college_id", collegeId);

    // Fallback: Delete from students/non_students by their primary key in case of orphaned data
    await supabase.from("students").delete().eq("id", id).eq("college_id", collegeId);
    await supabase.from("non_students").delete().eq("id", id).eq("college_id", collegeId);
  }

  async getProfile(userId: string, collegeId?: string) {
    let query = supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("user_id", userId);
    if (collegeId) {
      query = query.eq("college_id", collegeId);
    }
    const { data } = await query.maybeSingle();
    return data;
  }

  async createProfile(profile: any, collegeId: string) {
    const toInsert = toSnakeCase(profile);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("profiles")
      .insert(toInsert)
      .select(PROFILE_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, profile: any, collegeId?: string) {
    const toUpdate = toSnakeCase(profile);
    delete toUpdate.id;
    toUpdate.updated_at = new Date().toISOString();

    let query = supabase
      .from("profiles")
      .update(toUpdate)
      .eq("user_id", userId);
    if (collegeId) {
      query = query.eq("college_id", collegeId);
    }
    const { data, error } = await query
      .select(PROFILE_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async getUserRoles(userId: string, collegeId?: string) {
    let query = supabase
      .from("user_roles")
      .select(USER_ROLE_SELECT)
      .eq("user_id", userId);
    if (collegeId) {
      query = query.eq("college_id", collegeId);
    }
    const { data } = await query;
    return data || [];
  }

  async createUserRole(role: any, collegeId: string) {
    const { data, error } = await supabase
      .from("user_roles")
      .insert({
        user_id: role.userId,
        role: role.role,
        college_id: collegeId,
      })
      .select(USER_ROLE_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async hasRole(userId: string, role: string, collegeId?: string) {
    let query = supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", role);
    
    if (collegeId) {
      query = query.eq("college_id", collegeId);
    }
    
    const { data } = await query.maybeSingle();
    return !!data;
  }

  async getContactMessages(collegeId: string) {
    const { data } = await supabase
      .from("contact_messages")
      .select(MESSAGE_SELECT)
      .eq("college_id", collegeId);
    return data || [];
  }

  async getContactMessage(id: string, collegeId: string) {
    const { data } = await supabase
      .from("contact_messages")
      .select(MESSAGE_SELECT)
      .eq("id", id)
      .eq("college_id", collegeId)
      .maybeSingle();
    return data;
  }

  async createContactMessage(message: any, collegeId: string) {
    const toInsert = toSnakeCase(message);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("contact_messages")
      .insert(toInsert)
      .select(MESSAGE_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateContactMessageSeen(id: string, isSeen: boolean, collegeId: string) {
    const { data, error } = await supabase
      .from("contact_messages")
      .update({ is_seen: isSeen })
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(MESSAGE_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteContactMessage(id: string, collegeId: string) {
    await supabase.from("contact_messages")
      .delete()
      .eq("id", id)
      .eq("college_id", collegeId);
  }

  async getBookBorrows(collegeId: string) {
    const { data: borrows } = await supabase
      .from("book_borrows")
      .select(BOOK_BORROW_SELECT)
      .eq("college_id", collegeId)
      .order("created_at", { ascending: false });

    if (!borrows || borrows.length === 0) return [];

    const cardIds = [
      ...new Set(
        borrows
          .map((b: any) => b.libraryCardId)
          .filter((id: string) => id && id !== "-" && !id.startsWith("card-")),
      ),
    ];

    let addressMap: Record<string, string> = {};

    if (cardIds.length > 0) {
      const { data: cards } = await supabase
        .from("library_card_applications")
        .select(
          "card_number, address_street, address_city, address_state, address_zip",
        )
        .eq("college_id", collegeId)
        .in("card_number", cardIds);

      if (cards && cards.length > 0) {
        cards.forEach((card: any) => {
          const parts = [
            card.address_street,
            card.address_city,
            card.address_state,
          ].filter((p) => p && p.trim().length > 0);

          const fullAddress = parts.length > 0 ? parts.join(", ") : null;
          const key = (card.card_number || "").trim();
          if (key && fullAddress) {
            addressMap[key] = fullAddress;
            addressMap[key.toLowerCase()] = fullAddress;
          }
        });
      }
    }

    return borrows.map((b: any) => {
      const lookUpKey = (b.libraryCardId || "").trim();
      const addr = addressMap[lookUpKey] || addressMap[lookUpKey.toLowerCase()];

      return {
        ...b,
        borrowerAddress: addr || null,
      };
    });
  }

  async getBookBorrowsByUser(userId: string, collegeId: string) {
    const { data } = await supabase
      .from("book_borrows")
      .select(BOOK_BORROW_SELECT)
      .eq("user_id", userId)
      .eq("college_id", collegeId);
    return data || [];
  }

  async createBookBorrow(borrow: any, collegeId: string) {
    const toInsert = toSnakeCase(borrow);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("book_borrows")
      .insert(toInsert)
      .select(BOOK_BORROW_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateBookBorrowStatus(id: string, status: string, collegeId: string, returnDate?: Date) {
    const update: any = { status };
    if (returnDate) update.return_date = returnDate.toISOString();
    const { data, error } = await supabase
      .from("book_borrows")
      .update(update)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(BOOK_BORROW_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteBookBorrow(id: string, collegeId: string) {
    await supabase.from("book_borrows")
      .delete()
      .eq("id", id)
      .eq("college_id", collegeId);
  }

  async getLibraryCardApplications(collegeId: string) {
    const { data } = await supabase
      .from("library_card_applications")
      .select(LIBRARY_CARD_SELECT)
      .eq("college_id", collegeId);
    return data || [];
  }

  async getLibraryCardApplication(id: string, collegeId?: string) {
    let query = supabase
      .from("library_card_applications")
      .select(LIBRARY_CARD_SELECT)
      .eq("id", id);
    if (collegeId) query = query.eq("college_id", collegeId);
    const { data } = await query.maybeSingle();
    return data;
  }

  async getLibraryCardApplicationsByUser(userId: string, collegeId: string) {
    const { data } = await supabase
      .from("library_card_applications")
      .select(LIBRARY_CARD_SELECT)
      .eq("user_id", userId)
      .eq("college_id", collegeId);
    return data || [];
  }

  async createLibraryCardApplication(application: any, collegeId: string) {
    const { data: existing } = await supabase
      .from("library_card_applications")
      .select("id")
      .eq("email", application.email)
      .eq("college_id", collegeId)
      .maybeSingle();
    if (existing) {
      throw new Error(
        "A library card application with this email already exists",
      );
    }

    // Fetch site settings for branding (scoped to college)
    const { data: settings } = await supabase
      .from("site_settings")
      .select("institute_short_name")
      .eq("college_id", collegeId)
      .maybeSingle();
    const shortName = settings?.institute_short_name || "GCFM";

    const fieldCodeMap: Record<string, string> = {
      "Computer Science": "CS",
      Commerce: "COM",
      Humanities: "HM",
      "Pre-Engineering": "PE",
      "Pre-Medical": "PM",
    };

    // Standardize the field code
    const fieldCode =
      fieldCodeMap[application.field || ""] ||
      (application.field
        ? application.field.substring(0, 3).toUpperCase()
        : "XX");

    const cleanRollNo = (application.rollNo || "").trim();
    // Custom fix: Remove "Class " prefix if present (e.g. "Class 12" -> "12")
    const classNum = (application.class || "").replace(/^Class\s*/i, "").trim();

    // Base card number
    let cardNumber = `${fieldCode}-${cleanRollNo}-${classNum}`;

    let counter = 1;
    let baseCardNumber = cardNumber;
    let isUnique = false;
    while (!isUnique) {
      const { data: dup } = await supabase
        .from("library_card_applications")
        .select("id")
        .ilike("card_number", cardNumber)
        .eq("college_id", collegeId)
        .maybeSingle();
      if (!dup) isUnique = true;
      else {
        cardNumber = `${baseCardNumber}-${counter}`;
        counter++;
      }
    }

    const studentId = `${shortName}-${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")}`;
    const issueDate = new Date().toISOString().split("T")[0];
    const validThrough = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const toInsert = {
      ...toSnakeCase(application),
      status: "pending",
      card_number: cardNumber,
      student_id: studentId,
      issue_date: issueDate,
      valid_through: validThrough,
      college_id: collegeId,
    };

    const { data, error } = await supabase
      .from("library_card_applications")
      .insert(toInsert)
      .select(LIBRARY_CARD_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async getLibraryCardByCardNumber(cardNumber: string, collegeId: string) {
    const { data } = await supabase
      .from("library_card_applications")
      .select(LIBRARY_CARD_SELECT)
      .ilike("card_number", cardNumber)
      .eq("college_id", collegeId)
      .maybeSingle();
    return data;
  }

  async updateLibraryCardApplicationStatus(id: string, status: string, collegeId: string) {
    const { data, error } = await supabase
      .from("library_card_applications")
      .update({
        status: status.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(LIBRARY_CARD_SELECT)
      .single();

    if (error) throw error;

    if (status.toLowerCase() === "approved" && data) {
      const cardId = data.cardNumber;
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("card_id", cardId)
        .eq("college_id", collegeId)
        .maybeSingle();
      if (!student) {
        await supabase.from("students").insert({
          user_id: data.userId || data.id,
          card_id: cardId,
          name: `${data.firstName} ${data.lastName}`,
          class: data.class,
          field: data.field,
          roll_no: data.rollNo,
          college_id: collegeId,
        });
      }
    }
    return data;
  }

  async deleteLibraryCardApplication(id: string, collegeId: string) {
    const { data: app } = await supabase
      .from("library_card_applications")
      .select("card_number")
      .eq("id", id)
      .eq("college_id", collegeId)
      .maybeSingle();
    await supabase.from("library_card_applications")
      .delete()
      .eq("id", id)
      .eq("college_id", collegeId);
    if (app?.card_number) {
      await supabase.from("students")
        .delete()
        .eq("card_id", app.card_number)
        .eq("college_id", collegeId);
    }
  }

  async getDonations(collegeId: string) {
    const { data } = await supabase
      .from("donations")
      .select(DONATION_SELECT)
      .eq("college_id", collegeId);
    return data || [];
  }

  async createDonation(donation: any, collegeId: string) {
    const toInsert = toSnakeCase(donation);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("donations")
      .insert(toInsert)
      .select(DONATION_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteDonation(id: string, collegeId: string) {
    await supabase.from("donations")
      .delete()
      .eq("id", id)
      .eq("college_id", collegeId);
  }

  async getStudents(collegeId: string) {
    try {
      const { data: students, error: sErr } = await supabase
        .from("students")
        .select("*")
        .eq("college_id", collegeId);
      if (sErr) throw sErr;
      const { data: users, error: uErr } = await supabase
        .from("users")
        .select("id, email")
        .eq("college_id", collegeId);
      if (uErr) throw uErr;
      const userMap = users.reduce((acc: any, u: any) => {
        acc[u.id] = u.email;
        return acc;
      }, {});
      return (students || []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        cardId: s.card_id,
        name: s.name,
        class: s.class,
        field: s.field,
        rollNo: s.roll_no,
        createdAt: s.created_at,
        email: userMap[s.user_id] || "-",
        type: "student",
        role: "Student",
      }));
    } catch (error) {
      console.error("[ERROR] getStudents manual join failed:", error);
      return [];
    }
  }

  async createStudent(student: any, collegeId: string) {
    const toInsert = toSnakeCase(student);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("students")
      .insert(toInsert)
      .select(STUDENT_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async getNonStudents(collegeId: string) {
    try {
      const { data: users, error: uErr } = await supabase
        .from("users")
        .select("id, email, created_at")
        .eq("college_id", collegeId);
      if (uErr) throw uErr;
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone, role")
        .eq("college_id", collegeId);
      if (pErr) throw pErr;
      const { data: user_roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .eq("college_id", collegeId);
      if (rErr) throw rErr;

      const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});
      const rolesMap = (user_roles || []).reduce((acc: any, r: any) => {
        if (!acc[r.user_id]) acc[r.user_id] = [];
        acc[r.user_id].push(r.role);
        return acc;
      }, {});

      const results = (users || []).map((u: any) => {
        const profile = profileMap[u.id];
        const roles = rolesMap[u.id] || [];
        const isAdmin = roles.includes("admin");
        return {
          id: u.id,
          email: u.email,
          name: profile?.full_name || u.email.split("@")[0],
          role: profile?.role || (isAdmin ? "Admin" : "Visitor"),
          phone: profile?.phone || "-",
          createdAt: u.created_at,
          type: isAdmin ? "admin" : "registered people",
        };
      });
      return results.filter((u: any) => u.role !== "Student");
    } catch (error) {
      console.error("[ERROR] getNonStudents manual join failed:", error);
      return [];
    }
  }

  async getNotes(collegeId: string) {
    const { data } = await supabase
      .from("notes")
      .select(NOTE_SELECT)
      .eq("college_id", collegeId);
    return data || [];
  }

  async getNotesByClassAndSubject(studentClass: string, subject: string, collegeId: string) {
    const { data } = await supabase
      .from("notes")
      .select(NOTE_SELECT)
      .eq("class", studentClass)
      .eq("subject", subject)
      .eq("status", "active")
      .eq("college_id", collegeId);
    return data || [];
  }

  async getActiveNotes(collegeId: string) {
    const { data } = await supabase
      .from("notes")
      .select(NOTE_SELECT)
      .eq("status", "active")
      .eq("college_id", collegeId);
    return data || [];
  }

  async createNote(note: any, collegeId: string) {
    const toInsert = toSnakeCase(note);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("notes")
      .insert(toInsert)
      .select(NOTE_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateNote(id: string, note: any, collegeId: string) {
    const toUpdate = toSnakeCase(note);
    delete toUpdate.id;
    toUpdate.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("notes")
      .update(toUpdate)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(NOTE_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteNote(id: string, collegeId: string) {
    await supabase.from("notes").delete().eq("id", id).eq("college_id", collegeId);
  }

  async toggleNoteStatus(id: string, collegeId: string) {
    const note = await this.getNote(id, collegeId);
    if (!note) return;
    const newStatus = note.status === "active" ? "inactive" : "active";
    const { data } = await supabase
      .from("notes")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(NOTE_SELECT)
      .single();
    return data;
  }

  async getNote(id: string, collegeId?: string) {
    let query = supabase
      .from("notes")
      .select(NOTE_SELECT)
      .eq("id", id);
    if (collegeId) {
      query = query.eq("college_id", collegeId);
    }
    const { data } = await query.maybeSingle();
    return data;
  }

  async getRareBooks(collegeId: string) {
    const { data } = await supabase
      .from("rare_books")
      .select(RARE_BOOK_SELECT)
      .eq("college_id", collegeId);
    return data || [];
  }

  async getRareBook(id: string, collegeId: string) {
    const { data } = await supabase
      .from("rare_books")
      .select(RARE_BOOK_SELECT)
      .eq("id", id)
      .eq("college_id", collegeId)
      .maybeSingle();
    return data;
  }

  async createRareBook(book: any, collegeId: string) {
    const toInsert = toSnakeCase(book);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("rare_books")
      .insert(toInsert)
      .select(RARE_BOOK_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteRareBook(id: string, collegeId: string) {
    await supabase.from("rare_books").delete().eq("id", id).eq("college_id", collegeId);
  }

  async toggleRareBookStatus(id: string, collegeId: string) {
    const book = await this.getRareBook(id, collegeId);
    if (!book) return;
    const newStatus = book.status === "active" ? "inactive" : "active";
    const { data } = await supabase
      .from("rare_books")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(RARE_BOOK_SELECT)
      .single();
    return data;
  }

  async getBooks(collegeId: string) {
    const { data } = await supabase
      .from("books")
      .select(BOOK_SELECT)
      .eq("college_id", collegeId)
      .order("created_at", { ascending: false });
    return data || [];
  }

  async getBook(id: string, collegeId?: string) {
    let query = supabase
      .from("books")
      .select(BOOK_SELECT)
      .eq("id", id);
    if (collegeId) query = query.eq("college_id", collegeId);
    const { data } = await query.maybeSingle();
    return data;
  }

  async createBook(book: any, collegeId: string) {
    const toInsert = toSnakeCase(book);
    toInsert.college_id = collegeId;
    toInsert.created_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("books")
      .insert(toInsert)
      .select(BOOK_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateBook(id: string, book: any, collegeId: string) {
    const toUpdate = toSnakeCase(book);
    delete toUpdate.id;
    toUpdate.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("books")
      .update(toUpdate)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(BOOK_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteBook(id: string, collegeId: string) {
    await supabase.from("books").delete().eq("id", id).eq("college_id", collegeId);
  }

  async getEvents(collegeId: string) {
    const { data } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("college_id", collegeId);
    return data || [];
  }

  async createEvent(event: any, collegeId: string) {
    const toInsert = toSnakeCase(event);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("events")
      .insert(toInsert)
      .select(EVENT_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateEvent(id: string, event: any, collegeId: string) {
    const toUpdate = toSnakeCase(event);
    delete toUpdate.id;
    toUpdate.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("events")
      .update(toUpdate)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(EVENT_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteEvent(id: string, collegeId: string) {
    await supabase.from("events").delete().eq("id", id).eq("college_id", collegeId);
  }

  async getNotifications(collegeId: string) {
    const { data } = await supabase
      .from("notifications")
      .select(NOTIFICATION_SELECT)
      .eq("college_id", collegeId);
    return data || [];
  }

  async getActiveNotifications(collegeId: string) {
    const { data } = await supabase
      .from("notifications")
      .select(NOTIFICATION_SELECT)
      .eq("status", "active")
      .eq("college_id", collegeId);
    return (data || []).sort((a: any, b: any) => {
      if (a.pin === b.pin)
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return a.pin ? -1 : 1;
    });
  }

  async createNotification(notification: any, collegeId: string) {
    const toInsert = toSnakeCase(notification);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("notifications")
      .insert(toInsert)
      .select(NOTIFICATION_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateNotification(id: string, notification: any, collegeId: string) {
    const toUpdate = toSnakeCase(notification);
    delete toUpdate.id;
    const { data, error } = await supabase
      .from("notifications")
      .update(toUpdate)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(NOTIFICATION_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteNotification(id: string, collegeId: string) {
    await supabase.from("notifications").delete().eq("id", id).eq("college_id", collegeId);
  }

  async toggleNotificationStatus(id: string, collegeId: string) {
    const { data: n } = await supabase
      .from("notifications")
      .select("status")
      .eq("id", id)
      .eq("college_id", collegeId)
      .single();
    if (!n) return;
    const newStatus = n.status === "active" ? "inactive" : "active";
    const { data } = await supabase
      .from("notifications")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(NOTIFICATION_SELECT)
      .single();
    return data;
  }

  async toggleNotificationPin(id: string, collegeId: string) {
    const { data: n } = await supabase
      .from("notifications")
      .select("pin")
      .eq("id", id)
      .eq("college_id", collegeId)
      .single();
    if (!n) return;
    const { data } = await supabase
      .from("notifications")
      .update({ pin: !n.pin })
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(NOTIFICATION_SELECT)
      .single();
    return data;
  }

  async uploadFile(bucket: string, file: any): Promise<string> {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename =
      uniqueSuffix + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    if (!file.buffer) throw new Error("File buffer is empty");
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (error) throw new Error("Failed to upload file: " + error.message);
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filename);
    return publicUrl;
  }

  async uploadFileFromBuffer(
    bucket: string,
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string> {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const uniqueFilename =
      uniqueSuffix + "-" + filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueFilename, buffer, { contentType: mimetype, upsert: false });
    if (error) throw new Error("Failed to upload buffer: " + error.message);
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(uniqueFilename);
    return publicUrl;
  }

  async deleteFile(pathOrUrl: string) {
    if (!pathOrUrl) return;
    if (pathOrUrl.startsWith("http")) {
      const parts = pathOrUrl.split("/storage/v1/object/public/");
      if (parts.length > 1) {
        const rest = parts[1];
        const bucket = rest.split("/")[0];
        const filename = rest.substring(bucket.length + 1);
        await supabase.storage.from(bucket).remove([filename]);
      }
    }
  }

  async getBlogPosts(collegeId: string, includeDrafts = false) {
    let query = supabase.from("blog_posts").select(BLOG_SELECT).eq("college_id", collegeId);
    if (!includeDrafts) query = query.eq("status", "published");
    const { data } = await query
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    return data || [];
  }

  async getBlogPost(slug: string, collegeId: string) {
    const { data } = await supabase
      .from("blog_posts")
      .select(BLOG_SELECT)
      .eq("slug", slug)
      .eq("college_id", collegeId)
      .maybeSingle();
    return data;
  }

  async getBlogPostById(id: string, collegeId: string) {
    const { data } = await supabase
      .from("blog_posts")
      .select(BLOG_SELECT)
      .eq("id", id)
      .eq("college_id", collegeId)
      .maybeSingle();
    return data;
  }

  async createBlogPost(post: any, collegeId: string) {
    const toInsert = toSnakeCase(post);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("blog_posts")
      .insert(toInsert)
      .select(BLOG_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateBlogPost(id: string, post: any, collegeId: string) {
    const toUpdate = toSnakeCase(post);
    delete toUpdate.id;
    toUpdate.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("blog_posts")
      .update(toUpdate)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(BLOG_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteBlogPost(id: string, collegeId: string) {
    await supabase.from("blog_posts").delete().eq("id", id).eq("college_id", collegeId);
  }

  async toggleBlogPostPin(id: string, collegeId: string) {
    const { data: p } = await supabase
      .from("blog_posts")
      .select("is_pinned")
      .eq("id", id)
      .eq("college_id", collegeId)
      .single();
    if (!p) return;
    const { data } = await supabase
      .from("blog_posts")
      .update({ is_pinned: !p.is_pinned })
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(BLOG_SELECT)
      .single();
    return data;
  }

  async getPrincipal(collegeId: string) {
    const { data } = await supabase
      .from("principal")
      .select(PRINCIPAL_SELECT)
      .eq("college_id", collegeId)
      .maybeSingle();
    return data;
  }

  async updatePrincipal(principalData: any, collegeId: string) {
    const existing = await this.getPrincipal(collegeId);
    const toSave = toSnakeCase(principalData);
    toSave.updated_at = new Date().toISOString();
    toSave.college_id = collegeId;
    if (existing) {
      delete toSave.id;
      const { data, error } = await supabase
        .from("principal")
        .update(toSave)
        .eq("id", existing.id)
        .eq("college_id", collegeId)
        .select(PRINCIPAL_SELECT)
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("principal")
        .insert(toSave)
        .select(PRINCIPAL_SELECT)
        .single();
      if (error) throw error;
      return data;
    }
  }

  async getFaculty(collegeId: string) {
    const { data } = await supabase
      .from("faculty_staff")
      .select(FACULTY_SELECT)
      .eq("college_id", collegeId)
      .order("created_at", { ascending: false });
    return data || [];
  }

  async getFacultyMember(id: string, collegeId: string) {
    const { data } = await supabase
      .from("faculty_staff")
      .select(FACULTY_SELECT)
      .eq("id", id)
      .eq("college_id", collegeId)
      .maybeSingle();
    return data;
  }

  async createFacultyMember(member: any, collegeId: string) {
    const toInsert = toSnakeCase(member);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("faculty_staff")
      .insert(toInsert)
      .select(FACULTY_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateFacultyMember(id: string, member: any, collegeId: string) {
    const toUpdate = toSnakeCase(member);
    delete toUpdate.id;
    toUpdate.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("faculty_staff")
      .update(toUpdate)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(FACULTY_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteFacultyMember(id: string, collegeId: string) {
    await supabase.from("faculty_staff").delete().eq("id", id).eq("college_id", collegeId);
  }

  // Home Content Methods
  async getHomeContent(collegeId: string) {
    const { data } = await supabase
      .from("home_content")
      .select(HOME_CONTENT_SELECT)
      .eq("college_id", collegeId)
      .maybeSingle();
    if (!data) {
      return {
        heroHeading: "DJ GOV. SCIENCE COLLEGE",
        heroSubheading:
          "Access thousands of books, research papers, and digital resources to fuel your academic journey.",
        heroOverlayText: "Welcome to Digital Learning",
        featuresHeading: "Why Choose Our Digital Library?",
        featuresSubheading:
          "Discover the features that make our library the perfect learning companion",
        affiliationsHeading: "College Affiliations & Authorities",
        ctaHeading: "Ready to Start Learning?",
        ctaSubheading:
          "Join thousands of students who are already using our digital portal for their academic success.",
      };
    }
    return data;
  }

  async updateHomeContent(content: any, collegeId: string) {
    const existing = await this.getHomeContent(collegeId);
    const toSave = toSnakeCase(content);
    toSave.updated_at = new Date().toISOString();
    toSave.college_id = collegeId;

    if (existing && "id" in existing) {
      delete toSave.id;
      const { data, error } = await supabase
        .from("home_content")
        .update(toSave)
        .eq("id", existing.id)
        .eq("college_id", collegeId)
        .select(HOME_CONTENT_SELECT)
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("home_content")
        .insert(toSave)
        .select(HOME_CONTENT_SELECT)
        .single();
      if (error) throw error;
      return data;
    }
  }

  // Home Slider Methods
  async getHomeSliderImages(collegeId: string) {
    const { data } = await supabase
      .from("home_slider_images")
      .select(HOME_SLIDER_SELECT)
      .eq("college_id", collegeId)
      .order("order", { ascending: true });
    return data || [];
  }

  async addHomeSliderImage(image: any, collegeId: string) {
    const toInsert = toSnakeCase(image);
    toInsert.college_id = collegeId;
    const { data, error } = await supabase
      .from("home_slider_images")
      .insert(toInsert)
      .select(HOME_SLIDER_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteHomeSliderImage(id: string, collegeId: string) {
    await supabase.from("home_slider_images").delete().eq("id", id).eq("college_id", collegeId);
  }

  async updateHomeSliderOrder(id: string, order: number, collegeId: string) {
    const { data, error } = await supabase
      .from("home_slider_images")
      .update({ order })
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(HOME_SLIDER_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateHomeSliderStatus(id: string, isActive: boolean, collegeId: string) {
    const { data, error } = await supabase
      .from("home_slider_images")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(HOME_SLIDER_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  // Home Stats Methods
  async getHomeStats(collegeId: string) {
    const { data } = await supabase
      .from("home_stats")
      .select(HOME_STAT_SELECT)
      .eq("college_id", collegeId)
      .order("order", { ascending: true });
    return data || [];
  }

  async updateHomeStat(id: string, stat: any, collegeId: string) {
    const toUpdate = toSnakeCase(stat);
    delete toUpdate.id;
    toUpdate.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("home_stats")
      .update(toUpdate)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(HOME_STAT_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async addHomeStat(stat: any, collegeId: string) {
    const toSave = toSnakeCase(stat);
    toSave.college_id = collegeId;
    const { data, error } = await supabase
      .from("home_stats")
      .insert(toSave)
      .select(HOME_STAT_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteHomeStat(id: string, collegeId: string) {
    const { error } = await supabase.from("home_stats").delete().eq("id", id).eq("college_id", collegeId);
    if (error) throw error;
    return { success: true };
  }

  // Home Affiliations Methods
  async getHomeAffiliations(collegeId: string) {
    const { data } = await supabase
      .from("home_affiliations")
      .select(HOME_AFFILIATION_SELECT)
      .eq("college_id", collegeId)
      .order("order", { ascending: true });
    return data || [];
  }

  async addHomeAffiliation(affiliation: any, collegeId: string) {
    const toSave = toSnakeCase(affiliation);
    toSave.college_id = collegeId;
    const { data, error } = await supabase
      .from("home_affiliations")
      .insert(toSave)
      .select(HOME_AFFILIATION_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async deleteHomeAffiliation(id: string, collegeId: string) {
    const { error } = await supabase
      .from("home_affiliations")
      .delete()
      .eq("id", id)
      .eq("college_id", collegeId);
    if (error) throw error;
    return { success: true };
  }

  async updateHomeAffiliationStatus(id: string, isActive: boolean, collegeId: string) {
    const { error } = await supabase
      .from("home_affiliations")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("college_id", collegeId);
    if (error) throw error;
    return { success: true };
  }

  async updateHomeAffiliationOrder(id: string, order: number, collegeId: string) {
    const { error } = await supabase
      .from("home_affiliations")
      .update({ order })
      .eq("id", id)
      .eq("college_id", collegeId);
    if (error) throw error;
    return { success: true };
  }

  async updateHomeSlider(image: any, collegeId: string) {
    const toUpdate = toSnakeCase(image);
    delete toUpdate.id;
    const { data, error } = await supabase
      .from("home_slider_images")
      .update(toUpdate)
      .eq("id", image.id)
      .eq("college_id", collegeId)
      .select(HOME_SLIDER_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateHomeAffiliation(affiliation: any, collegeId: string) {
    const toUpdate = toSnakeCase(affiliation);
    delete toUpdate.id;
    const { data, error } = await supabase
      .from("home_affiliations")
      .update(toUpdate)
      .eq("id", affiliation.id)
      .eq("college_id", collegeId)
      .select(HOME_AFFILIATION_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  // Home Buttons Methods
  async getHomeButtons(collegeId: string) {
    const { data } = await supabase
      .from("home_buttons")
      .select(HOME_BUTTON_SELECT)
      .eq("college_id", collegeId);
    return data || [];
  }

  async updateHomeButton(id: string, button: any, collegeId: string) {
    const toUpdate = toSnakeCase(button);
    delete toUpdate.id;
    toUpdate.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from("home_buttons")
      .update(toUpdate)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(HOME_BUTTON_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  // Site Settings Methods
  async getSiteSettings(collegeId: string) {
    const { data } = await supabase
      .from("site_settings")
      .select(SITE_SETTINGS_SELECT)
      .eq("college_id", collegeId)
      .maybeSingle();
    return data || {};
  }

  async updateSiteSettings(settings: any, collegeId: string) {
    console.log(
      `[updateSiteSettings] Updating for college ${collegeId} with keys:`,
      Object.keys(settings),
    );

    const validColumns = [
      "primary_color",
      "navbar_logo",
      "hero_background_logo",
      "loading_logo",
      "institute_short_name",
      "institute_full_name",
      "footer_title",
      "footer_description",
      "facebook_url",
      "twitter_url",
      "instagram_url",
      "youtube_url",
      "credits_text",
      "contributors_text",
      "contact_address",
      "contact_phone",
      "contact_email",
      "map_embed_url",
      "footer_tagline",
      "card_contact_phone",
      "rb_watermark_text",
      "card_header_text",
      "card_subheader_text",
      "card_logo_url",
      "rb_disclaimer_text",
      "card_qr_url",
      "card_terms_text",
      "card_contact_address",
      "card_contact_email",
      "card_qr_enabled",
      "rb_watermark_opacity",
      "rb_watermark_enabled",
      "hero_background_opacity",
      "google_map_link",
      "easypaisa_number",
      "bank_account_number",
      "bank_name",
      "bank_branch",
      "account_title",
    ];

    const fieldMap: Record<string, string> = {
      primaryColor: "primary_color",
      navbarLogo: "navbar_logo",
      heroBackgroundLogo: "hero_background_logo",
      heroBackgroundOpacity: "hero_background_opacity",
      loadingLogo: "loading_logo",
      instituteShortName: "institute_short_name",
      instituteFullName: "institute_full_name",
      footerTitle: "footer_title",
      footerDescription: "footer_description",
      footerTagline: "footer_tagline",
      facebookUrl: "facebook_url",
      twitterUrl: "twitter_url",
      instagramUrl: "instagram_url",
      youtubeUrl: "youtube_url",
      creditsText: "credits_text",
      contributorsText: "contributors_text",
      contactAddress: "contact_address",
      contactPhone: "contact_phone",
      contactEmail: "contact_email",
      mapEmbedUrl: "map_embed_url",
      googleMapLink: "google_map_link",
      cardHeaderText: "card_header_text",
      cardSubheaderText: "card_subheader_text",
      cardLogoUrl: "card_logo_url",
      cardQrEnabled: "card_qr_enabled",
      cardQrUrl: "card_qr_url",
      cardTermsText: "card_terms_text",
      cardContactAddress: "card_contact_address",
      cardContactEmail: "card_contact_email",
      cardContactPhone: "card_contact_phone",
      rbWatermarkText: "rb_watermark_text",
      rbWatermarkOpacity: "rb_watermark_opacity",
      rbDisclaimerText: "rb_disclaimer_text",
      rbWatermarkEnabled: "rb_watermark_enabled",
      easypaisaNumber: "easypaisa_number",
      bankAccountNumber: "bank_account_number",
      bankName: "bank_name",
      bankBranch: "bank_branch",
      accountTitle: "account_title",
    };

    const toUpdate: any = { college_id: collegeId };

    for (const [key, value] of Object.entries(settings)) {
      const dbKey = fieldMap[key] || (validColumns.includes(key) ? key : null);
      if (dbKey && validColumns.includes(dbKey)) {
        let finalValue: any = value;
        if (dbKey === "rb_watermark_opacity" || dbKey === "hero_background_opacity") {
          finalValue = parseFloat(String(value)) || 0;
        } else if (dbKey === "card_qr_enabled" || dbKey === "rb_watermark_enabled") {
          finalValue = String(value) === "true" || value === true;
        } else if (value === "null" || value === null) {
          finalValue = null;
        } else {
          finalValue = String(value);
        }
        toUpdate[dbKey] = finalValue;
      }
    }

    toUpdate.updated_at = new Date().toISOString();

    try {
      const existing = await this.getSiteSettings(collegeId);
      if (existing && "id" in existing) {
        const { data, error } = await supabase
          .from("site_settings")
          .update(toUpdate)
          .eq("id", (existing as any).id)
          .eq("college_id", collegeId)
          .select(SITE_SETTINGS_SELECT)
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("site_settings")
          .insert(toUpdate)
          .select(SITE_SETTINGS_SELECT)
          .single();
        if (error) throw error;
        return data;
      }
    } catch (err: any) {
      console.error("[updateSiteSettings] Database operation failed:", err);
      throw new Error(`Settings Update Error: ${err.message}`);
    }
  }

  // Library Card Fields Methods (Dynamic Field Builder)
  async getLibraryCardFields(collegeId: string) {
    const { data, error } = await supabase
      .from("library_card_fields")
      .select(LIBRARY_CARD_FIELD_SELECT)
      .eq("college_id", collegeId)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async getLibraryCardFieldById(id: string, collegeId: string) {
    const { data, error } = await supabase
      .from("library_card_fields")
      .select(LIBRARY_CARD_FIELD_SELECT)
      .eq("id", id)
      .eq("college_id", collegeId)
      .single();
    if (error) throw error;
    return data;
  }

  async createLibraryCardField(field: any, collegeId: string) {
    const toInsert = toSnakeCase(field);
    toInsert.college_id = collegeId;
    toInsert.created_at = new Date().toISOString();
    toInsert.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("library_card_fields")
      .insert(toInsert)
      .select(LIBRARY_CARD_FIELD_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  async updateLibraryCardField(id: string, field: any, collegeId: string) {
    const toUpdate = toSnakeCase(field);
    delete toUpdate.id;
    toUpdate.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("library_card_fields")
      .update(toUpdate)
      .eq("id", id)
      .eq("college_id", collegeId)
      .select(LIBRARY_CARD_FIELD_SELECT)
      .single();
    if (error) throw error;
    return data;
  }

  // --- History CMS Functions ---

  async getHistoryPage(collegeId: string): Promise<any> {
    const { data, error } = await supabase
      .from("college_history_page")
      .select(HISTORY_PAGE_SELECT)
      .eq("college_id", collegeId)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      return this.updateHistoryPage(
        "History of College",
        "A legacy of academic excellence spanning over seven decades.",
        collegeId
      );
    }
    return data;
  }

  async updateHistoryPage(title: string, subtitle: string, collegeId: string): Promise<any> {
    const existing = await supabase
      .from("college_history_page")
      .select("id")
      .eq("college_id", collegeId)
      .maybeSingle();

    const payload: any = { 
      title, 
      subtitle, 
      college_id: collegeId,
      updated_at: new Date().toISOString() 
    };

    let query;
    if (existing.data) {
      query = supabase
        .from("college_history_page")
        .update(payload)
        .eq("id", existing.data.id)
        .eq("college_id", collegeId);
    } else {
      query = supabase
        .from("college_history_page")
        .insert(payload);
    }

    const { data, error } = await query
      .select(HISTORY_PAGE_SELECT)
      .single();

    if (error) throw error;
    return data;
  }

  async getHistorySections(collegeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("college_history_sections")
      .select(HISTORY_SECTION_SELECT)
      .eq("college_id", collegeId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async upsertHistorySection(section: any, collegeId: string): Promise<any> {
    const snakeData = toSnakeCase(section);
    snakeData.college_id = collegeId;

    if (section.id) {
      snakeData.id = section.id;
    } else if (!snakeData.id) {
      snakeData.id = generateId();
    }
    snakeData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("college_history_sections")
      .upsert(snakeData)
      .select(HISTORY_SECTION_SELECT)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteHistorySection(id: string, collegeId: string): Promise<void> {
    const { error } = await supabase
      .from("college_history_sections")
      .delete()
      .eq("id", id)
      .eq("college_id", collegeId);

    if (error) throw error;
  }

  async getHistoryGallery(collegeId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("college_history_gallery")
      .select(HISTORY_GALLERY_SELECT)
      .eq("college_id", collegeId)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async addHistoryGalleryImage(
    imageUrl: string,
    collegeId: string,
    caption?: string,
    displayOrder?: number,
  ): Promise<any> {
    const { data, error } = await supabase
      .from("college_history_gallery")
      .insert({
        image_url: imageUrl,
        college_id: collegeId,
        caption,
        display_order: displayOrder || 0,
      })
      .select(HISTORY_GALLERY_SELECT)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteHistoryGalleryImage(id: string, collegeId: string): Promise<void> {
    const { error } = await supabase
      .from("college_history_gallery")
      .delete()
      .eq("id", id)
      .eq("college_id", collegeId);

    if (error) throw error;
  }

  async updateHistoryGalleryOrder(
    items: { id: string; displayOrder: number }[],
    collegeId: string,
  ): Promise<void> {
    for (const item of items) {
      await supabase
        .from("college_history_gallery")
        .update({ display_order: item.displayOrder })
        .eq("id", item.id)
        .eq("college_id", collegeId);
    }
  }

  async deleteLibraryCardField(id: string, collegeId: string) {
    const { error } = await supabase
      .from("library_card_fields")
      .delete()
      .eq("id", id)
      .eq("college_id", collegeId);
    if (error) throw error;
  }
}

export const storage = new DbStorage();
