import { useState, useEffect, useCallback } from 'react';
import { Song } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';
import { useAgentContext } from '@/components/AgentProvider';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing songs using the agent system
 */
export const useAgentSongManagement = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzingSongs, setAnalyzingSongs] = useState<Set<string>>(new Set());
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  
  const { toast } = useToast();
  const { 
    uploadAgent, 
    audioProcessingAgent, 
    metadataAgent,
    lyricsAgent,
    realtimeAgent,
    errorWatcherAgent,
    isInitialized
  } = useAgentContext();
  
  // Load all songs from the database
  const loadAllSongs = useCallback(async () => {
    console.log('Loading all songs...');
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('upload_date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Convert database records to Song objects
      const loadedSongs: Song[] = data.map(record => ({
        id: record.id,
        title: record.title,
        artist: record.artist,
        album: record.album,
        duration: record.duration,
        albumArt: record.album_art_url,
        audioFile: record.audio_file_url,
        uploadDate: new Date(record.upload_date),
        key: record.song_key,
        tempo: record.tempo,
        lyricsText: record.lyrics_text,
        lyricsFileUrl: record.lyrics_file_url,
        hasLyrics: record.has_lyrics
      }));
      
      setSongs(loadedSongs);
      console.log('Loaded songs:', loadedSongs.length);
      
      // Automatically analyze existing songs that haven't been analyzed yet
      setTimeout(() => {
        analyzeExistingSongs(loadedSongs);
      }, 2000);
    } catch (error) {
      console.error('Error loading songs:', error);
      toast({
        title: "Failed to load songs",
        description: "Could not load songs from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  // Upload a new song
  const handleUploadSong = useCallback(async (newSong: Omit<Song, 'id'>) => {
    if (!isInitialized) {
      console.error('Agent system not initialized');
      toast({
        title: "Upload failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return null;
    }
    
    try {
      // Create the song in the database
      const { data, error } = await supabase
        .from('songs')
        .insert({
          title: newSong.title,
          artist: newSong.artist,
          album: newSong.album,
          duration: newSong.duration,
          album_art_url: newSong.albumArt,
          audio_file_url: newSong.audioFile,
          song_key: newSong.key,
          tempo: newSong.tempo,
          lyrics_text: newSong.lyricsText,
          lyrics_file_url: newSong.lyricsFileUrl,
          has_lyrics: newSong.hasLyrics || false,
          upload_date: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Convert to Song object
      const song: Song = {
        id: data.id,
        title: data.title,
        artist: data.artist,
        album: data.album,
        duration: data.duration,
        albumArt: data.album_art_url,
        audioFile: data.audio_file_url,
        uploadDate: new Date(data.upload_date),
        key: data.song_key,
        tempo: data.tempo,
        lyricsText: data.lyrics_text,
        lyricsFileUrl: data.lyrics_file_url,
        hasLyrics: data.has_lyrics
      };
      
      // Add the song to the local state
      setSongs(prev => [song, ...prev]);
      
      // Start analysis for the song
      if (song.audioFile) {
        startAnalysis(song);
      }
      
      toast({
        title: "Song uploaded successfully!",
        description: `"${song.title}" has been added to your library.`,
      });
      
      return song;
    } catch (error) {
      console.error('Error uploading song:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'upload_song', song: newSong });
      
      toast({
        title: "Upload failed",
        description: "Could not save song to database.",
        variant: "destructive",
      });
      
      return null;
    }
  }, [isInitialized, toast, errorWatcherAgent]);
  
  // Update an existing song
  const handleSongUpdate = useCallback(async (updatedSong: Song) => {
    if (!isInitialized) {
      console.error('Agent system not initialized');
      toast({
        title: "Update failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Update the song in the database
      const { error } = await supabase
        .from('songs')
        .update({
          title: updatedSong.title,
          artist: updatedSong.artist,
          album: updatedSong.album,
          duration: updatedSong.duration,
          album_art_url: updatedSong.albumArt,
          audio_file_url: updatedSong.audioFile,
          song_key: updatedSong.key,
          tempo: updatedSong.tempo,
          lyrics_text: updatedSong.lyricsText,
          lyrics_file_url: updatedSong.lyricsFileUrl,
          has_lyrics: updatedSong.hasLyrics || false
        })
        .eq('id', updatedSong.id);
      
      if (error) {
        throw error;
      }
      
      // Update the song in the local state
      setSongs(prev => prev.map(song => 
        song.id === updatedSong.id ? updatedSong : song
      ));
      
      toast({
        title: "Song updated successfully!",
        description: `"${updatedSong.title}" has been updated.`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating song:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'update_song', song: updatedSong });
      
      toast({
        title: "Update failed",
        description: "Could not update song in database.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [isInitialized, toast, errorWatcherAgent]);
  
  // Delete a song
  const handleSongDelete = useCallback(async (songId: string, songTitle: string) => {
    if (!isInitialized) {
      console.error('Agent system not initialized');
      toast({
        title: "Delete failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Delete the song from the database
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);
      
      if (error) {
        throw error;
      }
      
      // Remove the song from the local state
      setSongs(prev => prev.filter(song => song.id !== songId));
      
      toast({
        title: "Song deleted",
        description: `"${songTitle}" has been removed from your library.`,
        variant: "destructive",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting song:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'delete_song', songId, songTitle });
      
      toast({
        title: "Delete failed",
        description: "Could not delete song from database.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [isInitialized, toast, errorWatcherAgent]);
  
  // Delete an album
  const handleAlbumDelete = useCallback(async (albumName: string, songCount: number) => {
    if (!isInitialized) {
      console.error('Agent system not initialized');
      toast({
        title: "Delete failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Delete all songs in the album from the database
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('album', albumName);
      
      if (error) {
        throw error;
      }
      
      // Remove the songs from the local state
      setSongs(prev => prev.filter(song => song.album !== albumName));
      
      toast({
        title: "Album deleted",
        description: `Album "${albumName}" and ${songCount} songs have been removed.`,
        variant: "destructive",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting album:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'delete_album', albumName, songCount });
      
      toast({
        title: "Delete failed",
        description: "Could not delete album from database.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [isInitialized, toast, errorWatcherAgent]);
  
  // Start analysis for a song
  const startAnalysis = useCallback((song: Song) => {
    if (!isInitialized || !song.audioFile) {
      return;
    }
    
    // Add the song to the analyzing set
    setAnalyzingSongs(prev => {
      const newSet = new Set(prev);
      newSet.add(song.id);
      return newSet;
    });
    
    // Start the analysis
    audioProcessingAgent.analyzeSong(song.id, song.audioFile)
      .then(updatedSong => {
        // Update the song in the local state
        setSongs(prev => prev.map(s => 
          s.id === song.id ? {
            ...s,
            key: updatedSong.song_key,
            tempo: updatedSong.tempo
          } : s
        ));
        
        toast({
          title: "Analysis complete",
          description: `"${song.title}" analyzed: ${updatedSong.tempo} BPM, ${updatedSong.song_key}`,
        });
      })
      .catch(error => {
        console.error('Error analyzing song:', error);
        errorWatcherAgent.reportError(error as Error, { action: 'analyze_song', song });
        
        toast({
          title: "Analysis failed",
          description: "Could not analyze the audio file.",
          variant: "destructive",
        });
      })
      .finally(() => {
        // Remove the song from the analyzing set
        setAnalyzingSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
      });
  }, [isInitialized, audioProcessingAgent, toast, errorWatcherAgent]);
  
  // Analyze existing songs that haven't been analyzed yet
  const analyzeExistingSongs = useCallback((songs: Song[]) => {
    if (!isInitialized) {
      return;
    }
    
    // Find songs that haven't been analyzed yet (no tempo or key)
    const unanalyzedSongs = songs.filter(song => 
      song.audioFile && (!song.tempo || !song.key) && !analyzingSongs.has(song.id)
    );
    
    if (unanalyzedSongs.length === 0) {
      return;
    }
    
    console.log('Found', unanalyzedSongs.length, 'existing songs to analyze');
    
    // Start batch analysis
    setIsProcessingQueue(true);
    setAnalysisProgress(0);
    
    // Process songs one by one
    let processed = 0;
    
    const processNext = async () => {
      if (processed >= unanalyzedSongs.length) {
        setIsProcessingQueue(false);
        setAnalysisProgress(100);
        return;
      }
      
      const song = unanalyzedSongs[processed];
      
      // Add the song to the analyzing set
      setAnalyzingSongs(prev => {
        const newSet = new Set(prev);
        newSet.add(song.id);
        return newSet;
      });
      
      try {
        // Analyze the song
        const updatedSong = await audioProcessingAgent.analyzeSong(song.id, song.audioFile);
        
        // Update the song in the local state
        setSongs(prev => prev.map(s => 
          s.id === song.id ? {
            ...s,
            key: updatedSong.song_key,
            tempo: updatedSong.tempo
          } : s
        ));
      } catch (error) {
        console.error('Error analyzing song:', error);
        errorWatcherAgent.reportError(error as Error, { action: 'analyze_existing_song', song });
      } finally {
        // Remove the song from the analyzing set
        setAnalyzingSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(song.id);
          return newSet;
        });
        
        // Update progress
        processed++;
        setAnalysisProgress(Math.round((processed / unanalyzedSongs.length) * 100));
        
        // Process the next song
        setTimeout(processNext, 1000);
      }
    };
    
    // Start processing
    processNext();
  }, [isInitialized, analyzingSongs, audioProcessingAgent, errorWatcherAgent]);
  
  // Handle reanalyzing a song
  const handleReanalyzeSong = useCallback((song: Song) => {
    if (!isInitialized || !song.audioFile || analyzingSongs.has(song.id)) {
      return;
    }
    
    startAnalysis(song);
  }, [isInitialized, analyzingSongs, startAnalysis]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    
    // Subscribe to song updates
    const unsubscribe = realtimeAgent.subscribeToSongUpdates(data => {
      const { songId, song } = data;
      
      // Update the song in the local state
      setSongs(prev => prev.map(s => 
        s.id === songId ? {
          ...s,
          title: song.title || s.title,
          artist: song.artist || s.artist,
          album: song.album || s.album,
          duration: song.duration || s.duration,
          albumArt: song.album_art_url || s.albumArt,
          audioFile: song.audio_file_url || s.audioFile,
          key: song.song_key || s.key,
          tempo: song.tempo || s.tempo,
          lyricsText: song.lyrics_text || s.lyricsText,
          lyricsFileUrl: song.lyrics_file_url || s.lyricsFileUrl,
          hasLyrics: song.has_lyrics || s.hasLyrics
        } : s
      ));
    });
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [isInitialized, realtimeAgent]);
  
  // Load songs on mount
  useEffect(() => {
    loadAllSongs();
  }, [loadAllSongs]);
  
  return {
    songs,
    isLoading,
    analyzingSongs: analyzingSongs,
    isProcessingQueue,
    analysisProgress,
    handleUploadSong,
    handleSongUpdate,
    handleSongDelete,
    handleAlbumDelete,
    handleReanalyzeSong,
    refreshSongs: loadAllSongs
  };
};