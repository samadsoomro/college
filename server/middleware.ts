import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import type { Request, Response, NextFunction } from "express";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_KEY!;
const SUPABASE_BACKEND_SECRET = process.env.SUPABASE_BACKEND_SECRET || "admin-backend-secret-8829";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: { headers: { "x-backend-secret": SUPABASE_BACKEND_SECRET } },
});

// Augment Express Request to carry college info
declare global {
  namespace Express {
    interface Request {
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

/**
 * Middleware: resolveCollege
 * Reads :collegeSlug from the URL params, looks up the college in the DB,
 * and attaches it to req.college. Returns 404 if slug is unknown or inactive.
 */
export async function resolveCollege(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const slug = req.params.collegeSlug;
  if (!slug) {
    return res.status(400).json({ error: "College slug is required" });
  }

  const { data, error } = await supabase
    .from("colleges")
    .select("id, name, short_name, slug, storage_bucket, is_active")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (error || !data) {
    return res.status(404).json({ error: `College '${slug}' not found` });
  }

  if (!data.is_active) {
    return res.status(403).json({ error: `College '${slug}' is inactive` });
  }

  req.collegeId = data.id;
  req.college = {
    id: data.id,
    slug: data.slug,
    name: data.name,
    shortName: data.short_name,
    storageBucket: data.storage_bucket,
    isActive: data.is_active,
  };

  next();
}
