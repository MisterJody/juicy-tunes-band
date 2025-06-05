
import React from 'react';
import { Song } from '@/pages/Index';
import { EnhancedSongCard } from '@/components/EnhancedSongCard';

interface RecentlyAddedProps {
  songs: Song[];
  currentSong: Song | null;
  keyFilter: string;
  tempoFilter: string;
  onSongSelect: (song: Song) => void;
  onEditSong: (song: Song, e: React.MouseEvent) => void;
  onDeleteSong: (song: Song, e: React.MouseEvent) => void;
}

export const RecentlyAdded = ({ 
  songs, 
  currentSong, 
  keyFilter, 
  tempoFilter, 
  onSongSelect, 
  onEditSong, 
  onDeleteSong 
}: RecentlyAddedProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
        {keyFilter !== 'all' || tempoFilter !== 'all' ? 'Filtered Songs' : 'Recently Added'}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {songs
          .slice(0, 10)
          .map((song) => (
            <EnhancedSongCard
              key={song.id}
              song={song}
              isCurrentSong={currentSong?.id === song.id}
              onSongSelect={onSongSelect}
              onEdit={onEditSong}
              onDelete={onDeleteSong}
            />
          ))}
      </div>
    </div>
  );
};
