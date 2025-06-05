import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SetlistList } from './SetlistList';
import { SetlistEditor } from './SetlistEditor';
import { useSetlists } from '@/hooks/useSetlists';
import { SetlistWithSongs } from '@/types/setlist';
import { Song } from '@/pages/Index';

interface SetlistManagerProps {
  songs: Song[];
  onSongSelect?: (song: Song) => void;
  selectedSetlistId?: string;
}

export const SetlistManager = ({ songs, onSongSelect, selectedSetlistId }: SetlistManagerProps) => {
  const navigate = useNavigate();
  const [selectedSetlist, setSelectedSetlist] = useState<SetlistWithSongs | null>(null);
  
  const { setlists, isLoading, deleteSetlist, loadSetlists } = useSetlists();

  // Update selectedSetlist when setlists change or when selectedSetlistId changes
  useEffect(() => {
    if (selectedSetlistId && setlists.length > 0) {
      const setlist = setlists.find(setlist => setlist.id === selectedSetlistId);
      if (setlist) {
        console.log('Setting selected setlist from URL:', setlist.name);
        setSelectedSetlist(setlist);
      } else {
        // Setlist not found, navigate back to setlists list
        console.log('Setlist not found, navigating back to list...');
        navigate('/setlists');
        setSelectedSetlist(null);
      }
    } else if (!selectedSetlistId) {
      setSelectedSetlist(null);
    }
  }, [selectedSetlistId, setlists, navigate]);

  // Update selectedSetlist when setlists change to keep it in sync
  useEffect(() => {
    if (selectedSetlist && setlists.length > 0) {
      const updatedSetlist = setlists.find(setlist => setlist.id === selectedSetlist.id);
      if (updatedSetlist) {
        console.log('Updating selected setlist with new data...');
        setSelectedSetlist(updatedSetlist);
      } else if (!selectedSetlistId) {
        // Setlist was deleted and we're not in a URL-based view
        console.log('Selected setlist no longer exists, going back to list...');
        setSelectedSetlist(null);
      }
    }
  }, [setlists, selectedSetlist, selectedSetlistId]);

  const handleSetlistSelect = (setlist: SetlistWithSongs) => {
    navigate(`/setlists/${setlist.id}`);
  };

  const handleBack = () => {
    navigate('/setlists');
  };

  const handleDeleteSetlist = async (setlistId: string) => {
    const success = await deleteSetlist(setlistId);
    if (success && selectedSetlist?.id === setlistId) {
      navigate('/setlists');
    }
  };

  if (selectedSetlist) {
    return (
      <SetlistEditor 
        setlist={selectedSetlist} 
        songs={songs} 
        onBack={handleBack}
        onSongSelect={onSongSelect}
      />
    );
  }

  return (
    <SetlistList 
      setlists={setlists} 
      isLoading={isLoading}
      onSelectSetlist={handleSetlistSelect}
      onDeleteSetlist={handleDeleteSetlist}
    />
  );
};
