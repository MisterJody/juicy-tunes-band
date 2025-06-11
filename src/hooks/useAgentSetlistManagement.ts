import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAgentContext } from '@/components/AgentProvider';
import { Setlist, SetlistItem } from '@/agents/SetlistAgent';
import { Song } from '@/pages/Index';

/**
 * Hook for managing setlists using the agent system
 */
export const useAgentSetlistManagement = (selectedSetlistId?: string) => {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [currentSetlist, setCurrentSetlist] = useState<Setlist | null>(null);
  const [setlistItems, setSetlistItems] = useState<SetlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { 
    setlistAgent,
    realtimeAgent,
    errorWatcherAgent,
    isInitialized
  } = useAgentContext();
  
  // Load all setlists
  const loadSetlists = useCallback(async () => {
    if (!isInitialized) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const allSetlists = await setlistAgent.getAllSetlists();
      setSetlists(allSetlists);
    } catch (error) {
      console.error('Error loading setlists:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'load_setlists' });
      
      toast({
        title: "Failed to load setlists",
        description: "Could not load setlists from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, setlistAgent, toast, errorWatcherAgent]);
  
  // Load a specific setlist
  const loadSetlist = useCallback(async (setlistId: string) => {
    if (!isInitialized) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { setlist, items } = await setlistAgent.getSetlist(setlistId);
      setCurrentSetlist(setlist);
      setSetlistItems(items);
    } catch (error) {
      console.error('Error loading setlist:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'load_setlist', setlistId });
      
      toast({
        title: "Failed to load setlist",
        description: "Could not load setlist from the database.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, setlistAgent, toast, errorWatcherAgent]);
  
  // Create a new setlist
  const createSetlist = useCallback(async (name: string, description?: string) => {
    if (!isInitialized) {
      toast({
        title: "Create failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return null;
    }
    
    try {
      const setlist = await setlistAgent.createSetlist(name, description);
      
      // Add the new setlist to the local state
      setSetlists(prev => [setlist, ...prev]);
      
      toast({
        title: "Setlist created",
        description: `"${name}" has been created.`,
      });
      
      return setlist;
    } catch (error) {
      console.error('Error creating setlist:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'create_setlist', name, description });
      
      toast({
        title: "Create failed",
        description: "Could not create setlist in database.",
        variant: "destructive",
      });
      
      return null;
    }
  }, [isInitialized, setlistAgent, toast, errorWatcherAgent]);
  
  // Update a setlist
  const updateSetlist = useCallback(async (setlistId: string, name: string, description?: string) => {
    if (!isInitialized) {
      toast({
        title: "Update failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Send message to update the setlist
      await setlistAgent.sendMessage(
        setlistAgent.id,
        'setlist:update',
        { setlistId, name, description }
      );
      
      // Update the setlist in the local state
      setSetlists(prev => prev.map(setlist => 
        setlist.id === setlistId ? { ...setlist, name, description } : setlist
      ));
      
      if (currentSetlist && currentSetlist.id === setlistId) {
        setCurrentSetlist({ ...currentSetlist, name, description });
      }
      
      toast({
        title: "Setlist updated",
        description: `"${name}" has been updated.`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating setlist:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'update_setlist', setlistId, name, description });
      
      toast({
        title: "Update failed",
        description: "Could not update setlist in database.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [isInitialized, setlistAgent, currentSetlist, toast, errorWatcherAgent]);
  
  // Delete a setlist
  const deleteSetlist = useCallback(async (setlistId: string) => {
    if (!isInitialized) {
      toast({
        title: "Delete failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Send message to delete the setlist
      await setlistAgent.sendMessage(
        setlistAgent.id,
        'setlist:delete',
        { setlistId }
      );
      
      // Remove the setlist from the local state
      setSetlists(prev => prev.filter(setlist => setlist.id !== setlistId));
      
      if (currentSetlist && currentSetlist.id === setlistId) {
        setCurrentSetlist(null);
        setSetlistItems([]);
      }
      
      toast({
        title: "Setlist deleted",
        description: "The setlist has been deleted.",
        variant: "destructive",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting setlist:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'delete_setlist', setlistId });
      
      toast({
        title: "Delete failed",
        description: "Could not delete setlist from database.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [isInitialized, setlistAgent, currentSetlist, toast, errorWatcherAgent]);
  
  // Add a song to a setlist
  const addSongToSetlist = useCallback(async (setlistId: string, song: Song, position?: number, notes?: string) => {
    if (!isInitialized) {
      toast({
        title: "Add failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      const item = await setlistAgent.addSongToSetlist(setlistId, song.id, position, notes);
      
      // Add the song to the local state if this is the current setlist
      if (currentSetlist && currentSetlist.id === setlistId) {
        setSetlistItems(prev => {
          const newItems = [...prev];
          
          // Add the item with the song data
          newItems.push({
            ...item,
            song: song
          });
          
          // Sort by position
          newItems.sort((a, b) => a.position - b.position);
          
          return newItems;
        });
      }
      
      toast({
        title: "Song added to setlist",
        description: `"${song.title}" has been added to the setlist.`,
      });
      
      return true;
    } catch (error) {
      console.error('Error adding song to setlist:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'add_song_to_setlist', setlistId, songId: song.id });
      
      toast({
        title: "Add failed",
        description: "Could not add song to setlist.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [isInitialized, setlistAgent, currentSetlist, toast, errorWatcherAgent]);
  
  // Remove a song from a setlist
  const removeSongFromSetlist = useCallback(async (setlistId: string, itemId: string) => {
    if (!isInitialized) {
      toast({
        title: "Remove failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Send message to remove the song from the setlist
      await setlistAgent.sendMessage(
        setlistAgent.id,
        'setlist:remove_song',
        { setlistId, itemId }
      );
      
      // Remove the song from the local state if this is the current setlist
      if (currentSetlist && currentSetlist.id === setlistId) {
        setSetlistItems(prev => prev.filter(item => item.id !== itemId));
      }
      
      toast({
        title: "Song removed from setlist",
        description: "The song has been removed from the setlist.",
        variant: "destructive",
      });
      
      return true;
    } catch (error) {
      console.error('Error removing song from setlist:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'remove_song_from_setlist', setlistId, itemId });
      
      toast({
        title: "Remove failed",
        description: "Could not remove song from setlist.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [isInitialized, setlistAgent, currentSetlist, toast, errorWatcherAgent]);
  
  // Reorder songs in a setlist
  const reorderSetlistSongs = useCallback(async (setlistId: string, items: SetlistItem[]) => {
    if (!isInitialized) {
      toast({
        title: "Reorder failed",
        description: "The agent system is not initialized.",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Send message to reorder the songs in the setlist
      await setlistAgent.sendMessage(
        setlistAgent.id,
        'setlist:reorder_songs',
        { setlistId, items }
      );
      
      // Update the local state if this is the current setlist
      if (currentSetlist && currentSetlist.id === setlistId) {
        // Create a new array with updated positions
        const updatedItems = items.map((item, index) => ({
          ...item,
          position: index
        }));
        
        setSetlistItems(updatedItems);
      }
      
      return true;
    } catch (error) {
      console.error('Error reordering setlist songs:', error);
      errorWatcherAgent.reportError(error as Error, { action: 'reorder_setlist_songs', setlistId });
      
      toast({
        title: "Reorder failed",
        description: "Could not reorder songs in setlist.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [isInitialized, setlistAgent, currentSetlist, toast, errorWatcherAgent]);
  
  // Subscribe to setlist updates
  useEffect(() => {
    if (!isInitialized) {
      return;
    }
    
    // Subscribe to setlist updates
    const unsubscribe = realtimeAgent.subscribeToSetlistUpdates(data => {
      // Handle different types of updates
      if ('setlist' in data) {
        // Setlist created or updated
        const { setlist } = data;
        
        if ('setlist:created' in data) {
          // Add the new setlist to the local state
          setSetlists(prev => [setlist, ...prev]);
        } else if ('setlist:updated' in data) {
          // Update the setlist in the local state
          setSetlists(prev => prev.map(s => 
            s.id === setlist.id ? setlist : s
          ));
          
          // Update current setlist if it's the one that was updated
          if (currentSetlist && currentSetlist.id === setlist.id) {
            setCurrentSetlist(setlist);
          }
        }
      } else if ('setlistId' in data) {
        if ('setlist:deleted' in data) {
          // Remove the setlist from the local state
          const { setlistId } = data;
          setSetlists(prev => prev.filter(s => s.id !== setlistId));
          
          // Clear current setlist if it's the one that was deleted
          if (currentSetlist && currentSetlist.id === setlistId) {
            setCurrentSetlist(null);
            setSetlistItems([]);
          }
        } else if ('setlist:reordered' in data) {
          // Reload the setlist if it's the current one
          const { setlistId } = data;
          if (currentSetlist && currentSetlist.id === setlistId) {
            loadSetlist(setlistId);
          }
        } else if ('setlist:item:added' in data) {
          // Add the item to the local state if this is the current setlist
          const { setlistId, item } = data;
          if (currentSetlist && currentSetlist.id === setlistId) {
            loadSetlist(setlistId);
          }
        } else if ('setlist:item:removed' in data) {
          // Remove the item from the local state if this is the current setlist
          const { setlistId, itemId } = data;
          if (currentSetlist && currentSetlist.id === setlistId) {
            setSetlistItems(prev => prev.filter(item => item.id !== itemId));
          }
        }
      }
    });
    
    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [isInitialized, realtimeAgent, currentSetlist, loadSetlist]);
  
  // Load setlists on mount
  useEffect(() => {
    loadSetlists();
  }, [loadSetlists]);
  
  // Load selected setlist when it changes
  useEffect(() => {
    if (selectedSetlistId) {
      loadSetlist(selectedSetlistId);
    } else {
      setCurrentSetlist(null);
      setSetlistItems([]);
    }
  }, [selectedSetlistId, loadSetlist]);
  
  return {
    setlists,
    currentSetlist,
    setlistItems,
    isLoading,
    loadSetlists,
    loadSetlist,
    createSetlist,
    updateSetlist,
    deleteSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    reorderSetlistSongs
  };
};