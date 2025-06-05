
import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSetlists } from '@/hooks/useSetlists';
import { SetlistWithSongs } from '@/types/setlist';
import { Song } from '@/pages/Index';

interface AddSongToSetlistModalProps {
  setlist: SetlistWithSongs;
  songs: Song[];
  onClose: () => void;
}

export const AddSongToSetlistModal = ({ setlist, songs, onClose }: AddSongToSetlistModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [setNumber, setSetNumber] = useState<string>('1');
  const [position, setPosition] = useState<string>('');
  const { addSongToSetlist, loadSetlists } = useSetlists();

  // Filter songs based on search term and exclude already added songs
  const addedSongIds = new Set(setlist.songs.map(s => s.song_id));
  const filteredSongs = songs.filter(song => 
    !addedSongIds.has(song.id) &&
    (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
     song.album.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get existing sets and calculate next position
  const existingSets = [...new Set(setlist.songs.map(s => s.set_number))].sort();
  const maxSet = Math.max(0, ...existingSets);
  const suggestedSet = existingSets.length === 0 ? 1 : maxSet;

  // Calculate next position for selected set
  const songsInSelectedSet = setlist.songs.filter(s => s.set_number === parseInt(setNumber));
  const maxPosition = Math.max(0, ...songsInSelectedSet.map(s => s.position));
  const suggestedPosition = maxPosition + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSong) return;

    const finalPosition = position ? parseInt(position) : suggestedPosition;
    
    const success = await addSongToSetlist(
      setlist.id,
      selectedSong.id,
      parseInt(setNumber),
      finalPosition
    );

    if (success) {
      await loadSetlists();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-700">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">Add Song to Setlist</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-6 space-y-4 flex-1">
              {/* Search */}
              <div>
                <Label htmlFor="search" className="text-white">Search Songs</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by title, artist, or album..."
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Song Selection */}
              <div>
                <Label className="text-white">Select Song</Label>
                <div className="mt-2 max-h-64 overflow-y-auto border border-gray-600 rounded-md bg-gray-800">
                  {filteredSongs.length === 0 ? (
                    <div className="p-4 text-center text-gray-400">
                      {searchTerm ? 'No songs match your search' : 'All songs are already in the setlist'}
                    </div>
                  ) : (
                    filteredSongs.map(song => (
                      <div
                        key={song.id}
                        onClick={() => setSelectedSong(song)}
                        className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-700 transition-colors ${
                          selectedSong?.id === song.id ? 'bg-purple-500/20 border-l-4 border-purple-500' : ''
                        }`}
                      >
                        <img
                          src={song.albumArt}
                          alt={song.album}
                          className="w-10 h-10 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{song.title}</p>
                          <p className="text-gray-400 text-sm truncate">{song.artist} - {song.album}</p>
                        </div>
                        {song.key && (
                          <span className="text-orange-400 text-sm">{song.key}</span>
                        )}
                        {song.tempo && (
                          <span className="text-pink-400 text-sm">{song.tempo} BPM</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Set and Position */}
              {selectedSong && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="set" className="text-white">Set Number</Label>
                    <Select value={setNumber} onValueChange={setSetNumber}>
                      <SelectTrigger className="mt-1 bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        {[...Array(maxSet + 2)].map((_, i) => (
                          <SelectItem key={i + 1} value={(i + 1).toString()}>
                            Set {i + 1} {i < maxSet ? `(${songsInSelectedSet.length} songs)` : '(new)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="position" className="text-white">Position</Label>
                    <Input
                      id="position"
                      type="number"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      placeholder={`Auto (${suggestedPosition})`}
                      min="1"
                      className="mt-1 bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Fixed Footer with Buttons */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-700 flex-shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={!selectedSong}
              >
                Add to Setlist
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
