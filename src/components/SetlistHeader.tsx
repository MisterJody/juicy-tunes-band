
import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SetlistWithSongs } from '@/types/setlist';

interface SetlistHeaderProps {
  setlist: SetlistWithSongs;
  onBack: () => void;
  onAddSong: () => void;
}

export const SetlistHeader = ({ setlist, onBack, onAddSong }: SetlistHeaderProps) => {
  return (
    <div className="flex items-center mb-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mr-4 text-gray-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Setlists
      </Button>
      <div className="flex-1">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {setlist.name}
        </h1>
        {setlist.gig_name && (
          <p className="text-purple-400 mt-1">{setlist.gig_name}</p>
        )}
        {setlist.gig_date && (
          <p className="text-gray-400 text-sm mt-1">
            {new Date(setlist.gig_date).toLocaleDateString()}
          </p>
        )}
      </div>
      <Button
        onClick={onAddSong}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Song
      </Button>
    </div>
  );
};
