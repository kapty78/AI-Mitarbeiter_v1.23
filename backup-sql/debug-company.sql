-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'companies'
);

-- Show table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'companies';

-- Show all companies
SELECT * FROM companies;

-- Check specific company
SELECT * FROM companies WHERE domain = 'ecomtask.de'; 