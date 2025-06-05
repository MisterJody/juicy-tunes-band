import { supabase } from './integrations/supabase/client';

async function testSupabaseConnection() {
  try {
    // Try to fetch a single row from the songs table
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return;
    }

    console.log('Successfully connected to Supabase!');
    console.log('Test query result:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testSupabaseConnection(); 