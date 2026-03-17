import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_BACKEND_SECRET = process.env.SUPABASE_BACKEND_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      "x-backend-secret": SUPABASE_BACKEND_SECRET,
    },
  },
});

async function run() {
  try {
    // We will just do a select to see if the columns exist
    const { data, error } = await supabase
      .from('site_settings')
      .select('easypaisa_number, bank_account_number, bank_name, bank_branch')
      .limit(1);

    if (error) {
       console.error("Columns might not exist:", error.message);
    } else {
       console.log("Columns exist!");
    }
  } catch(e) {
    console.error(e);
  }
}
run();
