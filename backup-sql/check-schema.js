const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase URL and Key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Service Role Key is missing.');
  console.error('Make sure to define NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Get all tables in the public schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%'); // Exclude system tables
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      process.exit(1);
    }
    
    console.log(`Found ${tables.length} tables:\n`);
    
    // For each table, get its columns
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`Table: ${tableName}`);
      
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position', { ascending: true });
      
      if (columnsError) {
        console.error(`Error fetching columns for table ${tableName}:`, columnsError);
        continue;
      }
      
      // Print column information
      console.log('Columns:');
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? `DEFAULT ${col.column_default}` : '';
        console.log(`  - ${col.column_name} (${col.data_type}) ${nullable} ${defaultVal}`);
      });
      
      console.log('\n');
    }
    
    console.log('Schema check completed!');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

checkSchema(); 