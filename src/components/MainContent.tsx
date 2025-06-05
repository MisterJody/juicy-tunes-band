import React, { useState, useMemo } from 'react';
import { Song } from '@/pages/Index';
import { EditSongModal } from '@/components/EditSongModal';
import { FilterControls } from '@/components/FilterControls';
import { PlaylistCreator } from '@/components/PlaylistCreator';
import { AlbumGrid } from '@/components/AlbumGrid';
import { RecentlyAdded } from '@/components/RecentlyAdded';
import { SongList } from '@/components/SongList';
import { useToast } from '@/hooks/use-toast';

interface MainContentProps {
  songs: Song[];
  onSongSelect: (song: Song) => void;
  currentSong: Song | null;
  onSongUpdate: (updatedSong: Song) => void;
  onSongDelete: (songId: string) => void;
  onAlbumDelete: (albumName: string) => void;
  onReanalyzeSong?: (song: Song) => void;
  analyzingSongs?: Set<string>;
}

export const MainContent = ({ 
  songs, 
  onSongSelect, 
  currentSong, 
  onSongUpdate, 
  onSongDelete, 
  onAlbumDelete,
  onReanalyzeSong,
  analyzingSongs = new Set()
}: MainContentProps) => {
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [keyFilter, setKeyFilter] = useState('all');
  const [tempoFilter, setTempoFilter] = useState('all');
  const [sortField, setSortField] = useState('uploadDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const { toast } = useToast();

  // Filter and sort songs
  const filteredAndSortedSongs = useMemo(() => {
    const filtered = songs.filter(song => {
      // Key filter
      if (keyFilter !== 'all' && (!song.key || !song.key.includes(keyFilter))) {
        return false;
      }
      
      // Tempo filter
      if (tempoFilter !== 'all' && song.tempo) {
        const tempo = song.tempo;
        switch (tempoFilter) {
          case '60-90':
            if (tempo < 60 || tempo > 90) return false;
            break;
          case '90-120':
            if (tempo < 90 || tempo > 120) return false;
            break;
          case '120-150':
            if (tempo < 120 || tempo > 150) return false;
            break;
          case '150+':
            if (tempo < 150) return false;
            break;
        }
      }
      
      return true;
    });

    // Sort songs
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;
      
      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'artist':
          aValue = a.artist.toLowerCase();
          bValue = b.artist.toLowerCase();
          break;
        case 'tempo':
          aValue = a.tempo || 0;
          bValue = b.tempo || 0;
          break;
        case 'key':
          aValue = a.key || '';
          bValue = b.key || '';
          break;
        case 'uploadDate':
        default:
          aValue = a.uploadDate.getTime();
          bValue = b.uploadDate.getTime();
          break;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [songs, keyFilter, tempoFilter, sortField, sortDirection]);

  const handleDeleteSong = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${song.title}"?`)) {
      onSongDelete(song.id);
    }
  };

  const handleDeleteAlbum = (albumName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const songsInAlbum = songs.filter(song => song.album === albumName);
    if (confirm(`Are you sure you want to delete the album "${albumName}" and all ${songsInAlbum.length} songs in it?`)) {
      onAlbumDelete(albumName);
    }
  };

  const handleEditSong = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSong(song);
  };

  const handleReanalyzeSong = (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReanalyzeSong && !analyzingSongs.has(song.id)) {
      onReanalyzeSong(song);
      toast({
        title: "Re-analysis started",
        description: `"${song.title}" is being re-analyzed.`,
      });
    }
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  };

  const handleCreatePlaylist = (name: string, songIds: string[]) => {
    // For now, just show a toast - in a real app you'd save this to a database
    toast({
      title: "Playlist created!",
      description: `"${name}" playlist created with ${songIds.length} songs.`,
    });
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-gray-900 via-purple-900/20 to-black p-6 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Good evening
        </h1>
        <p className="text-gray-300">Welcome back to TheBandJuicy studio</p>
      </div>

      {/* Filter Controls */}
      <FilterControls
        onFilterByKey={setKeyFilter}
        onFilterByTempo={setTempoFilter}
        onSort={handleSort}
        currentKeyFilter={keyFilter}
        currentTempoFilter={tempoFilter}
        sortField={sortField}
        sortDirection={sortDirection}
      />

      {/* Playlist Creator */}
      <div className="mb-8">
        <PlaylistCreator
          songs={songs}
          onCreatePlaylist={handleCreatePlaylist}
        />
      </div>

      {/* Albums Section */}
      <AlbumGrid songs={songs} onDeleteAlbum={handleDeleteAlbum} />

      {/* Recently Added Section */}
      <RecentlyAdded
        songs={filteredAndSortedSongs}
        currentSong={currentSong}
        keyFilter={keyFilter}
        tempoFilter={tempoFilter}
        onSongSelect={onSongSelect}
        onEditSong={handleEditSong}
        onDeleteSong={handleDeleteSong}
      />

      {/* All Tracks List */}
      <SongList
        songs={filteredAndSortedSongs}
        currentSong={currentSong}
        onSongSelect={onSongSelect}
        onEditSong={handleEditSong}
        onDeleteSong={handleDeleteSong}
        onReanalyzeSong={handleReanalyzeSong}
        analyzingSongs={analyzingSongs}
      />

      {editingSong && (
        <EditSongModal
          song={editingSong}
          onClose={() => setEditingSong(null)}
          onSave={onSongUpdate}
        />
      )}
    </div>
  );
};
