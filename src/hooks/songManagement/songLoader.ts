
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Song } from '@/pages/Index';

export const useSongLoader = () => {
  const { toast } = useToast();

  const loadSongs = async (): Promise<Song[]> => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error loading songs:', error);
        toast({
          title: "Error loading songs",
          description: "Could not load songs from database.",
          variant: "destructive",
        });
        return [];
      }

      const formattedSongs: Song[] = data.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        duration: song.duration,
        albumArt: song.album_art_url || 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=300&fit=crop',
        audioFile: song.audio_file_url || '',
        uploadDate: new Date(song.upload_date),
        key: song.song_key || undefined,
        tempo: song.tempo || undefined,
        lyricsText: song.lyrics_text || undefined,
        lyricsFileUrl: song.lyrics_file_url || undefined,
        hasLyrics: song.has_lyrics || false
      }));

      return formattedSongs;
    } catch (error) {
      console.error('Error loading songs:', error);
      return [];
    }
  };

  return { loadSongs };
};
