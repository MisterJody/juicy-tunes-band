import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Setlist, SetlistWithSongs } from '@/types/setlist';

export const useSetlistOperations = () => {
  const { toast } = useToast();

  const createSetlist = async (setlistData: Omit<Setlist, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await (supabase as unknown)
        .from('setlists')
        .insert(setlistData)
        .select()
        .single();

      if (error) throw error;

      const newSetlist: SetlistWithSongs = {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        songs: []
      };
      
      toast({
        title: "Setlist created",
        description: `"${setlistData.name}" has been created successfully.`,
      });

      return newSetlist;
    } catch (error) {
      console.error('Error creating setlist:', error);
      toast({
        title: "Error creating setlist",
        description: "Could not create setlist.",
        variant: "destructive",
      });
      return null;
    }
  };

  const addSongToSetlist = async (setlistId: string, songId: string, setNumber: number, position: number) => {
    try {
      const { data, error } = await (supabase as unknown)
        .from('setlist_songs')
        .insert({
          setlist_id: setlistId,
          song_id: songId,
          set_number: setNumber,
          position: position
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Song added to setlist, real-time will handle reload...');
      
      toast({
        title: "Song added to setlist",
        description: "Song has been added successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error adding song to setlist:', error);
      toast({
        title: "Error adding song",
        description: "Could not add song to setlist.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeSongFromSetlist = async (setlistSongId: string) => {
    try {
      const { error } = await (supabase as unknown)
        .from('setlist_songs')
        .delete()
        .eq('id', setlistSongId);

      if (error) throw error;

      console.log('Song removed from setlist, real-time will handle reload...');
      
      toast({
        title: "Song removed",
        description: "Song has been removed from setlist.",
      });

      return true;
    } catch (error) {
      console.error('Error removing song from setlist:', error);
      toast({
        title: "Error removing song",
        description: "Could not remove song from setlist.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateSetlistSongPosition = async (setlistSongId: string, newSetNumber: number, newPosition: number) => {
    try {
      console.log(`Updating setlist song ${setlistSongId} to set ${newSetNumber}, position ${newPosition}`);
      
      const { error } = await (supabase as unknown)
        .from('setlist_songs')
        .update({
          set_number: newSetNumber,
          position: newPosition
        })
        .eq('id', setlistSongId);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log(`Successfully updated setlist song ${setlistSongId}`);
      return true;
    } catch (error) {
      console.error('Error updating song position:', error);
      return false;
    }
  };

  const deleteSetlist = async (setlistId: string) => {
    try {
      const { error } = await (supabase as unknown)
        .from('setlists')
        .delete()
        .eq('id', setlistId);

      if (error) throw error;
      
      toast({
        title: "Setlist deleted",
        description: "Setlist has been deleted successfully.",
        variant: "destructive",
      });

      return true;
    } catch (error) {
      console.error('Error deleting setlist:', error);
      toast({
        title: "Error deleting setlist",
        description: "Could not delete setlist.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    createSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    updateSetlistSongPosition,
    deleteSetlist
  };
};
