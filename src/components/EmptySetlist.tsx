
import React from 'react';
import { Music, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptySetlistProps {
  onAddSong: () => void;
}

export const EmptySetlist = ({ onAddSong }: EmptySetlistProps) => {
  return (
    <div className="text-center py-12">
      <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-300 mb-2">No songs in this setlist</h3>
      <p className="text-gray-500 mb-4">Add songs to get started</p>
      <Button
        onClick={onAddSong}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add First Song
      </Button>
    </div>
  );
};
