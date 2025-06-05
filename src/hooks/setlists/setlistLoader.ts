import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SetlistSong, SetlistWithSongs } from '@/types/setlist';
import { Song } from '@/pages/Index';

export const useSetlistLoader = () => {
  const { toast } = useToast();

  const loadSetlists = useCallback(async () => {
    console.log('Loading setlists...');
    try {
      const { data: setlistsData, error: setlistsError } = await (supabase as unknown)
        .from('setlists')
        .select('*')
        .order('created_at', { ascending: false });

      if (setlistsError) throw setlistsError;

      const setlistsWithSongs: SetlistWithSongs[] = [];

      for (const setlist of setlistsData || []) {
        const { data: setlistSongs, error: songsError } = await (supabase as unknown)
          .from('setlist_songs')
          .select(`
            *,
            songs (*)
          `)
          .eq('setlist_id', setlist.id)
          .order('set_number')
          .order('position');

        if (songsError) throw songsError;

        const formattedSongs: SetlistSong[] = (setlistSongs || []).map((item: Record<string, unknown>) => ({
          id: item.id,
          setlist_id: item.setlist_id,
          song_id: item.song_id,
          position: item.position,
          set_number: item.set_number,
          notes: item.notes,
          song: item.songs ? {
            id: item.songs.id,
            title: item.songs.title,
            artist: item.songs.artist,
            album: item.songs.album,
            duration: item.songs.duration,
            albumArt: item.songs.album_art_url || '',
            audioFile: item.songs.audio_file_url || '',
            uploadDate: new Date(item.songs.upload_date),
            key: item.songs.song_key,
            tempo: item.songs.tempo,
            lyricsText: item.songs.lyrics_text,
            lyricsFileUrl: item.songs.lyrics_file_url,
            hasLyrics: item.songs.has_lyrics
          } as Song : undefined
        }));

        setlistsWithSongs.push({
          ...setlist,
          created_at: new Date(setlist.created_at),
          updated_at: new Date(setlist.updated_at),
          songs: formattedSongs
        });
      }

      console.log('Loaded setlists:', setlistsWithSongs.length);
      return setlistsWithSongs;
    } catch (error) {
      console.error('Error loading setlists:', error);
      toast({
        title: "Error loading setlists",
        description: "Could not load setlists from database.",
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  return { loadSetlists };
};
