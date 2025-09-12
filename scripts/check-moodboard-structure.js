const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkMoodboardStructure() {
  console.log("🔍 Checking moodboard table structure...
")
  
  try {
    const { data, error } = await supabase
      .from("moodboards")
      .select("*")
      .limit(1)
    
    if (error) {
      console.log("❌ Error:", error.message)
    } else {
      console.log("✅ Moodboards table exists")
      if (data.length > 0) {
        console.log("Available columns:", Object.keys(data[0]))
      } else {
        console.log("No data found in moodboards table")
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message)
  }
}

checkMoodboardStructure()
