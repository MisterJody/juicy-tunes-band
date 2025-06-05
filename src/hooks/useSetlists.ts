
import { useState, useEffect, useCallback } from 'react';
import { SetlistWithSongs } from '@/types/setlist';
import { useSetlistOperations } from './setlists/setlistOperations';
import { useSetlistLoader } from './setlists/setlistLoader';
import { useSetlistRealtimeSync } from './setlists/setlistRealtimeSync';

export const useSetlists = () => {
  const [setlists, setSetlists] = useState<SetlistWithSongs[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { loadSetlists } = useSetlistLoader();
  const {
    createSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    updateSetlistSongPosition,
    deleteSetlist
  } = useSetlistOperations();

  const refreshSetlists = useCallback(async () => {
    console.log('Refreshing setlists...');
    try {
      const loadedSetlists = await loadSetlists();
      setSetlists(loadedSetlists);
      console.log('Setlists refreshed, new count:', loadedSetlists.length);
    } catch (error) {
      console.error('Error refreshing setlists:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadSetlists]);

  // Set up real-time subscription for setlist changes
  useSetlistRealtimeSync(refreshSetlists);

  const handleCreateSetlist = async (setlistData: Parameters<typeof createSetlist>[0]) => {
    const newSetlist = await createSetlist(setlistData);
    // Real-time subscription will handle the refresh
    return newSetlist;
  };

  const handleDeleteSetlist = async (setlistId: string) => {
    const success = await deleteSetlist(setlistId);
    // Real-time subscription will handle the refresh
    return success;
  };

  useEffect(() => {
    refreshSetlists();
  }, [refreshSetlists]);

  return {
    setlists,
    isLoading,
    createSetlist: handleCreateSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    updateSetlistSongPosition,
    deleteSetlist: handleDeleteSetlist,
    loadSetlists: refreshSetlists
  };
};
