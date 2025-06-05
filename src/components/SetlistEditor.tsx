import React, { useState } from 'react';
import { AddSongToSetlistModal } from './AddSongToSetlistModal';
import { useSetlists } from '@/hooks/useSetlists';
import { SetlistWithSongs, SetlistSong } from '@/types/setlist';
import { Song } from '@/pages/Index';
import { SetlistHeader } from './SetlistHeader';
import { SetCard } from './SetCard';
import { EmptySetlist } from './EmptySetlist';

interface SetlistEditorProps {
  setlist: SetlistWithSongs;
  songs: Song[];
  onBack: () => void;
  onSongSelect?: (song: Song) => void;
}

export const SetlistEditor = ({ setlist, songs, onBack, onSongSelect }: SetlistEditorProps) => {
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const { removeSongFromSetlist, updateSetlistSongPosition } = useSetlists();

  // Group songs by set number
  const songsBySet = setlist.songs.reduce((acc, setlistSong) => {
    if (!acc[setlistSong.set_number]) {
      acc[setlistSong.set_number] = [];
    }
    acc[setlistSong.set_number].push(setlistSong);
    return acc;
  }, {} as Record<number, SetlistSong[]>);

  // Sort sets and songs within each set
  const sortedSets = Object.keys(songsBySet)
    .map(Number)
    .sort((a, b) => a - b);

  sortedSets.forEach(setNum => {
    songsBySet[setNum].sort((a, b) => a.position - b.position);
  });

  const handleRemoveSong = async (setlistSongId: string) => {
    if (confirm('Remove this song from the setlist?')) {
      await removeSongFromSetlist(setlistSongId);
      // Real-time subscription will handle the UI update
    }
  };

  const handleSongClick = (setlistSong: SetlistSong) => {
    if (setlistSong.song && onSongSelect) {
      onSongSelect(setlistSong.song);
    }
  };

  const handleDragStart = (e: React.DragEvent, songId: string) => {
    console.log('Drag start:', songId);
    setDraggedItem(songId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', songId);
  };

  const handleDragEnd = () => {
    console.log('Drag end');
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent, songId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && draggedItem !== songId) {
      setDragOverItem(songId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      setDragOverItem(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetSongId: string, setNumber: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop:', { draggedItem, targetSongId, setNumber });
    
    if (!draggedItem || draggedItem === targetSongId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const setlistSongs = [...songsBySet[setNumber]];
    const draggedIndex = setlistSongs.findIndex(song => song.id === draggedItem);
    const targetIndex = setlistSongs.findIndex(song => song.id === targetSongId);

    console.log('Indices:', { draggedIndex, targetIndex });

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const reorderedSongs = [...setlistSongs];
    const [draggedSong] = reorderedSongs.splice(draggedIndex, 1);
    reorderedSongs.splice(targetIndex, 0, draggedSong);

    console.log('Reordered songs:', reorderedSongs.map((s, index) => ({ id: s.id, oldPosition: s.position, newPosition: index + 1 })));

    try {
      for (let i = 0; i < reorderedSongs.length; i++) {
        const song = reorderedSongs[i];
        const newPosition = i + 1;
        console.log(`Updating ${song.id} to position ${newPosition}`);
        await updateSetlistSongPosition(song.id, setNumber, newPosition);
      }

      console.log('All position updates complete, real-time will handle UI refresh...');
    } catch (error) {
      console.error('Error reordering songs:', error);
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <div className="p-6">
      <SetlistHeader
        setlist={setlist}
        onBack={onBack}
        onAddSong={() => setShowAddSongModal(true)}
      />

      {setlist.description && (
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-300">{setlist.description}</p>
        </div>
      )}

      {sortedSets.length === 0 ? (
        <EmptySetlist onAddSong={() => setShowAddSongModal(true)} />
      ) : (
        <div className="space-y-6">
          {sortedSets.map(setNumber => (
            <SetCard
              key={setNumber}
              setNumber={setNumber}
              songs={songsBySet[setNumber]}
              draggedItem={draggedItem}
              dragOverItem={dragOverItem}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onRemoveSong={handleRemoveSong}
              onSongClick={handleSongClick}
            />
          ))}
        </div>
      )}

      {showAddSongModal && (
        <AddSongToSetlistModal
          setlist={setlist}
          songs={songs}
          onClose={() => setShowAddSongModal(false)}
        />
      )}
    </div>
  );
};
