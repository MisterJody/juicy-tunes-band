
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Song } from '@/pages/Index';

export const useRealtimeUpdates = (
  onSongUpdate: (updatedSong: Partial<Song> & { id: string }) => void
) => {
  useEffect(() => {
    const channel = supabase
      .channel('songs-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'songs' },
        (payload) => {
          const updatedSong = payload.new;
          onSongUpdate({
            id: updatedSong.id,
            key: updatedSong.song_key || undefined,
            tempo: updatedSong.tempo || undefined
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onSongUpdate]);
};
