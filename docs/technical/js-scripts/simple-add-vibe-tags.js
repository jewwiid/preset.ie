const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public',
  }
});

async function checkAndAddVibeTagsColumn() {
  try {
    console.log('Checking if vibe_tags column exists...');
    
    // First check if column exists
    const { data: columnCheck, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'users_profile')
      .eq('column_name', 'vibe_tags');

    if (checkError) {
      console.error('Error checking column:', checkError);
      return;
    }

    if (columnCheck && columnCheck.length > 0) {
      console.log('vibe_tags column already exists!');
    } else {
      console.log('vibe_tags column does not exist. Need to add manually in Supabase dashboard.');
    }

    // Let's also check what columns do exist
    console.log('Checking existing columns in users_profile...');
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'users_profile')
      .order('ordinal_position');
    
    if (colError) {
      console.error('Error getting columns:', colError);
    } else {
      console.log('Existing columns:', columns);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

checkAndAddVibeTagsColumn();