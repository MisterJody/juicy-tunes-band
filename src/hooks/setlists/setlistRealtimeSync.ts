
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSetlistRealtimeSync = (onSetlistsChange: () => void) => {
  useEffect(() => {
    console.log('Setting up setlist real-time sync...');
    
    const channel = supabase
      .channel('setlists-realtime-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'setlists' },
        (payload) => {
          console.log('Setlists table changed:', payload);
          // Add a small delay to ensure database is consistent
          setTimeout(() => {
            onSetlistsChange();
          }, 100);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'setlist_songs' },
        (payload) => {
          console.log('Setlist songs table changed:', payload);
          // Add a small delay to ensure database is consistent
          setTimeout(() => {
            onSetlistsChange();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up setlist real-time sync...');
      supabase.removeChannel(channel);
    };
  }, [onSetlistsChange]);
};
