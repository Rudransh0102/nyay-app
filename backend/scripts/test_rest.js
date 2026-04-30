const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testRest() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('Testing REST API for:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase.from('legal_acts').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ REST API is working! Table legal_acts exists.');
  } catch (err) {
    console.error('❌ REST API failed:', err.message);
  }
}
testRest();
