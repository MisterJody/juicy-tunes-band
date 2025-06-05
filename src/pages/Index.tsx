
import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MainContent } from '@/components/MainContent';
import { MusicPlayer } from '@/components/MusicPlayer';
import { UploadModal } from '@/components/UploadModal';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AnalysisProgressIndicator } from '@/components/AnalysisProgressIndicator';
import { SetlistManager } from '@/components/SetlistManager';
import { useSongManagement } from '@/hooks/useSongManagement';
import { usePlayerState } from '@/hooks/usePlayerState';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  albumArt: string;
  audioFile: string;
  uploadDate: Date;
  key?: string;
  tempo?: number;
  lyricsText?: string;
  lyricsFileUrl?: string;
  hasLyrics?: boolean;
}

const Index = () => {
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Determine current view based on URL
  const currentView = location.pathname.startsWith('/setlists') ? 'setlists' : 'music';
  
  const {
    songs,
    isLoading,
    analyzingSongs,
    isProcessingQueue,
    analysisProgress,
    handleUploadSong,
    handleSongUpdate,
    handleSongDelete,
    handleAlbumDelete,
    handleReanalyzeSong,
    refreshSongs
  } = useSongManagement();

  const {
    currentSong,
    isPlaying,
    setIsPlaying,
    handleSongSelect,
    updateCurrentSong,
    handleSongOrAlbumDelete
  } = usePlayerState(songs);

  // Set up real-time sync only for songs (setlists have their own sync in SetlistManager)
  useRealtimeSync({
    onSongChange: () => {
      console.log('Real-time song change detected, refreshing...');
      refreshSongs();
    },
    onSetlistChange: () => {
      // This is handled by the SetlistManager's own real-time sync
      console.log('Real-time setlist change detected (handled by SetlistManager)');
    }
  });

  const handleViewChange = (view: 'music' | 'setlists') => {
    if (view === 'music') {
      navigate('/');
    } else {
      navigate('/setlists');
    }
  };

  const onSongUpdate = (updatedSong: Song) => {
    handleSongUpdate(updatedSong);
    updateCurrentSong(updatedSong);
  };

  const onSongDelete = (songId: string) => {
    handleSongDelete(songId);
    handleSongOrAlbumDelete(songId);
  };

  const onAlbumDelete = (albumName: string) => {
    handleAlbumDelete(albumName);
    handleSongOrAlbumDelete(undefined, albumName);
  };

  // Handle song selection from setlist (load song without auto-playing)
  const handleSetlistSongSelect = (song: Song) => {
    handleSongSelect(song);
    setIsPlaying(false); // Don't auto-play when selecting from setlist
  };

  const handleUploadComplete = async (song: Omit<Song, 'id'>) => {
    await handleUploadSong(song);
    // Close modal after upload
    setShowUploadModal(false);
    // Refresh data to ensure UI is in sync
    console.log('Upload complete, real-time will handle refresh...');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <Header 
        onUpload={() => setShowUploadModal(true)} 
        currentView={currentView}
        onViewChange={handleViewChange}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {currentView === 'music' ? (
          <>
            <Sidebar songs={songs} onSongSelect={handleSongSelect} />
            <MainContent 
              songs={songs} 
              onSongSelect={handleSongSelect}
              currentSong={currentSong}
              onSongUpdate={onSongUpdate}
              onSongDelete={onSongDelete}
              onAlbumDelete={onAlbumDelete}
              onReanalyzeSong={handleReanalyzeSong}
              analyzingSongs={analyzingSongs}
            />
          </>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <SetlistManager 
              songs={songs} 
              onSongSelect={handleSetlistSongSelect}
              selectedSetlistId={params.setlistId}
            />
          </div>
        )}
      </div>
      
      {currentSong && (
        <MusicPlayer 
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
        />
      )}

      <AnalysisProgressIndicator 
        isProcessing={isProcessingQueue}
        progress={analysisProgress}
        analyzingSongs={analyzingSongs}
      />

      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadComplete}
        />
      )}
    </div>
  );
};

export default Index;
