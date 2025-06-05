
import { supabase } from '@/integrations/supabase/client';

export const useFileUpload = () => {
  const uploadFileToStorage = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error(`Error uploading to ${bucket}:`, error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Error uploading file to ${bucket}:`, error);
      return null;
    }
  };

  return { uploadFileToStorage };
};
