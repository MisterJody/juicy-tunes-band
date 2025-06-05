import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate a unique email for each test run
function generateRandomEmail() {
  const randomStr = Math.random().toString(36).substring(2, 10)
  return `test-${randomStr}@example.com`
}

async function testDatabaseConnection() {
  try {
    // Test connection by fetching a single row from the songs table
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Database connection successful!');
    console.log('Sample data:', data);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

async function testApiEndpoints() {
  try {
    // Test GET /api/songs
    const response = await fetch('http://localhost:3000/api/songs');
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    console.log('✅ API endpoint /api/songs is working!');
    console.log('Response:', data);
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

async function runTests() {
  console.log('Running database connection test...');
  await testDatabaseConnection();

  console.log('\nRunning API endpoint test...');
  await testApiEndpoints();
}

runTests(); 