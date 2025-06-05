
import { useState, useEffect } from 'react';
import { Song } from '@/pages/Index';
import { useAudioAnalysis } from '@/hooks/useAudioAnalysis';
import { useSongOperations } from './songManagement/songOperations';
import { useSongLoader } from './songManagement/songLoader';
import { useRealtimeUpdates } from './songManagement/realtimeUpdates';
import { useUploadManager } from './songManagement/uploadManager';

export const useSongManagement = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { analyzingSongs, analysisQueue, isProcessingQueue, analysisProgress, startAnalysis, startBatchAnalysis, analyzeExistingSongs } = useAudioAnalysis();
  const { createSong, updateSong, deleteSong, deleteAlbum } = useSongOperations();
  const { loadSongs } = useSongLoader();
  const { handleNewSongUpload } = useUploadManager();

  const loadAllSongs = async () => {
    console.log('Loading all songs...');
    const loadedSongs = await loadSongs();
    setSongs(loadedSongs);
    console.log('Loaded songs:', loadedSongs.length);
    
    // Automatically analyze existing songs that haven't been analyzed yet
    setTimeout(() => {
      analyzeExistingSongs(loadedSongs);
    }, 2000);
    
    setIsLoading(false);
  };

  const handleUploadSong = async (newSong: Omit<Song, 'id'>) => {
    console.log('Uploading new song:', newSong.title);
    const song = await createSong(newSong);
    if (song) {
      setSongs(prev => {
        const updated = [song, ...prev];
        console.log('Songs updated after upload, new count:', updated.length);
        return updated;
      });
      handleNewSongUpload(song, songs, startAnalysis, startBatchAnalysis);
    }
  };

  const handleSongUpdate = async (updatedSong: Song) => {
    console.log('Updating song:', updatedSong.title);
    const success = await updateSong(updatedSong);
    if (success) {
      setSongs(prev => {
        const updated = prev.map(song => 
          song.id === updatedSong.id ? updatedSong : song
        );
        console.log('Songs updated after edit');
        return updated;
      });
    }
  };

  const handleSongDelete = async (songId: string) => {
    const songToDelete = songs.find(song => song.id === songId);
    if (songToDelete) {
      console.log('Deleting song:', songToDelete.title);
      const success = await deleteSong(songId, songToDelete.title);
      if (success) {
        setSongs(prev => {
          const updated = prev.filter(song => song.id !== songId);
          console.log('Songs updated after delete, new count:', updated.length);
          return updated;
        });
      }
    }
  };

  const handleAlbumDelete = async (albumName: string) => {
    const songsToDelete = songs.filter(song => song.album === albumName);
    console.log('Deleting album:', albumName, 'with', songsToDelete.length, 'songs');
    const success = await deleteAlbum(albumName, songsToDelete.length);
    if (success) {
      setSongs(prev => {
        const updated = prev.filter(song => song.album !== albumName);
        console.log('Songs updated after album delete, new count:', updated.length);
        return updated;
      });
    }
  };

  const handleRealtimeSongUpdate = (updatedSong: Partial<Song> & { id: string }) => {
    console.log('Realtime song update:', updatedSong.id);
    setSongs(prev => prev.map(song => 
      song.id === updatedSong.id 
        ? { ...song, ...updatedSong }
        : song
    ));
  };

  const handleReanalyzeSong = (song: Song) => {
    if (song.audioFile && !analyzingSongs.has(song.id)) {
      console.log('Starting re-analysis for:', song.title);
      startAnalysis(song);
    }
  };

  // Refresh songs data periodically or when needed
  const refreshSongs = async () => {
    console.log('Refreshing songs data...');
    await loadAllSongs();
  };

  useRealtimeUpdates(handleRealtimeSongUpdate);

  useEffect(() => {
    loadAllSongs();
  }, []);

  return {
    songs,
    isLoading,
    analyzingSongs,
    analysisQueue,
    isProcessingQueue,
    analysisProgress,
    handleUploadSong,
    handleSongUpdate,
    handleSongDelete,
    handleAlbumDelete,
    handleReanalyzeSong,
    refreshSongs
  };
};
