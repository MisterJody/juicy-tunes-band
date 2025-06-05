import { useState } from 'react';
import { Song } from '@/pages/Index';
import { formatDuration } from '@/utils/audioAnalysis';
import { useFileUpload } from '@/hooks/useFileUpload';

interface UploadProgress {
  current: number;
  total: number;
}

export const useAlbumUpload = () => {
  const [albumFiles, setAlbumFiles] = useState<File[]>([]);
  const [albumName, setAlbumName] = useState('');
  const [albumArt, setAlbumArt] = useState<string>('');
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ current: 0, total: 0 });

  const { uploadFileToStorage } = useFileUpload();

  const handleAlbumFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAlbumFiles(files);
    
    // Auto-set album name from first file if not set
    if (files.length > 0 && !albumName) {
      const firstFileName = files[0].name.replace(/\.[^/.]+$/, '');
      // Try to extract album name (remove track numbers, common patterns)
      const cleanName = firstFileName.replace(/^\d+[\s\-.]*/, '').replace(/\s*-\s*.*/, '');
      setAlbumName(cleanName || 'New Album');
    }
  };

  const handleAlbumArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAlbumArtFile(file);
    const imageUrl = URL.createObjectURL(file);
    setAlbumArt(imageUrl);
  };

  const extractMetadataFromFile = async (file: File): Promise<Partial<Song>> => {
    const defaultData = {
      title: file.name.replace(/\.[^/.]+$/, '').replace(/^\d+[\s\-.]*/, ''),
      artist: 'TheBandJuicy',
      album: albumName,
      duration: '0:00'
    };

    try {
      // Get duration from audio element
      const audio = document.createElement('audio');
      const fileUrl = URL.createObjectURL(file);
      audio.src = fileUrl;

      return new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', async () => {
          const metadata = { ...defaultData };
          
          if (audio.duration && !isNaN(audio.duration)) {
            metadata.duration = formatDuration(audio.duration);
          }

          // Try to parse metadata if available
          try {
            const { parseBuffer } = await import('music-metadata-browser');
            const arrayBuffer = await file.arrayBuffer();
            const fileMetadata = await parseBuffer(new Uint8Array(arrayBuffer), file.type);

            if (fileMetadata.common.title) metadata.title = fileMetadata.common.title;
            if (fileMetadata.common.album) metadata.album = fileMetadata.common.album;
            if (fileMetadata.format.duration) metadata.duration = formatDuration(fileMetadata.format.duration);

            console.log('Extracted metadata for', file.name, ':', fileMetadata);
          } catch (metadataError) {
            console.log('Music metadata parsing failed for', file.name, ':', metadataError);
          }

          URL.revokeObjectURL(fileUrl);
          resolve(metadata);
        });

        audio.addEventListener('error', () => {
          URL.revokeObjectURL(fileUrl);
          resolve(defaultData);
        });
      });
    } catch (error) {
      console.error('Error extracting metadata from', file.name, ':', error);
      return defaultData;
    }
  };

  const uploadAlbum = async (onUpload: (song: Omit<Song, 'id'>) => void) => {
    if (albumFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: albumFiles.length });

    try {
      // Upload album art first if provided
      let albumArtUrl = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=300&fit=crop';
      
      if (albumArtFile) {
        const artFileName = `${Date.now()}-album-art-${albumArtFile.name}`;
        const uploadedArtUrl = await uploadFileToStorage(albumArtFile, 'album-art', artFileName);
        if (uploadedArtUrl) {
          albumArtUrl = uploadedArtUrl;
        }
      }

      // Process each file sequentially
      for (let i = 0; i < albumFiles.length; i++) {
        const file = albumFiles[i];
        console.log(`Processing file ${i + 1}/${albumFiles.length}: ${file.name}`);
        
        try {
          // Extract metadata
          const metadata = await extractMetadataFromFile(file);
          
          // Upload audio file
          const audioFileName = `${Date.now()}-${file.name}`;
          const audioUrl = await uploadFileToStorage(file, 'audio-files', audioFileName);

          if (audioUrl) {
            // Create song object
            const songData: Omit<Song, 'id'> = {
              title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
              artist: metadata.artist || 'TheBandJuicy',
              album: metadata.album || albumName,
              duration: metadata.duration || '0:00',
              albumArt: albumArtUrl,
              audioFile: audioUrl,
              uploadDate: new Date()
            };

            // Upload the song
            onUpload(songData);
            
            console.log(`Successfully uploaded: ${songData.title}`);
          } else {
            console.error(`Failed to upload audio file: ${file.name}`);
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }

        // Update progress
        setUploadProgress({ current: i + 1, total: albumFiles.length });
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Reset form
      setAlbumFiles([]);
      setAlbumName('');
      setAlbumArt('');
      setAlbumArtFile(null);
      
    } catch (error) {
      console.error('Error uploading album:', error);
      alert('Error uploading album. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return {
    albumFiles,
    albumName,
    setAlbumName,
    albumArt,
    isUploading,
    uploadProgress,
    handleAlbumFilesChange,
    handleAlbumArtChange,
    uploadAlbum
  };
};
