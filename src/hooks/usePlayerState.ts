
import { useState, useEffect } from 'react';
import { Song } from '@/pages/Index';

export const usePlayerState = (songs: Song[]) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (songs.length > 0 && !currentSong) {
      setCurrentSong(songs[0]);
    }
  }, [songs, currentSong]);

  const handleSongSelect = (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const updateCurrentSong = (updatedSong: Song) => {
    if (currentSong?.id === updatedSong.id) {
      setCurrentSong(updatedSong);
    }
  };

  const handleSongOrAlbumDelete = (songId?: string, albumName?: string) => {
    if (currentSong && (currentSong.id === songId || currentSong.album === albumName)) {
      const remainingSongs = songs.filter(song => 
        song.id !== songId && song.album !== albumName
      );
      setCurrentSong(remainingSongs.length > 0 ? remainingSongs[0] : null);
      setIsPlaying(false);
    }
  };

  return {
    currentSong,
    isPlaying,
    setIsPlaying,
    handleSongSelect,
    updateCurrentSong,
    handleSongOrAlbumDelete
  };
};
