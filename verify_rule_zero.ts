
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_BACKEND_SECRET = process.env.SUPABASE_BACKEND_SECRET || "admin-backend-secret-8829";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      "x-backend-secret": SUPABASE_BACKEND_SECRET,
    },
  },
});

async function verifyRuleZero() {
  console.log("--- Rule Zero Verification ---");
  const { data, error } = await supabase
    .from('admin_credentials')
    .select('admin_email, role, created_at, updated_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error fetching credentials:", error.message);
    process.exit(1);
  }

  console.log(`Found ${data.length} rows.`);
  data.forEach((row, i) => {
    console.log(`${i+1}. ${row.admin_email} | Role: ${row.role} | Created: ${row.created_at}`);
  });

  const expectedEmails = ['superadmin@cms.com', 'gcfm@admin.com', 'dj@admin.com'];
  const actualEmails = data.map(r => r.admin_email);

  const missing = expectedEmails.filter(e => !actualEmails.includes(e));
  const extra = actualEmails.filter(e => !expectedEmails.includes(e));

  if (missing.length > 0) console.error("MISSING:", missing);
  if (extra.length > 0) console.error("EXTRA:", extra);

  if (data.length === 3 && missing.length === 0) {
    console.log("✅ RULE ZERO PASSED");
  } else {
    console.error("❌ RULE ZERO FAILED");
    process.exit(1);
  }
}

verifyRuleZero();
