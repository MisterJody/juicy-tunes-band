
import { useState } from 'react';
import { Song } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';

export const useUploadManager = () => {
  const [recentlyUploadedAlbum, setRecentlyUploadedAlbum] = useState<string | null>(null);
  const { toast } = useToast();

  const handleNewSongUpload = (
    song: Song,
    songs: Song[],
    startAnalysis: (song: Song) => void,
    startBatchAnalysis: (songs: Song[]) => void
  ) => {
    // Check if this is part of an album upload
    const currentAlbumSongs = songs.filter(s => s.album === song.album);
    const isNewAlbum = currentAlbumSongs.length === 0;
    
    if (isNewAlbum || recentlyUploadedAlbum !== song.album) {
      setRecentlyUploadedAlbum(song.album);
      toast({
        title: "Song uploaded successfully!",
        description: `"${song.title}" has been added to your library.`,
      });
      
      // Start individual analysis
      startAnalysis(song);
      
      // Set a timer to check if more songs from same album are coming
      setTimeout(() => {
        const albumSongs = [...songs, song].filter(s => s.album === song.album);
        if (albumSongs.length > 1) {
          // This appears to be an album upload, start batch analysis
          startBatchAnalysis(albumSongs);
        }
        setRecentlyUploadedAlbum(null);
      }, 5000);
    } else {
      // Part of ongoing album upload
      toast({
        title: "Song uploaded successfully!",
        description: `"${song.title}" added to album "${song.album}".`,
      });
    }
  };

  return {
    recentlyUploadedAlbum,
    handleNewSongUpload
  };
};
