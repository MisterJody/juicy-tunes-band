import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { LyricsUploadSection } from './LyricsUploadSection';
import { useUploadForm } from '@/hooks/useUploadForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Song } from '@/pages/Index';

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
  onSubmit: (song: Omit<Song, 'id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const SingleSongForm = ({
  lyricsText,
  lyricsFile,
  onLyricsTextChange,
  onLyricsFileChange,
  onSubmit,
  onCancel,
  isLoading
}: SingleSongFormProps) => {
  const {
    title,
    setTitle,
    artist,
    setArtist,
    album,
    setAlbum,
    duration,
    setDuration,
    audioFile,
    albumArtFile,
    albumArtPreview,
    key,
    setKey,
    tempo,
    setTempo,
    isLoading: formLoading,
    handleAudioFileChange,
    handleAlbumArtChange,
    getFormData,
    error
  } = useUploadForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(getFormData());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="audioFile">Audio File</Label>
          <div className="flex items-center gap-4">
            <Input
              id="audioFile"
              name="audioFile"
              type="file"
              accept="audio/*"
              onChange={handleAudioFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('audioFile')?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {audioFile ? audioFile.name : 'Select Audio File'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="albumArt">Album Art</Label>
          <div className="flex items-center gap-4">
            <Input
              id="albumArt"
              name="albumArt"
              type="file"
              accept="image/*"
              onChange={handleAlbumArtChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('albumArt')?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {albumArtFile ? albumArtFile.name : 'Select Album Art'}
            </Button>
          </div>
          {albumArtPreview && (
            <img
              src={albumArtPreview}
              alt="Album art preview"
              className="mt-2 h-32 w-32 object-cover rounded-lg"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter song title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="artist">Artist</Label>
          <Input
            id="artist"
            name="artist"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Enter artist name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="album">Album</Label>
          <Input
            id="album"
            name="album"
            value={album}
            onChange={(e) => setAlbum(e.target.value)}
            placeholder="Enter album name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            name="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Duration (auto-detected)"
            readOnly
            className="bg-gray-800 text-gray-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="key">Key</Label>
            <Select value={key} onValueChange={setKey}>
              <SelectTrigger id="key" name="key">
                <SelectValue placeholder="Select key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="C#">C#</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="D#">D#</SelectItem>
                <SelectItem value="E">E</SelectItem>
                <SelectItem value="F">F</SelectItem>
                <SelectItem value="F#">F#</SelectItem>
                <SelectItem value="G">G</SelectItem>
                <SelectItem value="G#">G#</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="A#">A#</SelectItem>
                <SelectItem value="B">B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tempo">Tempo (BPM)</Label>
            <Input
              id="tempo"
              name="tempo"
              type="number"
              value={tempo}
              onChange={(e) => setTempo(e.target.value)}
              placeholder="Enter tempo"
              min="0"
              max="300"
            />
          </div>
        </div>
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
          disabled={isLoading || !audioFile}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isLoading ? 'Uploading...' : 'Upload Song'}
        </Button>
      </div>
    </form>
  );
};
