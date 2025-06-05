
import React from 'react';
import { Upload, FolderOpen } from 'lucide-react';

interface UploadModeSelectorProps {
  uploadMode: 'single' | 'album';
  onModeChange: (mode: 'single' | 'album') => void;
}

export const UploadModeSelector = ({ uploadMode, onModeChange }: UploadModeSelectorProps) => {
  return (
    <div className="flex space-x-2 mb-6 bg-gray-800 p-1 rounded-lg">
      <button
        type="button"
        onClick={() => onModeChange('single')}
        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
          uploadMode === 'single' 
            ? 'bg-purple-600 text-white' 
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Upload className="w-4 h-4 inline mr-2" />
        Single Song
      </button>
      <button
        type="button"
        onClick={() => onModeChange('album')}
        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
          uploadMode === 'album' 
            ? 'bg-purple-600 text-white' 
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <FolderOpen className="w-4 h-4 inline mr-2" />
        Album
      </button>
    </div>
  );
};
