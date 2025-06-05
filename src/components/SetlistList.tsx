
import React from 'react';
import { Calendar, Music, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SetlistWithSongs } from '@/types/setlist';

interface SetlistListProps {
  setlists: SetlistWithSongs[];
  isLoading: boolean;
  onSelectSetlist: (setlist: SetlistWithSongs) => void;
  onDeleteSetlist: (setlistId: string) => void;
}

export const SetlistList = ({ setlists, isLoading, onSelectSetlist, onDeleteSetlist }: SetlistListProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading setlists...</div>
      </div>
    );
  }

  if (setlists.length === 0) {
    return (
      <div className="text-center py-12">
        <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">No setlists yet</h3>
        <p className="text-gray-500">Create your first setlist to get started</p>
      </div>
    );
  }

  const handleDeleteClick = (e: React.MouseEvent, setlistId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this setlist?')) {
      onDeleteSetlist(setlistId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {setlists.map((setlist) => {
        const totalSongs = setlist.songs.length;
        const setNumbers = [...new Set(setlist.songs.map(s => s.set_number))].sort();
        
        return (
          <Card key={setlist.id} className="bg-gray-800 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer group">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-white text-lg truncate">{setlist.name}</CardTitle>
                  {setlist.gig_name && (
                    <p className="text-purple-400 text-sm mt-1 truncate">{setlist.gig_name}</p>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 ml-2">
                  <Button
                    onClick={() => onSelectSetlist(setlist)}
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 text-purple-400 hover:text-purple-300"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={(e) => handleDeleteClick(e, setlist.id)}
                    size="sm"
                    variant="ghost"
                    className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent onClick={() => onSelectSetlist(setlist)}>
              <div className="space-y-3">
                {setlist.gig_date && (
                  <div className="flex items-center text-gray-400 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(setlist.gig_date).toLocaleDateString()}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {totalSongs} song{totalSongs !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-400">
                    {setNumbers.length} set{setNumbers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {setlist.description && (
                  <p className="text-gray-500 text-sm line-clamp-2">{setlist.description}</p>
                )}

                {setNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {setNumbers.map(setNum => {
                      const songsInSet = setlist.songs.filter(s => s.set_number === setNum).length;
                      return (
                        <span 
                          key={setNum}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded"
                        >
                          Set {setNum}: {songsInSet}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
