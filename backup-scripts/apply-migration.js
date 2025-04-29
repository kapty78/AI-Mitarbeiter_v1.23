const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if available
require('dotenv').config();

// Get Supabase URL and Key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key required for running migrations

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Service Role Key is missing.');
  console.error('Make sure to define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    // Migration files to run in sequence
    const migrationFiles = [
      '20240612000000_create_chats_table.sql',
      '20240612000001_create_chat_messages_table.sql',
      '20240612000002_create_helper_functions.sql'
    ];
    
    // Run each migration in sequence
    for (const file of migrationFiles) {
      console.log(`Reading migration file: ${file}...`);
      const filePath = path.join(__dirname, 'supabase', 'migrations', file);
      
      if (!fs.existsSync(filePath)) {
        console.error(`Migration file not found: ${filePath}`);
        continue;
      }
      
      const migrationSql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Applying migration: ${file}...`);
      const { data, error } = await supabase.rpc('exec_sql', { query: migrationSql });
      
      if (error) {
        console.error(`Error applying migration ${file}:`, error);
      } else {
        console.log(`Migration ${file} applied successfully!`);
      }
    }
    
    console.log('All migrations completed!');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

applyMigration(); 