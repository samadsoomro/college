import type { Express, Request, Response, NextFunction } from "express";
import { storage, supabase } from "./db-storage";
import { resolveCollege } from "./middleware";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";

// Helper to delete files from uploads directory (delegates to Supabase)
const deleteFile = (pathOrUrl: string | undefined | null) => {
  if (pathOrUrl) storage.deleteFile(pathOrUrl);
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/gif",
      "image/bmp",
      "image/svg+xml",
      "image/tiff",
    ];
    const imageFieldNames = [
      "bookImage",
      "eventImages",
      "coverImage",
      "image",
      "featuredImage",
      "navbarLogo",
      "loadingLogo",
      "cardLogo",
      "heroBackgroundLogo",
    ];

    if (imageFieldNames.includes(file.fieldname)) {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Only JPG, PNG, WEBP, GIF, BMP, and SVG images are allowed",
          ) as any,
        );
      }
    } else if (
      file.mimetype === "application/pdf" ||
      file.fieldname === "file"
    ) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported") as any);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// No hardcoded credentials
const ADMIN_EMAIL = "gcfm@admin.com";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
    isLibraryCard?: boolean;
    // Super Admin
    isSuperAdmin?: boolean;
    superAdminEmail?: string;
    adminId?: string;
    // College slug for scoped admin
    collegeSlug?: string;
    collegeId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      collegeId?: string;
      college?: {
        id: string;
        slug: string;
        name: string;
        shortName: string;
        storageBucket: string;
        isActive: boolean;
      };
    }
  }
}

interface MulterRequest extends Request {
  file?: Express.Multer.File;
  files?:
  | { [fieldname: string]: Express.Multer.File[] }
  | Express.Multer.File[];
}

