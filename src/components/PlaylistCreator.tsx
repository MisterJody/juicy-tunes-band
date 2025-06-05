
import React, { useState } from 'react';
import { Song } from '@/pages/Index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Music } from 'lucide-react';

interface PlaylistCreatorProps {
  songs: Song[];
  onCreatePlaylist: (name: string, songIds: string[]) => void;
}

export const PlaylistCreator = ({ songs, onCreatePlaylist }: PlaylistCreatorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  // Compatible keys mapping (Circle of Fifths)
  const getCompatibleKeys = (key: string): string[] => {
    const keyCompatibility: { [key: string]: string[] } = {
      'C': ['C', 'F', 'G', 'Am', 'Dm', 'Em'],
      'G': ['G', 'C', 'D', 'Em', 'Am', 'Bm'],
      'D': ['D', 'G', 'A', 'Bm', 'Em', 'F#m'],
      'A': ['A', 'D', 'E', 'F#m', 'Bm', 'C#m'],
      'E': ['E', 'A', 'B', 'C#m', 'F#m', 'G#m'],
      'B': ['B', 'E', 'F#', 'G#m', 'C#m', 'D#m'],
      'F#': ['F#', 'B', 'C#', 'D#m', 'G#m', 'A#m'],
      'F': ['F', 'Bb', 'C', 'Dm', 'Gm', 'Am'],
    };
    
    return keyCompatibility[key] || [key];
  };

  const handleKeySelect = (key: string) => {
    setSelectedKey(key);
    const compatibleKeys = getCompatibleKeys(key);
    const compatibleSongs = songs
      .filter(song => song.key && compatibleKeys.some(compat => song.key?.includes(compat)))
      .map(song => song.id);
    setSelectedSongs(compatibleSongs);
  };

  const handleCreatePlaylist = () => {
    if (playlistName && selectedSongs.length > 0) {
      onCreatePlaylist(playlistName, selectedSongs);
      setPlaylistName('');
      setSelectedSongs([]);
      setSelectedKey('');
      setIsOpen(false);
    }
  };

  const availableKeys = Array.from(new Set(songs.map(song => song.key).filter(Boolean)));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Key-Compatible Playlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Key-Compatible Playlist
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Playlist Name</label>
            <Input
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Base Key</label>
            <div className="flex flex-wrap gap-2">
              {availableKeys.map((key) => (
                <Badge
                  key={key}
                  variant={selectedKey === key ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    selectedKey === key 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  }`}
                  onClick={() => handleKeySelect(key!)}
                >
                  {key}
                </Badge>
              ))}
            </div>
          </div>

          {selectedSongs.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Compatible Songs ({selectedSongs.length})
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2 bg-gray-800 rounded-lg p-3">
                {songs
                  .filter(song => selectedSongs.includes(song.id))
                  .map(song => (
                    <div key={song.id} className="flex items-center space-x-3 text-sm">
                      <Music className="w-4 h-4 text-purple-400" />
                      <span>{song.title} - {song.artist}</span>
                      <Badge variant="outline" className="text-xs border-orange-400 text-orange-400">
                        {song.key}
                      </Badge>
                      {song.tempo && (
                        <Badge variant="outline" className="text-xs border-pink-400 text-pink-400">
                          {song.tempo} BPM
                        </Badge>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          <Button
            onClick={handleCreatePlaylist}
            disabled={!playlistName || selectedSongs.length === 0}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            Create Playlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
