
import React from 'react';
import { Song } from '@/pages/Index';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface AlbumGridProps {
  songs: Song[];
  onDeleteAlbum: (albumName: string, e: React.MouseEvent) => void;
}

export const AlbumGrid = ({ songs, onDeleteAlbum }: AlbumGridProps) => {
  const albums = Array.from(new Set(songs.map(song => song.album)));

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">Albums</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {albums.map((albumName) => {
          const albumSongs = songs.filter(song => song.album === albumName);
          const albumArt = albumSongs[0]?.albumArt;
          return (
            <div
              key={albumName}
              className="bg-gradient-to-br from-gray-800/80 to-purple-800/30 rounded-lg p-4 hover:from-gray-700/80 hover:to-pink-800/30 transition-all duration-300 cursor-pointer group border border-purple-500/20 relative"
            >
              <Button
                onClick={(e) => onDeleteAlbum(albumName, e)}
                className="absolute top-2 right-2 w-6 h-6 p-0 bg-red-500/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              
              <div className="relative mb-4">
                <img
                  src={albumArt}
                  alt={albumName}
                  className="w-full aspect-square object-cover rounded-lg shadow-lg"
                />
              </div>
              <h3 className="font-semibold text-white truncate mb-1">{albumName}</h3>
              <p className="text-gray-400 text-sm">{albumSongs.length} song{albumSongs.length !== 1 ? 's' : ''}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
