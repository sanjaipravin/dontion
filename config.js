// Initialize Supabase client
const supabaseUrl = 'https://adksqcvkeyscorxfwhtf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFka3NxY3ZrZXlzY29yeGZ3aHRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwMzU5MjYsImV4cCI6MjA2MjYxMTkyNn0.ocDq3IuZ9IlDtY_25pMdLRplw63u8MZCWHIcVzNpdh4';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Export the client
export { supabase }; 