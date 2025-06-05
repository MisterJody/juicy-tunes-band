import React from 'react';
import { Song } from '@/pages/Index';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Edit, Trash2, Music } from 'lucide-react';
import { LyricsButton } from '@/components/LyricsButton';

interface EnhancedSongCardProps {
  song: Song;
  isCurrentSong?: boolean;
  onSongSelect: (song: Song) => void;
  onEdit: (song: Song, e: React.MouseEvent) => void;
  onDelete: (song: Song, e: React.MouseEvent) => void;
}

export const EnhancedSongCard = ({ 
  song, 
  isCurrentSong = false, 
  onSongSelect, 
  onEdit, 
  onDelete 
}: EnhancedSongCardProps) => {
  const getTempoColor = (tempo?: number) => {
    if (!tempo) return 'border-gray-500 text-gray-400';
    if (tempo < 90) return 'border-blue-400 text-blue-400';
    if (tempo < 120) return 'border-green-400 text-green-400';
    if (tempo < 150) return 'border-yellow-400 text-yellow-400';
    return 'border-red-400 text-red-400';
  };

  const getTempoLabel = (tempo?: number) => {
    if (!tempo) return 'Unknown';
    if (tempo < 90) return 'Slow';
    if (tempo < 120) return 'Medium';
    if (tempo < 150) return 'Fast';
    return 'Very Fast';
  };

  return (
    <div
      onClick={() => onSongSelect(song)}
      className="bg-gradient-to-br from-gray-800/80 to-purple-800/30 rounded-lg p-4 hover:from-gray-700/80 hover:to-pink-800/30 transition-all duration-300 cursor-pointer group border border-purple-500/20 relative"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
        <LyricsButton song={song} />
        <Button
          onClick={(e) => onEdit(song, e)}
          className="w-6 h-6 p-0 bg-orange-500/80 hover:bg-orange-600 text-white"
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          onClick={(e) => onDelete(song, e)}
          className="w-6 h-6 p-0 bg-red-500/80 hover:bg-red-600 text-white"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="relative mb-4">
        <img
          src={song.albumArt}
          alt={song.album}
          className="w-full aspect-square object-cover rounded-lg shadow-lg"
        />
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button className="w-12 h-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:from-orange-400 hover:to-pink-400 transition-colors duration-200">
            <Play className="w-5 h-5 text-white ml-1" />
          </button>
        </div>
        
        {/* Musical info overlay */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {song.key && (
            <Badge className="bg-orange-500/90 text-white text-xs px-2 py-1">
              {song.key}
            </Badge>
          )}
          {song.tempo && (
            <Badge className={`text-xs px-2 py-1 bg-black/70 ${getTempoColor(song.tempo)}`}>
              {song.tempo} BPM
            </Badge>
          )}
        </div>
      </div>

      <h3 className={`font-semibold text-white truncate mb-1 ${
        isCurrentSong ? 'text-orange-400' : ''
      }`}>
        {song.title}
      </h3>
      <p className="text-gray-400 text-sm truncate mb-2">{song.artist}</p>
      <p className="text-gray-500 text-xs">{song.album}</p>

      {/* Enhanced musical info */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-700/50">
        <div className="flex items-center space-x-2">
          <Music className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-400">{song.duration}</span>
        </div>
        {song.tempo && (
          <span className={`text-xs px-2 py-1 rounded border ${getTempoColor(song.tempo)}`}>
            {getTempoLabel(song.tempo)}
          </span>
        )}
      </div>
    </div>
  );
};