export function registerRoutes(app: Express): void {
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ── Super Admin Routes ──────────────────────────────────────────────────
  const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.isSuperAdmin) {
      return next();
    }
    res.status(403).json({ error: "Super Admin access required" });
  };


  app.get("/api/super-admin/me", (req, res) => {
    if (req.session.isSuperAdmin) {
      return res.json({ user: { email: req.session.superAdminEmail }, isSuperAdmin: true });
    }
    res.status(401).json({ error: "Not authenticated" });
  });

  app.post("/api/super-admin/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/super-admin/colleges", requireSuperAdmin, async (req, res) => {
    const colleges = await storage.getColleges();
    res.json(colleges);
  });

  app.post('/api/super-admin/colleges', requireSuperAdmin, async (req, res) => {
    const { name, shortName, slug, adminEmail, adminPassword } = req.body;

    // 1. Check slug uniqueness
    const existing = await storage.getCollegeBySlug(slug);
    if (existing) return res.status(400).json({ error: 'College slug already exists' });

    // 2. Create college row
    const college = await storage.createCollege({ name, shortName, slug });

    // 3. Hash password and insert into admin_credentials — THIS MUST HAPPEN
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const { error } = await supabase
      .from('admin_credentials')
      .insert({
        admin_email: adminEmail,
        password_hash: passwordHash,
        role: 'client_admin',
        college_id: college.id,
        secret_key: '',
        is_active: true
      });

    if (error) {
      // Rollback college if admin creation fails
      await supabase.from('colleges').delete().eq('id', college.id);
      return res.status(500).json({ error: 'Failed to create admin: ' + error.message });
    }

    // 4. Initialize default site settings for this college
    await storage.updateSiteSettings({
      instituteFullName: name,
      instituteShortName: shortName,
      primaryColor: '#006600'
    }, college.id);

    return res.json({
      success: true,
      college,
      url: `/${slug}`
    });
  });

  app.delete("/api/super-admin/colleges/:id", requireSuperAdmin, async (req, res) => {
    try {
      await storage.deleteCollege(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ── Auth Routes ──────────────────────────────────────────────────────────
  app.post("/api/:collegeSlug/auth/register", resolveCollege, async (req, res) => {
    try {
      const {
        email,
        password,
        fullName,
        phone,
        rollNumber,
        department,
        studentClass,
        classification,
      } = req.body;

      if (!email || !password || !fullName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existing = await storage.getUserByEmail(email, req.collegeId);
      if (existing) {
        return res.status(400).json({ error: "Email already registered in this college" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        fullName,
        phone,
        rollNumber,
        department,
        studentClass,
        classification,
        type: studentClass ? "student" : "user",
      }, req.collegeId!);

      await storage.createUserRole({ 
        userId: user.id, 
        role: "user"
      }, req.collegeId!);

      req.session.userId = user.id;
      req.session.isAdmin = false;
      req.session.collegeId = req.collegeId;

      res.json({ user: { id: user.id, email: user.email } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/:collegeSlug/auth/check-email', resolveCollege, async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('college_id', req.college!.id)
      .maybeSingle();
      
    res.json({ available: !data });
  });

  app.post('/api/:collegeSlug/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const { collegeSlug } = req.params;

    console.log('[LOGIN] email:', email, 'slug:', collegeSlug);
    console.log('[LOGIN] body:', req.body);

    try {
      // STEP 1 — Super Admin check (must run FIRST, before anything else)
    const { data: superAdmin } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('admin_email', email)
      .eq('role', 'developer')
      .eq('is_active', true)
      .maybeSingle();

    console.log('[LOGIN] superAdmin found:', !!superAdmin);

    if (superAdmin) {
      const match = await bcrypt.compare(password, superAdmin.password_hash);
      console.log('[LOGIN] superAdmin password match:', match);
      if (match) {
        req.session.isSuperAdmin = true;
        req.session.adminId = superAdmin.id;
        req.session.userId = 'super-admin';
        return res.json({
          redirect: '/super-admin/dashboard',
          role: 'superadmin'
        });
      }
    }

      // Step 2: Check college admin
      console.log(`[LOGIN] Checking college admin credentials for ${collegeSlug}`);
      const { data: college } = await supabase
        .from('colleges')
        .select('id, slug')
        .eq('slug', collegeSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (!college) {
        console.log(`[LOGIN] College ${collegeSlug} not found or inactive`);
        return res.status(404).json({ error: 'College not found' });
      }

      console.log(`[LOGIN] Checking college-scoped admin for ${email} in ${college.slug}`);
      const { data: admin } = await supabase
        .from('admin_credentials')
        .select('*')
        .eq('admin_email', email)
        .eq('role', 'client_admin')
        .eq('college_id', college.id)
        .eq('is_active', true)
        .maybeSingle();

      if (admin) {
        console.log(`[LOGIN] College admin record found for ${email}`);
        const match = await bcrypt.compare(password, admin.password_hash);
        if (match) {
          console.log(`[LOGIN] College admin password match for ${email}`);
          req.session.isAdmin = true;
          req.session.userId = "admin";
          req.session.collegeId = college.id;
          req.session.collegeSlug = collegeSlug;
          return res.json({ redirect: `/${collegeSlug}/admin-dashboard`, role: 'admin' });
        } else {
          console.log(`[LOGIN] College admin password MISMATCH for ${email}`);
        }
      }

      // Step 3: Check regular user
      const { libraryCardId } = req.body;
      if (libraryCardId) {
        console.log(`[LOGIN] Checking library card login for ${libraryCardId}`);
        const card = await storage.getLibraryCardByCardNumber(libraryCardId, college.id);
        if (card && card.status === "approved" && card.password) {
          console.log(`[LOGIN] Approved library card found: ${libraryCardId}`);
          const match = await bcrypt.compare(password, card.password);
          if (match) {
            console.log(`[LOGIN] Library card password match for ${libraryCardId}`);
            req.session.userId = `card-${card.id}`;
            req.session.collegeId = college.id;
            req.session.isLibraryCard = true;
            return res.json({ redirect: `/${collegeSlug}`, role: 'user' });
          } else {
            console.log(`[LOGIN] Library card password MISMATCH for ${libraryCardId}`);
          }
        }
      }

      console.log('[LOGIN] Checking regular user for', email);
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('college_id', college.id)  // ← must match college
        .maybeSingle();

      console.log('[LOGIN] regular user found:', !!user);

      if (user) {
        const match = await bcrypt.compare(password, user.password);
        console.log('[LOGIN] user password match:', match);
        if (match) {
          req.session.userId = user.id;
          req.session.collegeId = college.id;
          req.session.collegeSlug = collegeSlug;
          return res.json({
            redirect: `/${collegeSlug}`,
            role: 'user'
          });
        }
      }

      console.log(`[LOGIN] No match found for ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    } catch (error: any) {
      console.error(`[LOGIN] Error during login for ${email}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collegeSlug/auth/logout", async (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/:collegeSlug/auth/me", resolveCollege, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Ensure session college matches request college (safety)
    if (req.session.collegeId && req.session.collegeId !== req.collegeId) {
      return res.status(401).json({ error: "Session-College mismatch" });
    }

    // Admin session (client admin)
    if (req.session.isAdmin && req.session.userId === "admin") {
      // Find the admin in this college to get their email
      const { data: admin } = await supabase
        .from("admin_credentials")
        .select("admin_email")
        .eq("college_id", req.collegeId!)
        .eq("role", "client_admin")
        .maybeSingle();

      return res.json({
        user: { id: req.session.userId, email: admin?.admin_email || "gcfm@admin.com" },
        roles: ["admin"],
        isAdmin: true,
      });
    }

    // Library Card session
    if (req.session.isLibraryCard) {
      const cardId = req.session.userId.replace(/^card-/, "");
      const card = await storage.getLibraryCardApplication(cardId, req.collegeId!);
      if (!card) {
        return res.status(401).json({ error: "Library card not found in this college" });
      }
      return res.json({
        user: {
          id: card.id,
          email: card.email,
          name: `${card.firstName} ${card.lastName}`,
          cardNumber: card.cardNumber,
        },
        isLibraryCard: true,
      });
    }

    // Regular user session
    const user = await storage.getUser(req.session.userId, req.collegeId);
    if (!user) {
      return res.status(401).json({ error: "User not found in this college" });
    }

    const profile = await storage.getProfile(user.id, req.collegeId);
    const roles = await storage.getUserRoles(user.id, req.collegeId);
    const isAdmin = await storage.hasRole(user.id, "admin", req.collegeId);

    res.json({
      user: { id: user.id, email: user.email },
      profile,
      roles: roles.map((r) => r.role),
      isAdmin,
    });
  });

  app.get("/api/:collegeSlug/profile", resolveCollege, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const profile = await storage.getProfile(req.session.userId, req.collegeId);
    res.json(profile || null);
  });

  app.put("/api/:collegeSlug/profile", resolveCollege, async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const profile = await storage.updateProfile(req.session.userId, req.body, req.collegeId!);
    res.json(profile);
  });

  // Admin-only routes - check admin status per college
  const requireAdmin = async (req: any, res: any, next: any) => {
    // Backend bypass for internal tools/scripts
    if (
      process.env.SUPABASE_BACKEND_SECRET &&
      req.header("x-backend-secret") === process.env.SUPABASE_BACKEND_SECRET
    ) {
      return next();
    }

    // DEBUG LOGGING
    console.log(`[AUTH_CHECK] Path: ${req.path}, SessionID: ${req.sessionID}`);
    console.log(`[AUTH_CHECK] userId: ${req.session.userId}, isAdmin: ${req.session.isAdmin}, isSuperAdmin: ${req.session.isSuperAdmin}`);
    console.log(`[AUTH_CHECK] collegeId: ${req.session.collegeId}, req.collegeId: ${req.collegeId}`);

    if (req.session.isSuperAdmin) {
      console.log(`[AUTH_CHECK] Super Admin detected, bypassing checks.`);
      return next();
    }

    if (!req.session.userId) {
      console.log(`[AUTH_CHECK] Access DENIED: No userId in session`);
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Safety: ensure session college matches request college
    if (req.session.collegeId && req.session.collegeId !== req.collegeId) {
      console.log(`[AUTH_CHECK] Access DENIED: College mismatch (${req.session.collegeId} vs ${req.collegeId})`);
      return res.status(403).json({ error: "Access denied: college mismatch" });
    }

    if (req.session.isAdmin) {
      return next();
    }

    const isAdmin = await storage.hasRole(req.session.userId, "admin", req.collegeId);
    if (!isAdmin) {
      console.log(`[AUTH_CHECK] Access DENIED: User ${req.session.userId} is not an admin for college ${req.collegeId}`);
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  };

  app.get("/api/:collegeSlug/admin/users", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getStudents(req.collegeId!);
      const nonStudents = await storage.getNonStudents(req.collegeId!);
      res.json({ students: users, nonStudents: nonStudents });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/:collegeSlug/admin/users/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      if (req.params.id === "1" || req.params.id === "admin") {
        return res
          .status(400)
          .json({ error: "Cannot delete primary admin" });
      }
      await storage.deleteUser(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/admin/library-cards", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const cards = await storage.getLibraryCardApplications(req.collegeId!);
      res.json(cards);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/admin/borrowed-books", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const borrows = await storage.getBookBorrows(req.collegeId!);
      res.json(borrows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/admin/stats", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getStudents(req.collegeId!);
      const nonStudents = await storage.getNonStudents(req.collegeId!);
      const libraryCards = await storage.getLibraryCardApplications(req.collegeId!);
      const borrowedBooks = await storage.getBookBorrows(req.collegeId!);
      const donations = await storage.getDonations(req.collegeId!);

      const activeBorrows = borrowedBooks.filter(
        (b) => b.status === "borrowed",
      ).length;
      const returnedBooks = borrowedBooks.filter(
        (b) => b.status === "returned",
      ).length;

      res.json({
        totalUsers: users.length + nonStudents.length,
        totalBooks: borrowedBooks.length,
        libraryCards: libraryCards.length,
        borrowedBooks: activeBorrows,
        returnedBooks: returnedBooks,
        donations: donations.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Keep other existing routes with storage
  app.get("/api/:collegeSlug/contact-messages", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const messages = await storage.getContactMessages(req.collegeId!);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collegeSlug/contact-messages", resolveCollege, async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const result = await storage.createContactMessage({
        name,
        email,
        subject,
        message,
      }, req.collegeId!);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch(
    "/api/:collegeSlug/contact-messages/:id/seen",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        const message = await storage.updateContactMessageSeen(
          req.params.id,
          req.body.isSeen,
          req.collegeId!
        );
        res.json(message);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/contact-messages/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      await storage.deleteContactMessage(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/book-borrows", resolveCollege, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (req.session.isAdmin) {
        const borrows = await storage.getBookBorrows(req.collegeId!);
        return res.json(borrows);
      }
      let userId = req.session.userId || "";
      if (userId.startsWith("card-")) {
        userId = userId.replace("card-", "");
      }
      const borrows = await storage.getBookBorrowsByUser(userId, req.collegeId!);
      res.json(borrows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collegeSlug/book-borrows", resolveCollege, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { bookId, bookTitle } = req.body;
      if (!bookId || !bookTitle) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const book = await storage.getBook(bookId, req.collegeId);
      if (!book) return res.status(404).json({ error: "Book not found" });
      if (parseInt(book.availableCopies || "0") <= 0) {
        return res
          .status(400)
          .json({ error: "No copies available for borrowing" });
      }

      let borrowerName = "";
      let borrowerPhone = "";
      let borrowerEmail = "";
      let libraryCardId = "";

      if (req.session.isLibraryCard) {
        const cardId = req.session.userId.replace(/^card-/, "");
        const card = await storage.getLibraryCardApplication(cardId, req.collegeId!);
        if (card) {
          borrowerName = `${card.firstName} ${card.lastName}`;
          borrowerPhone = card.phone;
          borrowerEmail = card.email;
          libraryCardId = card.cardNumber;
        }
      } else {
        const user = await storage.getUser(req.session.userId, req.collegeId);
        if (user) {
          const profile = await storage.getProfile(user.id, req.collegeId);
          borrowerName = profile?.fullName || (user.id === "admin" ? "Admin" : user.email);
          borrowerPhone = profile?.phone || "";
          borrowerEmail = user.email || (user.id === "admin" ? "admin@college.com" : "");
          libraryCardId = "-";
        } else if (req.session.userId === "admin") {
          borrowerName = "Admin";
          borrowerEmail = "gcfm@admin.com";
          libraryCardId = "-";
        }
      }

      const borrowDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      let userId = req.session.userId || "";
      if (userId.startsWith("card-")) {
        userId = userId.replace("card-", "");
      }

      const borrow = await storage.createBookBorrow({
        userId: userId,
        bookId,
        bookTitle,
        borrowerName,
        borrowerPhone,
        borrowerEmail,
        libraryCardId,
        borrowDate: borrowDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: "borrowed",
      }, req.collegeId!);

      // Update available copies
      await storage.updateBook(bookId, {
        availableCopies: Math.max(
          0,
          parseInt(book.availableCopies || "0") - 1,
        ).toString(),
        updatedAt: new Date().toISOString(),
      }, req.collegeId!);

      res.json(borrow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/:collegeSlug/admin/issue-book", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const { bookId, cardNumber } = req.body;
      if (!bookId || !cardNumber) {
        return res.status(400).json({ error: "Book ID and Library Card Number are required" });
      }

      // 1. Get student detail from card number
      const card = await storage.getLibraryCardByCardNumber(cardNumber, req.collegeId!);
      if (!card || card.status !== "approved") {
        return res.status(404).json({ error: "Approved library card not found with this number" });
      }

      // 2. Get book detail
      const book = await storage.getBook(bookId, req.collegeId);
      if (!book) return res.status(404).json({ error: "Book not found" });
      if (parseInt(book.availableCopies || "0") <= 0) {
        return res.status(400).json({ error: "No copies available for borrowing" });
      }

      // 3. Check if already borrowing this book
      const borrows = await storage.getBookBorrowsByUser(card.id, req.collegeId!);
      const isAlreadyBorrowing = borrows.some((b: any) => b.bookId === bookId && b.status === "borrowed");
      if (isAlreadyBorrowing) {
        return res.status(400).json({ error: "This student is already borrowing this book" });
      }

      const borrowDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // 4. Create borrow record
      const borrow = await storage.createBookBorrow({
        userId: card.id,
        bookId,
        bookTitle: book.bookName,
        borrowerName: `${card.firstName} ${card.lastName}`,
        borrowerPhone: card.phone,
        borrowerEmail: card.email,
        libraryCardId: card.cardNumber,
        borrowDate: borrowDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: "borrowed",
      }, req.collegeId!);

      // 5. Update available copies
      await storage.updateBook(bookId, {
        availableCopies: Math.max(0, parseInt(book.availableCopies || "0") - 1).toString(),
        updatedAt: new Date().toISOString(),
      }, req.collegeId!);

      res.json(borrow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/:collegeSlug/book-borrows/:id/return", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const borrows = await storage.getBookBorrows(req.collegeId!);
      const borrow = borrows.find((b: any) => b.id === req.params.id);
      if (!borrow)
        return res.status(404).json({ error: "Borrow record not found" });
      if (borrow.status === "returned")
        return res.status(400).json({ error: "Book already returned" });

      const updatedBorrow = await storage.updateBookBorrowStatus(
        req.params.id,
        "returned",
        req.collegeId!,
        new Date()
      );

      // Update available copies
      const book = await storage.getBook(borrow.bookId, req.collegeId);
      if (book) {
        const currentAvailable = parseInt(book.availableCopies || "0");
        const total = parseInt(book.totalCopies || "0");
        await storage.updateBook(borrow.bookId, {
          availableCopies: Math.min(total, currentAvailable + 1).toString(),
          updatedAt: new Date().toISOString(),
        }, req.collegeId!);
      }

      res.json(updatedBorrow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/:collegeSlug/book-borrows/:id/status", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const { status, returnDate } = req.body;
      const borrow = await storage.updateBookBorrowStatus(
        req.params.id,
        status,
        req.collegeId!,
        returnDate ? new Date(returnDate) : undefined
      );
      res.json(borrow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/:collegeSlug/book-borrows/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      await storage.deleteBookBorrow(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin alias for deleting borrowed books
  app.delete(
    "/api/:collegeSlug/admin/borrowed-books/:id",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        await storage.deleteBookBorrow(req.params.id, req.collegeId!);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get("/api/:collegeSlug/library-card-applications", resolveCollege, async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      if (req.session.isAdmin) {
        const applications = await storage.getLibraryCardApplications(req.collegeId!);
        return res.json(applications);
      }
      const applications = await storage.getLibraryCardApplicationsByUser(
        req.session.userId,
        req.collegeId!
      );
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collegeSlug/library-card-applications", resolveCollege, async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        fatherName,
        dob,
        email,
        phone,
        field,
        rollNo,
        studentClass,
        class: studentClassAlt,
        addressStreet,
        addressCity,
        addressState,
        addressZip,
        password: applicationPassword,
      } = req.body;

      const application = await storage.createLibraryCardApplication({
        userId: req.session?.userId || null,
        firstName,
        lastName,
        fatherName,
        dob,
        email,
        phone,
        field,
        rollNo,
        class: studentClass || studentClassAlt,
        addressStreet,
        addressCity,
        addressState,
        addressZip,
        password: applicationPassword
          ? await bcrypt.hash(applicationPassword, 10)
          : null,
        status: "pending",
      }, req.collegeId!);
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch(
    "/api/:collegeSlug/admin/library-card-applications/:id/status",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        const { status } = req.body;

        if (!["pending", "approved", "rejected"].includes(status)) {
          return res.status(400).json({ error: "Invalid status" });
        }

        const application = await storage.getLibraryCardApplication(req.params.id, req.collegeId!);
        if (!application) {
          return res.status(404).json({ error: "Application not found" });
        }

        const updatedApplication = await storage.updateLibraryCardApplicationStatus(
          req.params.id,
          status,
          req.collegeId!
        );

        res.json(updatedApplication);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/:collegeSlug/admin/library-card-applications/:id",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        await storage.deleteLibraryCardApplication(req.params.id, req.collegeId!);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get("/api/:collegeSlug/donations", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const donations = await storage.getDonations(req.collegeId!);
      res.json(donations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collegeSlug/donations", resolveCollege, async (req, res) => {
    try {
      const { amount, method, name, email, message } = req.body;
      if (!amount || !method) {
        return res
          .status(400)
          .json({ error: "Amount and method are required" });
      }
      const donation = await storage.createDonation({
        amount: amount.toString(),
        method,
        name: name || null,
        email: email || null,
        message: message || null,
        status: "received",
      }, req.collegeId!);
      res.json(donation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/:collegeSlug/donations/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      await storage.deleteDonation(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/notes", resolveCollege, async (req, res) => {
    try {
      const notes = await storage.getActiveNotes(req.collegeId!);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/notes/filter", resolveCollege, async (req, res) => {
    try {
      const { class: studentClass, subject } = req.query;
      if (!studentClass || !subject) {
        return res.status(400).json({ error: "Class and subject required" });
      }
      const notes = await storage.getNotesByClassAndSubject(
        studentClass as string,
        subject as string,
        req.collegeId!
      );
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/admin/notes", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const notes = await storage.getNotes(req.collegeId!);
      res.json(notes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/notes",
    resolveCollege,
    requireAdmin,
    upload.single("file"),
    async (req: MulterRequest, res) => {
      try {
        const {
          class: studentClass,
          subject,
          title,
          description,
          status,
        } = req.body;
        if (!studentClass || !subject || !title || !description || !req.file) {
          return res
            .status(400)
            .json({ error: "Missing required fields or file" });
        }

        const pdfPath = await storage.uploadFile("notes", req.file);

        const note = await storage.createNote({
          class: studentClass,
          subject,
          title,
          description,
          pdfPath,
          status: status || "active",
        }, req.collegeId!);
        res.json(note);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.patch("/api/:collegeSlug/admin/notes/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const note = await storage.updateNote(req.params.id, req.body, req.collegeId!);
      res.json(note);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/:collegeSlug/admin/notes/:id/toggle", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const note = await storage.toggleNoteStatus(req.params.id, req.collegeId!);
      res.json(note);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/:collegeSlug/admin/notes/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const notes = await storage.getNotes(req.collegeId!);
      const note = notes.find((n: any) => n.id === req.params.id);

      if (note && note.pdfPath) {
        deleteFile(note.pdfPath);
      }

      await storage.deleteNote(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/admin/rare-books", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const books = await storage.getRareBooks(req.collegeId!);
      res.json(books);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/rare-books",
    resolveCollege,
    requireAdmin,
    upload.fields([
      { name: "file", maxCount: 1 },
      { name: "coverImage", maxCount: 1 },
    ]),
    async (req: MulterRequest, res) => {
      try {
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const { title, description, category, status } = req.body;

        if (
          !title ||
          !description ||
          !files.file?.[0] ||
          !files.coverImage?.[0]
        ) {
          return res
            .status(400)
            .json({
              error:
                "Missing required fields (PDF and Cover Image are mandatory)",
            });
        }

        const pdfPath = await storage.uploadFile("rare_books", files.file[0]);
        const coverImagePath = await storage.uploadFile(
          "rare_books",
          files.coverImage[0],
        );

        const book = await storage.createRareBook({
          title,
          description,
          category: category || "General",
          pdfPath,
          coverImage: coverImagePath,
          status: status || "active",
        }, req.collegeId!);
        res.json(book);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/admin/rare-books/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const book = await storage.getRareBook(req.params.id, req.collegeId!);
      if (book) {
        if (book.pdfPath) deleteFile(book.pdfPath);
        if (book.coverImage) deleteFile(book.coverImage);
      }
      await storage.deleteRareBook(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // HOME MODULE ROUTES
  // Public Route
  app.get("/api/:collegeSlug/home", resolveCollege, async (req, res) => {
    try {
      const content = await storage.getHomeContent(req.collegeId!);
      const slider = await storage.getHomeSliderImages(req.collegeId!);
      const stats = await storage.getHomeStats(req.collegeId!);
      const affiliations = await storage.getHomeAffiliations(req.collegeId!);
      const buttons = await storage.getHomeButtons(req.collegeId!);

      const activeSlider = (slider || []).filter((s: any) => s.isActive);
      const activeAffiliations = (affiliations || []).filter(
        (a: any) => a.isActive,
      );

      res.json({
        content,
        slider: activeSlider,
        stats,
        affiliations: activeAffiliations,
        buttons,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Routes - Home Content
  app.get("/api/:collegeSlug/admin/home/content", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const content = await storage.getHomeContent(req.collegeId!);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collegeSlug/admin/home/content", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const content = await storage.updateHomeContent(req.body, req.collegeId!);
      res.json(content);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Routes - Home Slider
  app.get("/api/:collegeSlug/admin/home/slider", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const images = await storage.getHomeSliderImages(req.collegeId!);
      res.json(images);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/home/slider",
    resolveCollege,
    requireAdmin,
    upload.single("file"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const imageUrl = await storage.uploadFile("home_slider", req.file);

        const image = await storage.addHomeSliderImage({
          imageUrl,
          order: 0,
          isActive: true,
        }, req.collegeId!);
        res.json(image);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/admin/home/slider/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const images = await storage.getHomeSliderImages(req.collegeId!);
      const image = images.find((i: any) => i.id === req.params.id);
      if (image && image.imageUrl) {
        deleteFile(image.imageUrl);
      }
      await storage.deleteHomeSliderImage(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/home/slider/:id/image",
    resolveCollege,
    requireAdmin,
    upload.single("file"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file)
          return res.status(400).json({ error: "No file provided" });
        const images = await storage.getHomeSliderImages(req.collegeId!);
        const image = images.find((i: any) => i.id === req.params.id);
        if (image && image.imageUrl) {
          deleteFile(image.imageUrl);
        }
        const imageUrl = await storage.uploadFile("home_slider", req.file);
        
        const result = await storage.updateHomeSlider({
          id: req.params.id,
          imageUrl,
        }, req.collegeId!);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch("/api/:collegeSlug/admin/home/slider/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const { order, isActive } = req.body;
      if (order !== undefined) {
        await storage.updateHomeSliderOrder(req.params.id, order, req.collegeId!);
      }
      if (isActive !== undefined) {
        await storage.updateHomeSliderStatus(req.params.id, isActive, req.collegeId!);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Routes - Home Stats
  app.get("/api/:collegeSlug/admin/home/stats", resolveCollege, requireAdmin, async (req, res) => {
    try {
      let stats = await storage.getHomeStats(req.collegeId!);

      // Auto-seed if empty
      if (stats.length === 0) {
        console.log("[DEBUG] No stats found. Auto-seeding defaults...");
        const defaultStats = [
          {
            label: "Books Available",
            number: "5000+",
            icon: "BookOpen",
            color: "text-pakistan-green",
            order: 1,
          },
          {
            label: "Active Students",
            number: "1000+",
            icon: "Users",
            color: "text-pakistan-green-light",
            order: 2,
          },
          {
            label: "Study Materials",
            number: "500+",
            icon: "Award",
            color: "text-accent",
            order: 3,
          },
          {
            label: "Satisfaction Rate",
            number: "95%",
            icon: "TrendingUp",
            color: "text-pakistan-emerald",
            order: 4,
          },
        ];

        for (const stat of defaultStats) {
          await storage.addHomeStat(stat, req.collegeId!);
        }
        // Re-fetch
        stats = await storage.getHomeStats(req.collegeId!);
      }

      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/:collegeSlug/admin/home/stats/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const { label, number, icon, color, order, iconUrl } = req.body;
      const updates: any = {};
      if (label !== undefined) updates.label = label;
      if (number !== undefined) updates.number = number;
      if (icon !== undefined) updates.icon = icon;
      if (iconUrl !== undefined) updates.iconUrl = iconUrl;
      if (color !== undefined) updates.color = color;
      if (order !== undefined) updates.order = order;

      const stat = await storage.updateHomeStat(req.params.id, updates, req.collegeId!);
      res.json(stat);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/:collegeSlug/admin/home/stats/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getHomeStats(req.collegeId!);
      const item = stats.find((i: any) => i.id === req.params.id);
      if (item && item.iconUrl) {
        deleteFile(item.iconUrl);
      }
      await storage.deleteHomeStat(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/home/stats",
    resolveCollege,
    requireAdmin,
    upload.single("file"),
    async (req, res) => {
      try {
        const existingStats = await storage.getHomeStats(req.collegeId!);
        if (existingStats.length >= 8) {
          return res.status(400).json({ error: "Limit of 8 stats reached" });
        }

        let iconUrl = undefined;
        if (req.file) {
          iconUrl = await storage.uploadFile("home_stats_icons", req.file);
        }

        const statData = { ...req.body, iconUrl };
        const stat = await storage.addHomeStat(statData, req.collegeId!);
        res.json(stat);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.post("/api/:collegeSlug/admin/home/stats/seed", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const existing = await storage.getHomeStats(req.collegeId!);
      const defaultStats = [
        { label: "Books Available", number: "5000+", icon: "BookOpen", color: "text-pakistan-green", order: 1 },
        { label: "Active Students", number: "1000+", icon: "Users", color: "text-pakistan-green-light", order: 2 },
        { label: "Study Materials", number: "500+", icon: "Award", color: "text-accent", order: 3 },
        { label: "Satisfaction Rate", number: "95%", icon: "TrendingUp", color: "text-pakistan-emerald", order: 4 },
      ];

      const results = [];
      for (const stat of defaultStats) {
        const found = existing.find((s) => s.label === stat.label);
        if (found) {
          const updated = await storage.updateHomeStat(found.id, stat, req.collegeId!);
          results.push(updated);
        } else {
          const saved = await storage.addHomeStat(stat, req.collegeId!);
          results.push(saved);
        }
      }
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/home/stats/:id/icon",
    resolveCollege,
    requireAdmin,
    upload.single("file"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }
        const iconUrl = await storage.uploadFile("home_stats_icons", req.file);
        const stat = await storage.updateHomeStat(req.params.id, { iconUrl }, req.collegeId!);
        res.json(stat);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get("/api/:collegeSlug/admin/home/affiliations", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const affiliations = await storage.getHomeAffiliations(req.collegeId!);
      res.json(affiliations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/home/affiliations",
    resolveCollege,
    requireAdmin,
    upload.single("file"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No logo uploaded" });
        }
        const { name, link } = req.body;
        const logoUrl = await storage.uploadFile("home_affiliations", req.file);

        const affiliation = await storage.addHomeAffiliation({
          name: name || "Affiliation Partner",
          logoUrl,
          link: link || "#",
          order: 0,
          isActive: true,
        }, req.collegeId!);
        res.json(affiliation);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/:collegeSlug/admin/home/affiliations/:id",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        const affiliations = await storage.getHomeAffiliations(req.collegeId!);
        const item = affiliations.find((i: any) => i.id === req.params.id);
        if (item && item.logoUrl) {
          deleteFile(item.logoUrl);
        }
        await storage.deleteHomeAffiliation(req.params.id, req.collegeId!);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/:collegeSlug/admin/home/affiliations/:id",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        const { name, link, order, isActive } = req.body;
        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (link !== undefined) updates.link = link;
        if (order !== undefined) updates.order = order;
        if (isActive !== undefined) updates.isActive = isActive;

        const affiliation = await storage.updateHomeAffiliation({
          id: req.params.id,
          ...updates,
        }, req.collegeId!);
        res.json(affiliation);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get("/api/:collegeSlug/rare-books/stream/:id", resolveCollege, async (req, res) => {
    try {
      const book = await storage.getRareBook(req.params.id, req.collegeId!);
      if (!book || book.status !== "active") {
        return res.status(404).json({ error: "Book not found" });
      }

      if (book.pdfPath && book.pdfPath.startsWith("http")) {
        return res.redirect(book.pdfPath);
      }

      res.status(404).json({ error: "PDF file not found" });
    } catch (error: any) {
      res.status(500).json({ error: "Error streaming PDF" });
    }
  });

  app.patch(
    "/api/:collegeSlug/admin/rare-books/:id/toggle",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        const book = await storage.toggleRareBookStatus(req.params.id, req.collegeId!);
        res.json(book);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.get("/api/:collegeSlug/rare-books", resolveCollege, async (req, res) => {
    try {
      const books = await storage.getRareBooks(req.collegeId!);
      res.json(books.filter((b: any) => b.status === "active"));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Books Details Management
  app.get("/api/:collegeSlug/admin/books", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const books = await storage.getBooks(req.collegeId!);
      res.json(books);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/books",
    resolveCollege,
    requireAdmin,
    upload.single("bookImage"),
    async (req: MulterRequest, res) => {
      try {
        const { bookName, shortIntro, description, totalCopies } = req.body;
        if (!bookName || !shortIntro || !description) {
          return res.status(400).json({ error: "Missing fields" });
        }

        const bookImage = req.file ? await storage.uploadFile("books", req.file) : null;
        const copies = totalCopies ? parseInt(totalCopies) : 1;

        const book = await storage.createBook({
          bookName,
          authorName: req.body.authorName || "",
          shortIntro,
          description,
          bookImage,
          totalCopies: copies,
          availableCopies: copies,
          updatedAt: new Date().toISOString(),
        }, req.collegeId!);
        res.json(book);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/:collegeSlug/admin/books/:id",
    resolveCollege,
    requireAdmin,
    upload.single("bookImage"),
    async (req: MulterRequest, res) => {
      try {
        const { bookName, shortIntro, description, totalCopies } = req.body;
        const existing = await storage.getBook(req.params.id, req.collegeId!);
        if (!existing) return res.status(404).json({ error: "Book not found" });

        const updateData: any = { updatedAt: new Date().toISOString() };
        if (bookName) updateData.bookName = bookName;
        if (req.body.authorName !== undefined) updateData.authorName = req.body.authorName;
        if (shortIntro) updateData.shortIntro = shortIntro;
        if (description) updateData.description = description;

        if (totalCopies !== undefined) {
          const newTotal = parseInt(totalCopies);
          const currentTotal = parseInt(existing.totalCopies || "0");
          const diff = newTotal - currentTotal;
          updateData.totalCopies = newTotal;
          updateData.availableCopies = parseInt(existing.availableCopies || "0") + diff;
        }

        if (req.file) {
          updateData.bookImage = await storage.uploadFile("books", req.file);
        }

        const book = await storage.updateBook(req.params.id, updateData, req.collegeId!);
        res.json(book);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/admin/books/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id, req.collegeId!);
      if (book && book.bookImage) {
        deleteFile(book.bookImage);
      }
      await storage.deleteBook(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/books", resolveCollege, async (req, res) => {
    try {
      const books = await storage.getBooks(req.collegeId!);
      res.json(books);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/books/:id", resolveCollege, async (req, res) => {
    try {
      const book = await storage.getBook(req.params.id, req.collegeId!);
      if (!book) return res.status(404).json({ error: "Book not found" });
      res.json(book);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Events Management
  app.get("/api/:collegeSlug/events", resolveCollege, async (req, res) => {
    try {
      const events = await storage.getEvents(req.collegeId!);
      res.json(
        events.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/events",
    resolveCollege,
    requireAdmin,
    (req, res, next) => {
      upload.array("eventImages")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res
            .status(400)
            .json({ error: `Upload error: ${err.message}` });
        } else if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    },
    async (req: MulterRequest, res) => {
      try {
        const { title, description, date } = req.body;
        if (!title || !description) {
          return res
            .status(400)
            .json({ error: "Title and description are required" });
        }

        const imageFiles = req.files as Express.Multer.File[];
        const images = imageFiles
          ? await Promise.all(
            imageFiles.map((file) => storage.uploadFile("events", file)),
          )
          : [];

        const event = await storage.createEvent({
          title,
          description,
          images,
          date: date || null,
        }, req.collegeId!);
        res.json(event);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/:collegeSlug/admin/events/:id",
    resolveCollege,
    requireAdmin,
    (req, res, next) => {
      upload.array("eventImages")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res
            .status(400)
            .json({ error: `Upload error: ${err.message}` });
        } else if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    },
    async (req: MulterRequest, res) => {
      try {
        const updateData: any = { ...req.body };
        const imageFiles = req.files as Express.Multer.File[];

        if (imageFiles && imageFiles.length > 0) {
          updateData.images = await Promise.all(
            imageFiles.map((file) => storage.uploadFile("events", file)),
          );
        }

        const event = await storage.updateEvent(req.params.id, updateData, req.collegeId!);
        if (!event) {
          return res.status(404).json({ error: "Event not found" });
        }
        res.json(event);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/admin/events/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const events = await storage.getEvents(req.collegeId!);
      const event = events.find((e: any) => e.id === req.params.id);

      if (event && event.images && Array.isArray(event.images)) {
        event.images.forEach((imagePath: string) => {
          deleteFile(imagePath);
        });
      }

      await storage.deleteEvent(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Notifications Routes
  app.get("/api/:collegeSlug/notifications", resolveCollege, async (req, res) => {
    try {
      const notifications = await storage.getActiveNotifications(req.collegeId!);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/admin/notifications", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.collegeId!);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/notifications",
    resolveCollege,
    requireAdmin,
    (req, res, next) => {
      upload.single("image")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res
            .status(400)
            .json({ error: `Upload error: ${err.message}` });
        } else if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    },
    async (req: MulterRequest, res) => {
      try {
        const { title, message } = req.body;
        if (!title) {
          return res.status(400).json({ error: "Title is required" });
        }

        let image = null;
        if (req.file) {
          image = await storage.uploadFile("notification", req.file);
        }

        const notification = await storage.createNotification({
          title,
          message,
          image,
          pin: req.body.pin === "true",
          status: "active",
        }, req.collegeId!);
        res.json(notification);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/admin/notifications/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.collegeId!);
      const notification = notifications.find(
        (n: any) => n.id === req.params.id,
      );

      if (notification && notification.image) {
        deleteFile(notification.image);
      }

      await storage.deleteNotification(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/:collegeSlug/admin/notifications/:id/status", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const notification = await storage.toggleNotificationStatus(req.params.id, req.collegeId!);
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/:collegeSlug/admin/notifications/:id/pin", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const notification = await storage.toggleNotificationPin(req.params.id, req.collegeId!);
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Blog Routes
  app.get("/api/:collegeSlug/blog", resolveCollege, async (req, res) => {
    try {
      const posts = await storage.getBlogPosts((req as any).collegeId!, false);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/blog/:slugOrId", resolveCollege, async (req, res) => {
    try {
      const { slugOrId } = req.params;
      let post = await storage.getBlogPost(slugOrId, req.collegeId!);
      if (!post) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
        if (isUuid) {
          post = await storage.getBlogPostById(slugOrId, req.collegeId!);
        }
      }
      if (!post || post.status !== "published") {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/admin/blog", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const posts = await storage.getBlogPosts((req as any).collegeId!, true);
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/blog",
    resolveCollege,
    requireAdmin,
    upload.single("featuredImage"),
    async (req: MulterRequest, res) => {
      try {
        const { title, content, shortDescription, slug, status } = req.body;
        if (!title || !content || !slug) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        let featuredImage = null;
        if (req.file) {
          featuredImage = await storage.uploadFile("blog", req.file);
        }

        const post = await storage.createBlogPost({
          title,
          slug,
          shortDescription: shortDescription || "",
          content,
          featuredImage, // string or null
          status: status || "draft",
        }, req.collegeId!);
        res.json(post);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.patch(
    "/api/:collegeSlug/admin/blog/:id",
    resolveCollege,
    requireAdmin,
    upload.single("featuredImage"),
    async (req: MulterRequest, res) => {
      try {
        const { title, content, shortDescription, slug, status } = req.body;
        const updateData: any = {};
        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (shortDescription !== undefined)
          updateData.shortDescription = shortDescription;
        if (slug) updateData.slug = slug;
        if (status) updateData.status = status;

        if (req.file) {
          const url = await storage.uploadFile("blog", req.file);
          updateData.featuredImage = url;

          // Delete old image? Ideally yes, but need to fetch old post first.
          // skipping for simplicity unless strictly required.
        }

        const post = await storage.updateBlogPost(req.params.id, updateData, req.collegeId!);
        res.json(post);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/admin/blog/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const post = await storage.getBlogPostById(req.params.id, req.collegeId!);
      if (post && post.featuredImage) {
        deleteFile(post.featuredImage);
      }
      await storage.deleteBlogPost(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collegeSlug/admin/blog/:id/pin", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const post = await storage.toggleBlogPostPin(req.params.id, req.collegeId!);
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Editor Image Upload
  app.post(
    "/api/:collegeSlug/admin/blog/upload-image",
    resolveCollege,
    requireAdmin,
    upload.single("image"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file) return res.status(400).json({ error: "No image provided" });
        const url = await storage.uploadFile("blog", req.file);
        res.json({ url });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Principal Routes
  app.get("/api/:collegeSlug/principal", resolveCollege, async (req, res) => {
    try {
      const data = await storage.getPrincipal(req.collegeId!);
      res.json(data || {});
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/principal",
    resolveCollege,
    requireAdmin,
    upload.single("image"),
    async (req: MulterRequest, res) => {
      try {
        const { name, message } = req.body;
        const data: any = { name, message };

        if (req.file) {
          data.imageUrl = await storage.uploadFile(
            "principal_images",
            req.file,
          );
        }

        const result = await storage.updatePrincipal(data, req.collegeId!);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Faculty Routes
  app.get("/api/:collegeSlug/faculty", resolveCollege, async (req, res) => {
    try {
      const data = await storage.getFaculty(req.collegeId!);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/faculty",
    resolveCollege,
    requireAdmin,
    upload.single("image"),
    async (req: MulterRequest, res) => {
      try {
        const { name, designation, description } = req.body;
        if (!name || !designation) {
          return res
            .status(400)
            .json({ error: "Name and Designation are required" });
        }

        const data: any = { name, designation, description };
        if (req.file) {
          data.imageUrl = await storage.uploadFile("faculty_images", req.file);
        }

        const result = await storage.createFacultyMember(data, req.collegeId!);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.put(
    "/api/:collegeSlug/admin/faculty/:id",
    resolveCollege,
    requireAdmin,
    upload.single("image"),
    async (req: MulterRequest, res) => {
      try {
        const { name, designation, description } = req.body;
        const data: any = { name, designation, description };

        if (req.file) {
          data.imageUrl = await storage.uploadFile("faculty_images", req.file);
        }

        const result = await storage.updateFacultyMember(req.params.id, data, req.collegeId!);
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/admin/faculty/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      await storage.deleteFacultyMember(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- History CMS Routes ---

  app.get("/api/:collegeSlug/history/page", resolveCollege, async (req, res) => {
    try {
      const page = await storage.getHistoryPage(req.collegeId!);
      res.json(page);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collegeSlug/admin/history/page", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const { title, subtitle } = req.body;
      const page = await storage.updateHistoryPage(title, subtitle, req.collegeId!);
      res.json(page);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/history/sections", resolveCollege, async (req, res) => {
    try {
      const sections = await storage.getHistorySections(req.collegeId!);
      res.json(sections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/history/sections",
    resolveCollege,
    requireAdmin,
    upload.single("image"),
    async (req: MulterRequest, res) => {
      try {
        const sectionData = { ...req.body };
        if (req.file) {
          sectionData.imageUrl = await storage.uploadFile("history_images", req.file);
        }
        const section = await storage.upsertHistorySection(sectionData, req.collegeId!);
        res.json(section);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/admin/history/sections/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      await storage.deleteHistorySection(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collegeSlug/history/gallery", resolveCollege, async (req, res) => {
    try {
      const gallery = await storage.getHistoryGallery(req.collegeId!);
      res.json(gallery);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/history/gallery",
    resolveCollege,
    requireAdmin,
    upload.single("image"),
    async (req: MulterRequest, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "Image file is required" });
        }
        const imageUrl = await storage.uploadFile("history_images", req.file);
        const { caption, displayOrder } = req.body;
        const result = await storage.addHistoryGalleryImage(
          imageUrl,
          req.collegeId!,
          caption,
          displayOrder ? parseInt(displayOrder) : 0
        );
        res.json(result);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete("/api/:collegeSlug/admin/history/gallery/:id", resolveCollege, requireAdmin, async (req, res) => {
    try {
      await storage.deleteHistoryGalleryImage(req.params.id, req.collegeId!);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post(
    "/api/:collegeSlug/admin/history/gallery/reorder",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        const { items } = req.body;
        await storage.updateHistoryGalleryOrder(items, req.collegeId!);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Site Settings Routes
  app.get("/api/:collegeSlug/settings", resolveCollege, async (req, res) => {
    try {
      const settings = await storage.getSiteSettings(req.collegeId!);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch(
    "/api/:collegeSlug/admin/settings",
    resolveCollege,
    requireAdmin,
    upload.fields([
      { name: "navbarLogo", maxCount: 1 },
      { name: "heroBackgroundLogo", maxCount: 1 },
      { name: "loadingLogo", maxCount: 1 },
      { name: "cardLogo", maxCount: 1 },
    ]),
    async (req: MulterRequest, res) => {
      try {
        console.log("[Settings Update] Request body:", req.body);
        console.log("[Settings Update] Files:", req.files);

        const updates: any = { ...req.body };
        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };

        // Handle logo uploads
        if (files?.navbarLogo) {
          updates.navbarLogo = await storage.uploadFile(
            "branding",
            files.navbarLogo[0],
          );
        }
        if (files?.heroBackgroundLogo) {
          updates.heroBackgroundLogo = await storage.uploadFile(
            "branding",
            files.heroBackgroundLogo[0],
          );
        }
        if (files?.loadingLogo) {
          updates.loadingLogo = await storage.uploadFile(
            "branding",
            files.loadingLogo[0],
          );
        }
        if (files?.cardLogo) {
          updates.cardLogoUrl = await storage.uploadFile(
            "branding",
            files.cardLogo[0],
          );
        }

        const result = await storage.updateSiteSettings(updates, req.collegeId!);
        console.log("[Settings Update] Success:", result);
        res.json(result);
      } catch (error: any) {
        console.error("[Settings Update] Error:", error);
        res.status(500).json({ error: error.message });
      }
    },
  );

  // Library Card Fields Routes (Dynamic Field Builder)
  app.get("/api/:collegeSlug/library-card-fields", resolveCollege, async (req, res) => {
    try {
      const fields = await storage.getLibraryCardFields(req.collegeId!);
      res.json(fields);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get(
    "/api/:collegeSlug/admin/library-card-fields/:id",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        const field = await storage.getLibraryCardFieldById(req.params.id, req.collegeId!);
        res.json(field);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.post("/api/:collegeSlug/admin/library-card-fields", resolveCollege, requireAdmin, async (req, res) => {
    try {
      const field = await storage.createLibraryCardField(req.body, req.collegeId!);
      res.json(field);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch(
    "/api/:collegeSlug/admin/library-card-fields/:id",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        const field = await storage.updateLibraryCardField(req.params.id, req.body, req.collegeId!);
        res.json(field);
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  app.delete(
    "/api/:collegeSlug/admin/library-card-fields/:id",
    resolveCollege,
    requireAdmin,
    async (req, res) => {
      try {
        await storage.deleteLibraryCardField(req.params.id, req.collegeId!);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ error: error.message });
      }
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: College branding endpoint (used by CollegeContext on frontend)
  // ──────────────────────────────────────────────────────────────────────────
  app.get("/api/colleges/:slug", async (req, res) => {
    try {
      const college = await storage.getCollegeBySlug(req.params.slug);
      if (!college || !college.isActive) {
        return res.status(404).json({ error: "College not found" });
      }
      res.json(college);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // COLLEGE-SCOPED ADMIN LOGIN: POST /api/:collegeSlug/admin/login
  // No secret key required — email + password only
  // ──────────────────────────────────────────────────────────────────────────
  app.post("/api/:collegeSlug/admin/login", resolveCollege, async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const college = req.college!;
      const adminCreds = await storage.getAdminByEmailAndCollege(email, college.id);
      if (!adminCreds) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isPasswordValid = await bcrypt.compare(password, adminCreds.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      req.session.userId = "admin";
      req.session.isAdmin = true;
      req.session.collegeId = college.id;
      req.session.collegeSlug = college.slug;
      return res.json({
        user: { id: adminCreds.id, email: adminCreds.adminEmail },
        isAdmin: true,
        college: { id: college.id, slug: college.slug, name: college.name },
        redirect: `/${college.slug}/admin-dashboard`,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // End of routes
}
