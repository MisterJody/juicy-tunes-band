import { useState, useCallback, useEffect } from 'react';
import { useAgentContext } from '@/components/AgentProvider';
import { useToast } from '@/hooks/use-toast';
import { Song } from '@/pages/Index';

/**
 * Hook for managing the upload form using the agent system
 */
export const useAgentUploadForm = () => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [albumArtFile, setAlbumArtFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null);
  
  const { toast } = useToast();
  const { 
    uploadAgent,
    metadataAgent,
    isInitialized
  } = useAgentContext();
  
  // Handle audio file selection
  const handleAudioFileChange = useCallback(async (file: File | null) => {
    setAudioFile(file);
    
    if (!isInitialized || !file) {
      return;
    }
    
    try {
      // Extract metadata from the audio file
      const metadata = await metadataAgent.extractMetadata(file);
      
      // Update form fields with extracted metadata
      if (metadata) {
        setExtractedMetadata(metadata);
        
        if (metadata.title && !title) {
          setTitle(metadata.title);
        }
        
        if (metadata.artist && !artist) {
          setArtist(metadata.artist);
        }
        
        if (metadata.album && !album) {
          setAlbum(metadata.album);
        }
        
        // If the file has embedded album art, use it
        if (metadata.picture) {
          const { data, format } = metadata.picture;
          const blob = new Blob([data], { type: `image/${format}` });
          const artFile = new File([blob], `cover.${format}`, { type: `image/${format}` });
          setAlbumArtFile(artFile);
        }
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      toast({
        title: "Metadata extraction failed",
        description: "Could not extract metadata from the audio file.",
        variant: "destructive",
      });
    }
  }, [isInitialized, metadataAgent, title, artist, album, toast]);
  
  // Handle album art file selection
  const handleAlbumArtFileChange = useCallback((file: File | null) => {
    setAlbumArtFile(file);
  }, []);
  
  // Reset the form
  const resetForm = useCallback(() => {
    setTitle('');
    setArtist('');
    setAlbum('');
    setAudioFile(null);
    setAlbumArtFile(null);
    setExtractedMetadata(null);
  }, []);
  
  // Get form data
  const getFormData = useCallback((): Omit<Song, 'id'> => {
    // Calculate duration string from extracted metadata or use default
    let durationStr = '0:00';
    if (extractedMetadata && extractedMetadata.duration) {
      durationStr = extractedMetadata.duration;
    }
    
    return {
      title: title || 'Unknown Title',
      artist: artist || 'Unknown Artist',
      album: album || 'Unknown Album',
      duration: durationStr,
      albumArt: '',
      audioFile: '',
      uploadDate: new Date(),
      key: extractedMetadata?.key,
      tempo: extractedMetadata?.tempo
    };
  }, [title, artist, album, extractedMetadata]);
  
  // Upload a song
  const uploadSong = useCallback(async (lyricsText?: string, lyricsFile?: File) => {
    if (!isInitialized) {
      toast({
        title: "Upload failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return null;
    }
    
    if (!audioFile) {
      toast({
        title: "Upload failed",
        description: "Please select an audio file.",
        variant: "destructive",
      });
      return null;
    }
    
    setIsLoading(true);
    
    try {
      // Get the form data
      const songData = getFormData();
      
      // Upload the song using the upload agent
      const song = await uploadAgent.uploadSong(songData, audioFile, albumArtFile || undefined, lyricsFile);
      
      toast({
        title: "Song uploaded successfully!",
        description: `"${song.title}" has been added to your library.`,
      });
      
      // Reset the form
      resetForm();
      
      return song;
    } catch (error) {
      console.error('Error uploading song:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the song.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, audioFile, albumArtFile, getFormData, uploadAgent, resetForm, toast]);
  
  return {
    title,
    setTitle,
    artist,
    setArtist,
    album,
    setAlbum,
    audioFile,
    albumArtFile,
    isLoading,
    extractedMetadata,
    handleAudioFileChange,
    handleAlbumArtFileChange,
    resetForm,
    getFormData,
    uploadSong,
    setIsLoading
  };
};