const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic21neW15Zmhud2pkbm1sZWxyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwODg1MywiZXhwIjoyMDcyNjg0ODUzfQ.XkDZmk6mfJAGUEUl3uusETrtsJZ5fBPtHMrda7nD__U';

async function checkTaskInDatabase() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Check both task IDs
  const taskIds = [
    'a1955c96ecd5573580bf32ceb35d7616', // Original task that was failing
    'cdb1838473f98ce50330ac64e5cb667e'  // New task we just created
  ];
  
  console.log('Checking tasks in database...\n');
  
  for (const taskId of taskIds) {
    console.log(`\n📊 Task ID: ${taskId}`);
    console.log('=' .repeat(50));
    
    // Check by id field
    const { data: taskById, error: errorById } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (taskById) {
      console.log('\n✅ Found by ID field:');
      console.log('Status:', taskById.status);
      console.log('Result URL:', taskById.result_url || 'None');
      console.log('Error:', taskById.error_message || 'None');
      console.log('Created:', taskById.created_at);
      console.log('Updated:', taskById.updated_at);
      console.log('Input URL:', taskById.input_image_url);
      console.log('Prompt:', taskById.prompt);
    } else {
      console.log('❌ Not found by ID field');
    }
    
    // Also check by api_task_id field
    const { data: taskByApiId, error: errorByApiId } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .eq('api_task_id', taskId)
      .single();
    
    if (taskByApiId && !taskById) {
      console.log('\n✅ Found by api_task_id field:');
      console.log('Status:', taskByApiId.status);
      console.log('Result URL:', taskByApiId.result_url || 'None');
      console.log('Error:', taskByApiId.error_message || 'None');
      console.log('Created:', taskByApiId.created_at);
      console.log('Updated:', taskByApiId.updated_at);
    }
  }
  
  // Check recent tasks
  console.log('\n\n📋 Recent enhancement tasks (last 5):');
  console.log('=' .repeat(50));
  
  const { data: recentTasks, error } = await supabase
    .from('enhancement_tasks')
    .select('id, api_task_id, status, created_at, updated_at, error_message')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentTasks) {
    recentTasks.forEach((task, i) => {
      console.log(`\n${i + 1}. Task ID: ${task.id}`);
      console.log('   API Task ID:', task.api_task_id);
      console.log('   Status:', task.status);
      console.log('   Error:', task.error_message || 'None');
      console.log('   Created:', task.created_at);
      console.log('   Updated:', task.updated_at);
    });
  }
}

checkTaskInDatabase();