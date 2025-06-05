
import { Song } from '@/pages/Index';

export const shouldAnalyzeSong = (song: Song, analyzingSongs: Set<string>): boolean => {
  return song.audioFile !== '' && 
         !analyzingSongs.has(song.id) && 
         (!song.tempo || !song.key);
};

export const filterUnanalyzedSongs = (songs: Song[], analyzingSongs: Set<string>): Song[] => {
  return songs.filter(song => shouldAnalyzeSong(song, analyzingSongs));
};

export const createAnalyzingSongsManager = () => {
  const addSong = (prev: Set<string>, songId: string): Set<string> => {
    return new Set(prev).add(songId);
  };

  const removeSong = (prev: Set<string>, songId: string): Set<string> => {
    const newSet = new Set(prev);
    newSet.delete(songId);
    return newSet;
  };

  return { addSong, removeSong };
};
