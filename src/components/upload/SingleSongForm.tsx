
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { LyricsUploadSection } from './LyricsUploadSection';
import { useUploadForm } from '@/hooks/useUploadForm';

const keys = [
  'C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor',
  'D# Major', 'D# Minor', 'E Major', 'E Minor', 'F Major', 'F Minor',
  'F# Major', 'F# Minor', 'G Major', 'G Minor', 'G# Major', 'G# Minor',
  'A Major', 'A Minor', 'A# Major', 'A# Minor', 'B Major', 'B Minor'
];

interface SingleSongFormProps {
  lyricsText: string;
  lyricsFile: File | null;
  onLyricsTextChange: (text: string) => void;
  onLyricsFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const SingleSongForm = ({
  lyricsText,
  lyricsFile,
  onLyricsTextChange,
  onLyricsFileChange,
  onSubmit,
  onCancel
}: SingleSongFormProps) => {
  const {
    title,
    setTitle,
    album,
    setAlbum,
    duration,
    setDuration,
    albumArtPreview,
    key,
    setKey,
    tempo,
    setTempo,
    isLoading,
    handleAudioFileChange,
    handleAlbumArtChange
  } = useUploadForm();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="audioFile" className="text-gray-200">Audio File *</Label>
        <Input
          id="audioFile"
          type="file"
          accept="audio/*"
          onChange={handleAudioFileChange}
          className="bg-gray-800 border-gray-600 text-white"
          required
          disabled={isLoading}
        />
        {isLoading && <p className="text-orange-400 text-sm mt-1">Reading file metadata...</p>}
      </div>

      <div>
        <Label htmlFor="title" className="text-gray-200">Song Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white"
          placeholder="Enter song title"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="album" className="text-gray-200">Album *</Label>
        <Input
          id="album"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white"
          placeholder="Enter album name"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="duration" className="text-gray-200">Duration *</Label>
        <Input
          id="duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white"
          placeholder="e.g., 3:45"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="key" className="text-gray-200">Key (Optional)</Label>
          <Select value={key} onValueChange={setKey} disabled={isLoading}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select key" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="none" className="text-white hover:bg-gray-700">Auto-detect after upload</SelectItem>
              {keys.map((keyOption) => (
                <SelectItem key={keyOption} value={keyOption} className="text-white hover:bg-gray-700">
                  {keyOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tempo" className="text-gray-200">Tempo (BPM, Optional)</Label>
          <Input
            id="tempo"
            type="number"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="Auto-detect after upload"
            min="40"
            max="200"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="albumArtFile" className="text-gray-200">Album Art (Optional)</Label>
        <Input
          id="albumArtFile"
          type="file"
          accept="image/*"
          onChange={handleAlbumArtChange}
          className="bg-gray-800 border-gray-600 text-white"
          disabled={isLoading}
        />
        {albumArtPreview && (
          <div className="mt-2">
            <img src={albumArtPreview} alt="Album art preview" className="w-20 h-20 rounded object-cover" />
          </div>
        )}
      </div>

      <LyricsUploadSection
        lyricsText={lyricsText}
        lyricsFile={lyricsFile}
        isLoading={isLoading}
        onLyricsTextChange={onLyricsTextChange}
        onLyricsFileChange={onLyricsFileChange}
      />

      <div className="bg-gray-800 p-3 rounded text-sm text-gray-300">
        <p className="mb-1">🎵 Upload your song now and listen immediately!</p>
        <p>Audio analysis (tempo & key detection) will happen in the background and update automatically.</p>
      </div>

      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isLoading ? 'Uploading...' : 'Upload Song'}
        </Button>
      </div>
    </form>
  );
};
