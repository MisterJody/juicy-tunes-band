
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeSyncProps {
  onSongChange: () => void;
  onSetlistChange: () => void;
}

export const useRealtimeSync = ({ onSongChange, onSetlistChange }: UseRealtimeSyncProps) => {
  useEffect(() => {
    console.log('Setting up songs real-time subscriptions...');
    
    // Subscribe to songs table changes only
    const songsChannel = supabase
      .channel('songs-realtime-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'songs' },
        (payload) => {
          console.log('Songs table changed:', payload);
          onSongChange();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up songs real-time subscriptions...');
      supabase.removeChannel(songsChannel);
    };
  }, [onSongChange, onSetlistChange]);
};
