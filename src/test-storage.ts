import { supabase } from './integrations/supabase/client';

async function testStorageAccess() {
  try {
    // Test listing buckets
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError.message);
      return;
    }

    console.log('Available buckets:', buckets);

    // Test listing files in each bucket
    for (const bucket of buckets) {
      const { data: files, error: filesError } = await supabase
        .storage
        .from(bucket.name)
        .list();

      if (filesError) {
        console.error(`Error listing files in bucket ${bucket.name}:`, filesError.message);
        continue;
      }

      console.log(`Files in bucket ${bucket.name}:`, files);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testStorageAccess(); 