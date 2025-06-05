
import React from 'react';
import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SetlistSong } from '@/types/setlist';
import { LyricsButton } from './LyricsButton';

interface SongItemProps {
  setlistSong: SetlistSong;
  draggedItem: string | null;
  dragOverItem: string | null;
  onDragStart: (e: React.DragEvent, songId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, songId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetSongId: string, setNumber: number) => void;
  onRemove: (setlistSongId: string) => void;
  onSongClick?: (setlistSong: SetlistSong) => void;
}

export const SongItem = ({
  setlistSong,
  draggedItem,
  dragOverItem,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  onSongClick
}: SongItemProps) => {
  const song = setlistSong.song;
  if (!song) return null;

  const formatDuration = (duration: string) => {
    return duration;
  };

  const isDragging = draggedItem === setlistSong.id;
  const isDragOver = dragOverItem === setlistSong.id;

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click if user is clicking on action buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    if (onSongClick) {
      onSongClick(setlistSong);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart(e, setlistSong.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(e, setlistSong.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(e, setlistSong.id, setlistSong.set_number);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragLeave(e);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-200 group cursor-pointer ${
        isDragging
          ? 'bg-gray-600 shadow-lg opacity-50 scale-95'
          : isDragOver
          ? 'bg-gray-700/80 border-2 border-purple-500/50'
          : 'hover:bg-gray-700/50'
      }`}
    >
      <div className="flex items-center text-gray-400 cursor-move">
        <GripVertical className="w-4 h-4 mr-2" />
        <span className="w-6 text-center font-medium">
          {setlistSong.position}
        </span>
      </div>

      <img
        src={song.albumArt}
        alt={song.album}
        className="w-10 h-10 rounded object-cover"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="font-medium text-white truncate">{song.title}</p>
          <LyricsButton song={song} variant="ghost" size="sm" />
        </div>
        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
      </div>

      <div className="text-gray-400 text-sm">{song.album}</div>
      
      {song.key && (
        <div className="text-orange-400 text-sm font-medium">{song.key}</div>
      )}
      
      {song.tempo && (
        <div className="text-pink-400 text-sm font-medium">{song.tempo} BPM</div>
      )}

      <div className="text-gray-400 text-sm w-12 text-right">
        {formatDuration(song.duration)}
      </div>

      <Button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(setlistSong.id);
        }}
        size="sm"
        variant="ghost"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 w-8 h-8 p-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};
