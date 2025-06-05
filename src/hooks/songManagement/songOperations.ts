import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Song } from '@/pages/Index';

export const useSongOperations = () => {
  const { toast } = useToast();

  const createSong = async (newSong: Omit<Song, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .insert({
          title: newSong.title,
          artist: newSong.artist,
          album: newSong.album,
          duration: newSong.duration,
          album_art_url: newSong.albumArt,
          audio_file_url: newSong.audioFile,
          song_key: newSong.key,
          tempo: newSong.tempo,
          lyrics_text: newSong.lyricsText,
          lyrics_file_url: newSong.lyricsFileUrl,
          has_lyrics: newSong.hasLyrics || false
        })
        .select()
        .single();

      if (error) {
        console.error('Error uploading song:', error);
        toast({
          title: "Upload failed",
          description: "Could not save song to database.",
          variant: "destructive",
        });
        return null;
      }

      const song: Song = {
        id: data.id,
        title: data.title,
        artist: data.artist,
        album: data.album,
        duration: data.duration,
        albumArt: data.album_art_url || newSong.albumArt,
        audioFile: data.audio_file_url || newSong.audioFile,
        uploadDate: new Date(data.upload_date),
        key: data.song_key || undefined,
        tempo: data.tempo || undefined,
        lyricsText: data.lyrics_text || undefined,
        lyricsFileUrl: data.lyrics_file_url || undefined,
        hasLyrics: data.has_lyrics || false
      };

      return song;
    } catch (error) {
      console.error('Error uploading song:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the song.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSong = async (updatedSong: Song) => {
    try {
      const { error } = await supabase
        .from('songs')
        .update({
          title: updatedSong.title,
          artist: updatedSong.artist,
          album: updatedSong.album,
          duration: updatedSong.duration,
          album_art_url: updatedSong.albumArt,
          audio_file_url: updatedSong.audioFile,
          song_key: updatedSong.key,
          tempo: updatedSong.tempo,
          lyrics_text: updatedSong.lyricsText,
          lyrics_file_url: updatedSong.lyricsFileUrl,
          has_lyrics: updatedSong.hasLyrics || false
        })
        .eq('id', updatedSong.id);

      if (error) {
        console.error('Error updating song:', error);
        toast({
          title: "Update failed",
          description: "Could not update song in database.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Song updated successfully!",
        description: `"${updatedSong.title}" has been updated.`,
      });
      return true;
    } catch (error) {
      console.error('Error updating song:', error);
      return false;
    }
  };

  const deleteSong = async (songId: string, songTitle: string) => {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) {
        console.error('Error deleting song:', error);
        toast({
          title: "Delete failed",
          description: "Could not delete song from database.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Song deleted",
        description: `"${songTitle}" has been removed from your library.`,
        variant: "destructive",
      });
      return true;
    } catch (error) {
      console.error('Error deleting song:', error);
      return false;
    }
  };

  const deleteAlbum = async (albumName: string, songCount: number) => {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('album', albumName);

      if (error) {
        console.error('Error deleting album:', error);
        toast({
          title: "Delete failed",
          description: "Could not delete album from database.",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Album deleted",
        description: `Album "${albumName}" and ${songCount} songs have been removed.`,
        variant: "destructive",
      });
      return true;
    } catch (error) {
      console.error('Error deleting album:', error);
      return false;
    }
  };

  return {
    createSong,
    updateSong,
    deleteSong,
    deleteAlbum
  };
};
