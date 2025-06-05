
import React, { useState } from 'react';
import { Song } from '@/pages/Index';
import { Button } from '@/components/ui/button';
import { X, Music } from 'lucide-react';
import { useUploadForm } from '@/hooks/useUploadForm';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAlbumUpload } from '@/hooks/useAlbumUpload';
import { UploadModeSelector } from './upload/UploadModeSelector';
import { SingleSongForm } from './upload/SingleSongForm';
import { AlbumUploadForm } from './upload/AlbumUploadForm';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (song: Omit<Song, 'id'>) => void;
}

export const UploadModal = ({ onClose, onUpload }: UploadModalProps) => {
  const [uploadMode, setUploadMode] = useState<'single' | 'album'>('single');
  const [lyricsText, setLyricsText] = useState('');
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  
  const {
    audioFile,
    albumArtFile,
    isLoading,
    setIsLoading,
    getFormData
  } = useUploadForm();

  const { uploadFileToStorage } = useFileUpload();
  
  const {
    uploadAlbum,
    isUploading
  } = useAlbumUpload();

  const handleLyricsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLyricsFile(file);

    // If it's a text file, read it and set the lyrics text
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setLyricsText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      alert('Please select an audio file');
      return;
    }

    setIsLoading(true);

    try {
      // Upload audio file
      const audioFileName = `${Date.now()}-${audioFile.name}`;
      const audioUrl = await uploadFileToStorage(audioFile, 'audio-files', audioFileName);

      if (!audioUrl) {
        alert('Failed to upload audio file');
        setIsLoading(false);
        return;
      }

      // Upload album art if provided
      let albumArtUrl = 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=300&fit=crop';
      
      if (albumArtFile) {
        const artFileName = `${Date.now()}-${albumArtFile.name}`;
        const uploadedArtUrl = await uploadFileToStorage(albumArtFile, 'album-art', artFileName);
        if (uploadedArtUrl) {
          albumArtUrl = uploadedArtUrl;
        }
      }

      // Upload lyrics file if provided
      let lyricsFileUrl = null;
      if (lyricsFile) {
        const lyricsFileName = `${Date.now()}-${lyricsFile.name}`;
        lyricsFileUrl = await uploadFileToStorage(lyricsFile, 'lyrics-files', lyricsFileName);
      }

      const songData = getFormData();
      const hasLyrics = !!(lyricsText || lyricsFileUrl);
      
      onUpload({
        ...songData,
        albumArt: albumArtUrl,
        audioFile: audioUrl,
        lyricsText: lyricsText || undefined,
        lyricsFileUrl: lyricsFileUrl || undefined,
        hasLyrics
      });

      onClose();
    } catch (error) {
      console.error('Error uploading song:', error);
      alert('Error uploading song. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlbumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await uploadAlbum(onUpload);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Upload Music</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isLoading || isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <UploadModeSelector 
          uploadMode={uploadMode} 
          onModeChange={setUploadMode} 
        />

        {uploadMode === 'single' ? (
          <SingleSongForm
            lyricsText={lyricsText}
            lyricsFile={lyricsFile}
            onLyricsTextChange={setLyricsText}
            onLyricsFileChange={handleLyricsFileChange}
            onSubmit={handleSingleSubmit}
            onCancel={onClose}
          />
        ) : (
          <AlbumUploadForm
            onSubmit={handleAlbumSubmit}
            onCancel={onClose}
            onUpload={onUpload}
          />
        )}
      </div>
    </div>
  );
};
