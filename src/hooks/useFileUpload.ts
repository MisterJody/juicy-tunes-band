import { supabase } from '@/integrations/supabase/client';

const REQUIRED_BUCKETS = ['audio-files', 'album-art', 'lyrics-files'];

export const useFileUpload = () => {
  const ensureBucketExists = async (bucketName: string) => {
    try {
      console.log(`Checking if bucket ${bucketName} exists...`);
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        throw listError;
      }
      
      console.log('Available buckets:', buckets);
      const bucketExists = buckets?.some(b => b.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Creating bucket ${bucketName}...`);
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 1024 * 1024 * 50, // 50MB
          allowedMimeTypes: ['audio/*', 'image/*', 'application/pdf', 'text/plain']
        });
        
        if (error) {
          console.error(`Error creating bucket ${bucketName}:`, error);
          throw error;
        }
        console.log(`Bucket ${bucketName} created successfully`);
      } else {
        console.log(`Bucket ${bucketName} already exists`);
      }
    } catch (error) {
      console.error(`Error checking/creating bucket ${bucketName}:`, error);
      throw error;
    }
  };

  const uploadFileToStorage = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      console.log(`Starting upload to ${bucket}...`);
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Ensure the bucket exists
      await ensureBucketExists(bucket);

      // Upload the file
      console.log(`Uploading file to ${bucket}/${path}...`);
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        });

      if (error) {
        console.error(`Error uploading to ${bucket}:`, error);
        throw error;
      }

      console.log('File uploaded successfully, getting public URL...');
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      if (!urlData.publicUrl) {
        console.error('Failed to get public URL for uploaded file');
        throw new Error('Failed to get public URL for uploaded file');
      }

      console.log('Upload complete, public URL:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading file to ${bucket}:`, error);
      throw error; // Re-throw to handle in the UI
    }
  };

  return { uploadFileToStorage };
};
