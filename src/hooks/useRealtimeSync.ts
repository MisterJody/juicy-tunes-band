import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeSyncProps {
  onSongChange: () => void;
  onSetlistChange: () => void;
}

export const useRealtimeSync = ({ onSongChange, onSetlistChange }: UseRealtimeSyncProps) => {
  const channelRef = useRef<ReturnType<typeof supabase.channel>>();
  const isSubscribedRef = useRef(true);

  useEffect(() => {
    console.log('Setting up songs real-time subscriptions...');
    isSubscribedRef.current = true;

    const setupSubscription = async () => {
      try {
        // Clean up any existing channel
        if (channelRef.current) {
          await supabase.removeChannel(channelRef.current);
          channelRef.current = undefined;
        }

        // Create new channel
        const channel = supabase
          .channel(`songs-realtime-updates-${Date.now()}`) // Unique channel name
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'songs' },
            (payload) => {
              if (isSubscribedRef.current) {
                console.log('Songs table changed:', payload);
                onSongChange();
              }
            }
          );

        // Subscribe with retry logic
        const subscribeWithRetry = async (retryCount = 0) => {
          if (!isSubscribedRef.current) return;

          try {
            const status = await channel.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                console.log('Successfully subscribed to songs table changes');
                channelRef.current = channel;
              } else if (status === 'CLOSED') {
                console.log('WebSocket connection closed');
                if (isSubscribedRef.current && retryCount < 3) {
                  console.log(`Retrying subscription (attempt ${retryCount + 1}/3)...`);
                  setTimeout(() => setupSubscription(), 2000);
                }
              }
            });
          } catch (error) {
            console.error('Error subscribing to channel:', error);
            if (isSubscribedRef.current && retryCount < 3) {
              console.log(`Retrying subscription after error (attempt ${retryCount + 1}/3)...`);
              setTimeout(() => setupSubscription(), 2000);
            }
          }
        };

        await subscribeWithRetry();
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      console.log('Cleaning up songs real-time subscriptions...');
      isSubscribedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current).catch(console.error);
        channelRef.current = undefined;
      }
    };
  }, [onSongChange, onSetlistChange]);
};
