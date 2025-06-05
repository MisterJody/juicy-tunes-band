
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SetlistSong } from '@/types/setlist';
import { SongItem } from './SongItem';

interface SetCardProps {
  setNumber: number;
  songs: SetlistSong[];
  draggedItem: string | null;
  dragOverItem: string | null;
  onDragStart: (e: React.DragEvent, songId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, songId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetSongId: string, setNumber: number) => void;
  onRemoveSong: (setlistSongId: string) => void;
  onSongClick?: (setlistSong: SetlistSong) => void;
}

export const SetCard = ({
  setNumber,
  songs,
  draggedItem,
  dragOverItem,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveSong,
  onSongClick
}: SetCardProps) => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm mr-3">
            Set {setNumber}
          </span>
          {songs.length} song{songs.length !== 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {songs.map((setlistSong) => (
            <SongItem
              key={setlistSong.id}
              setlistSong={setlistSong}
              draggedItem={draggedItem}
              dragOverItem={dragOverItem}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onRemove={onRemoveSong}
              onSongClick={onSongClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
