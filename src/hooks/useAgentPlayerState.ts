import { useState, useCallback, useEffect } from 'react';
import { Song } from '@/pages/Index';
import { useAgentContext } from '@/components/AgentProvider';

/**
 * Hook for managing the player state using the agent system
 */
export const useAgentPlayerState = (songs: Song[]) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  
  const { 
    uiAgent,
    lyricsAgent,
    isInitialized
  } = useAgentContext();
  
  // Handle song selection
  const handleSongSelect = useCallback((song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    
    // Update UI state
    if (isInitialized) {
      uiAgent.setState('player:currentSong', song);
      uiAgent.setState('player:isPlaying', true);
    }
  }, [isInitialized, uiAgent]);
  
  // Update current song (e.g., when metadata changes)
  const updateCurrentSong = useCallback((updatedSong: Song) => {
    if (currentSong && currentSong.id === updatedSong.id) {
      setCurrentSong(updatedSong);
      
      // Update UI state
      if (isInitialized) {
        uiAgent.setState('player:currentSong', updatedSong);
      }
    }
  }, [currentSong, isInitialized, uiAgent]);
  
  // Handle song or album deletion
  const handleSongOrAlbumDelete = useCallback((songId?: string, albumName?: string) => {
    if (!currentSong) {
      return;
    }
    
    // Check if the current song is being deleted
    if (songId && currentSong.id === songId) {
      setCurrentSong(null);
      setIsPlaying(false);
      
      // Update UI state
      if (isInitialized) {
        uiAgent.setState('player:currentSong', null);
        uiAgent.setState('player:isPlaying', false);
      }
    }
    
    // Check if the current song's album is being deleted
    if (albumName && currentSong.album === albumName) {
      setCurrentSong(null);
      setIsPlaying(false);
      
      // Update UI state
      if (isInitialized) {
        uiAgent.setState('player:currentSong', null);
        uiAgent.setState('player:isPlaying', false);
      }
    }
  }, [currentSong, isInitialized, uiAgent]);
  
  // Toggle play/pause
  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
    
    // Update UI state
    if (isInitialized) {
      uiAgent.setState('player:isPlaying', !isPlaying);
    }
  }, [isInitialized, isPlaying, uiAgent]);
  
  // Set volume
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    
    // Update UI state
    if (isInitialized) {
      uiAgent.setState('player:volume', newVolume);
    }
  }, [isInitialized, uiAgent]);
  
  // Set current time
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    
    // Update UI state
    if (isInitialized) {
      uiAgent.setState('player:currentTime', time);
    }
  }, [isInitialized, uiAgent]);
  
  // Set duration
  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
    
    // Update UI state
    if (isInitialized) {
      uiAgent.setState('player:duration', newDuration);
    }
  }, [isInitialized, uiAgent]);
  
  // Seek to a specific time
  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    
    // Update UI state
    if (isInitialized) {
      uiAgent.setState('player:currentTime', time);
    }
    
    return time;
  }, [isInitialized, uiAgent]);
  
  // Play next song
  const playNextSong = useCallback(() => {
    if (!currentSong || songs.length === 0) {
      return;
    }
    
    // Find the index of the current song
    const currentIndex = songs.findIndex(song => song.id === currentSong.id);
    
    // Get the next song
    const nextIndex = (currentIndex + 1) % songs.length;
    const nextSong = songs[nextIndex];
    
    // Play the next song
    handleSongSelect(nextSong);
  }, [currentSong, songs, handleSongSelect]);
  
  // Play previous song
  const playPreviousSong = useCallback(() => {
    if (!currentSong || songs.length === 0) {
      return;
    }
    
    // Find the index of the current song
    const currentIndex = songs.findIndex(song => song.id === currentSong.id);
    
    // Get the previous song
    const previousIndex = (currentIndex - 1 + songs.length) % songs.length;
    const previousSong = songs[previousIndex];
    
    // Play the previous song
    handleSongSelect(previousSong);
  }, [currentSong, songs, handleSongSelect]);
  
  // Toggle lyrics display
  const toggleLyrics = useCallback(() => {
    setShowLyrics(prev => !prev);
    
    // Update UI state
    if (isInitialized) {
      uiAgent.setState('player:showLyrics', !showLyrics);
    }
  }, [isInitialized, showLyrics, uiAgent]);
  
  // Load lyrics for the current song
  const loadLyrics = useCallback(async () => {
    if (!isInitialized || !currentSong) {
      return null;
    }
    
    try {
      const lyrics = await lyricsAgent.getLyrics(currentSong.id);
      return lyrics;
    } catch (error) {
      console.error('Error loading lyrics:', error);
      return null;
    }
  }, [isInitialized, currentSong, lyricsAgent]);
  
  // Subscribe to UI state changes
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    
    // Subscribe to player state changes
    const unsubscribeIsPlaying = uiAgent.subscribeToState('player:isPlaying', (value) => {
      setIsPlaying(value);
    });
    
    const unsubscribeVolume = uiAgent.subscribeToState('player:volume', (value) => {
      setVolume(value);
    });
    
    const unsubscribeShowLyrics = uiAgent.subscribeToState('player:showLyrics', (value) => {
      setShowLyrics(value);
    });
    
    // Clean up subscriptions on unmount
    return () => {
      unsubscribeIsPlaying();
      unsubscribeVolume();
      unsubscribeShowLyrics();
    };
  }, [isInitialized, uiAgent]);
  
  return {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    showLyrics,
    handleSongSelect,
    updateCurrentSong,
    handleSongOrAlbumDelete,
    togglePlayPause,
    handleVolumeChange,
    handleTimeUpdate,
    handleDurationChange,
    handleSeek,
    playNextSong,
    playPreviousSong,
    toggleLyrics,
    loadLyrics,
    setIsPlaying
  };
};