import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://okxbrjdtqukxsumksexf.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9reGJyamR0cXVreHN1bWtzZXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MzM2NjgsImV4cCI6MjA4NDMwOTY2OH0.BAsO4fyJ7lcjeociL_rELTqK2NC6zFdIfvOYTE33GF0'
);

async function test() {
  const { data, error } = await supabase
    .from('library_card_applications')
    .select('*');

  console.log('Error:', error);
  console.log('Data count:', data?.length);
  console.dir(data, { depth: null });
}

test();
