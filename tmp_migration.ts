
import { supabase } from './server/db-storage.ts';

async function run() {
  console.log('Starting migration...');
  const sql = `
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS easypaisa_number TEXT DEFAULT '0300-0000000';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bank_account_number TEXT DEFAULT '';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT 'Habib Bank Limited (HBL)';
    ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bank_branch TEXT DEFAULT '';
  `;

  try {
    const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
    if (error) {
      console.error('Database error:', error);
      process.exit(1);
    } else {
      console.log('Migration successful');
      process.exit(0);
    }
  } catch (e) {
    console.error('Script execution error:', e);
    process.exit(1);
  }
}

run();
