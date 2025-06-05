import React from 'react';
import { Song } from '@/pages/Index';
import { Music, Edit, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LyricsButton } from '@/components/LyricsButton';

interface SongListProps {
  songs: Song[];
  currentSong: Song | null;
  onSongSelect: (song: Song) => void;
  onEditSong: (song: Song, e: React.MouseEvent) => void;
  onDeleteSong: (song: Song, e: React.MouseEvent) => void;
  onReanalyzeSong?: (song: Song, e: React.MouseEvent) => void;
  analyzingSongs?: Set<string>;
}

export const SongList = ({ 
  songs, 
  currentSong, 
  onSongSelect, 
  onEditSong, 
  onDeleteSong,
  onReanalyzeSong,
  analyzingSongs = new Set()
}: SongListProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        All Tracks ({songs.length})
      </h2>
      <div className="space-y-2">
        {songs.map((song, index) => (
          <div
            key={song.id}
            onClick={() => onSongSelect(song)}
            className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-pink-800/30 cursor-pointer transition-all duration-200 group border border-transparent hover:border-purple-500/30 ${
              currentSong?.id === song.id ? 'bg-gradient-to-r from-purple-800/40 to-pink-800/40 border-purple-500/50' : ''
            }`}
          >
            <div className="w-8 text-gray-400 text-sm font-medium">
              {currentSong?.id === song.id ? (
                <Music className="w-4 h-4 text-orange-400" />
              ) : (
                index + 1
              )}
            </div>
            <img
              src={song.albumArt}
              alt={song.album}
              className="w-12 h-12 rounded object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className={`font-medium truncate ${
                currentSong?.id === song.id ? 'text-orange-400' : 'text-white'
              }`}>
                {song.title}
              </p>
              <p className="text-gray-400 text-sm truncate">{song.artist}</p>
            </div>
            <div className="text-gray-400 text-sm">{song.album}</div>
            {song.key && (
              <div className="text-orange-400 text-sm font-medium">{song.key}</div>
            )}
            {song.tempo && (
              <div className="text-pink-400 text-sm font-medium">{song.tempo} BPM</div>
            )}
            <div className="text-gray-400 text-sm">{song.uploadDate.toLocaleDateString()}</div>
            <div className="text-gray-400 text-sm w-12 text-right">{song.duration}</div>
            
            {/* Analysis status indicator */}
            {analyzingSongs.has(song.id) && (
              <div className="text-blue-400 text-sm font-medium animate-pulse">Analyzing...</div>
            )}
            
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1">
              <LyricsButton song={song} />
              {onReanalyzeSong && (
                <Button
                  onClick={(e) => onReanalyzeSong(song, e)}
                  disabled={analyzingSongs.has(song.id)}
                  className="w-8 h-8 p-0 bg-blue-500/80 hover:bg-blue-600 text-white disabled:opacity-50"
                  title="Re-analyze audio"
                >
                  <RotateCcw className={`w-3 h-3 ${analyzingSongs.has(song.id) ? 'animate-spin' : ''}`} />
                </Button>
              )}
              <Button
                onClick={(e) => onEditSong(song, e)}
                className="w-8 h-8 p-0 bg-orange-500/80 hover:bg-orange-600 text-white"
              >
                <Edit className="w-3 h-3" />
              </Button>
              <Button
                onClick={(e) => onDeleteSong(song, e)}
                className="w-8 h-8 p-0 bg-red-500/80 hover:bg-red-600 text-white"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
