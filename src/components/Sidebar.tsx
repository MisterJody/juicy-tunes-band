
import React from 'react';
import { Song } from '@/pages/Index';
import { Music, Play } from 'lucide-react';

interface SidebarProps {
  songs: Song[];
  onSongSelect: (song: Song) => void;
}

export const Sidebar = ({ songs, onSongSelect }: SidebarProps) => {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-200">Recent Uploads</h2>
        <div className="space-y-2">
          {songs
            .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
            .slice(0, 5)
            .map((song) => (
              <div
                key={song.id}
                onClick={() => onSongSelect(song)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors duration-200 group"
              >
                <div className="relative">
                  <img
                    src={song.albumArt}
                    alt={song.album}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Play className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{song.title}</p>
                  <p className="text-gray-400 text-xs truncate">{song.album}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-200">All Albums</h2>
        <div className="space-y-2">
          {Array.from(new Set(songs.map(song => song.album))).map((album) => (
            <div key={album} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors duration-200">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-300 text-sm">{album}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
