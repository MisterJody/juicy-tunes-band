import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderOpen } from 'lucide-react';
import { useAlbumUpload } from '@/hooks/useAlbumUpload';
import { Song } from '@/pages/Index';

interface AlbumUploadFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onUpload: (song: Omit<Song, 'id'>) => void;
}

export const AlbumUploadForm = ({ onSubmit, onCancel }: AlbumUploadFormProps) => {
  const {
    albumFiles,
    albumName,
    setAlbumName,
    albumArt,
    isUploading,
    uploadProgress,
    handleAlbumFilesChange,
    handleAlbumArtChange
  } = useAlbumUpload();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="albumFiles" className="text-gray-200">Audio Files *</Label>
        <Input
          id="albumFiles"
          name="albumFiles"
          type="file"
          accept="audio/*"
          multiple
          onChange={handleAlbumFilesChange}
          className="bg-gray-800 border-gray-600 text-white"
          required
          disabled={isUploading}
        />
        {albumFiles.length > 0 && (
          <p className="text-sm text-gray-400 mt-1">
            {albumFiles.length} file(s) selected
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="albumName" className="text-gray-200">Album Name *</Label>
        <Input
          id="albumName"
          name="albumName"
          value={albumName}
          onChange={(e) => setAlbumName(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white"
          placeholder="Enter album name"
          required
          disabled={isUploading}
        />
      </div>

      <div>
        <Label htmlFor="albumArtUpload" className="text-gray-200">Album Art (Optional)</Label>
        <Input
          id="albumArtUpload"
          name="albumArtUpload"
          type="file"
          accept="image/*"
          onChange={handleAlbumArtChange}
          className="bg-gray-800 border-gray-600 text-white"
          disabled={isUploading}
        />
        {albumArt && (
          <div className="mt-2">
            <img src={albumArt} alt="Album art preview" className="w-20 h-20 rounded object-cover" />
          </div>
        )}
      </div>

      {isUploading && (
        <div className="bg-gray-800 p-3 rounded">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Uploading album...</span>
            <span>{uploadProgress.current} / {uploadProgress.total}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Songs will be analyzed one by one after upload completes
          </p>
        </div>
      )}

      <div className="bg-gray-800 p-3 rounded text-sm text-gray-300">
        <p className="mb-1">🎵 Upload multiple songs at once!</p>
        <p>Each song will be processed and analyzed sequentially after upload.</p>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isUploading || albumFiles.length === 0}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
        >
          <FolderOpen className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload Album'}
        </Button>
      </div>
    </form>
  );
};
