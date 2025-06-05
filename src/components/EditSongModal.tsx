import React, { useState, useEffect } from 'react';
import { Song } from '@/pages/Index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Music } from 'lucide-react';
import { LyricsUploadSection } from '@/components/upload/LyricsUploadSection';
import { useFileUpload } from '@/hooks/useFileUpload';

interface EditSongModalProps {
  song: Song;
  onClose: () => void;
  onSave: (updatedSong: Song) => void;
}

const keys = [
  'C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor',
  'D# Major', 'D# Minor', 'E Major', 'E Minor', 'F Major', 'F Minor',
  'F# Major', 'F# Minor', 'G Major', 'G Minor', 'G# Major', 'G# Minor',
  'A Major', 'A Minor', 'A# Major', 'A# Minor', 'B Major', 'B Minor'
];

export const EditSongModal = ({ song, onClose, onSave }: EditSongModalProps) => {
  const [title, setTitle] = useState(song.title);
  const [album, setAlbum] = useState(song.album);
  const [duration, setDuration] = useState(song.duration);
  const [albumArt, setAlbumArt] = useState(song.albumArt);
  const [key, setKey] = useState(song.key || 'none');
  const [tempo, setTempo] = useState(song.tempo?.toString() || '');
  const [lyricsText, setLyricsText] = useState(song.lyricsText || '');
  const [lyricsFile, setLyricsFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { uploadFileToStorage } = useFileUpload();

  const handleAlbumArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setAlbumArt(imageUrl);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !album || !duration) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Upload lyrics file if provided
      let lyricsFileUrl = song.lyricsFileUrl;
      if (lyricsFile) {
        const lyricsFileName = `${Date.now()}-${lyricsFile.name}`;
        const uploadedLyricsUrl = await uploadFileToStorage(lyricsFile, 'lyrics-files', lyricsFileName);
        if (uploadedLyricsUrl) {
          lyricsFileUrl = uploadedLyricsUrl;
        }
      }

      const hasLyrics = !!(lyricsText || lyricsFileUrl);

      const updatedSong: Song = {
        ...song,
        title,
        album,
        duration,
        albumArt,
        key: key === 'none' ? undefined : key,
        tempo: tempo ? parseInt(tempo) : undefined,
        lyricsText: lyricsText || undefined,
        lyricsFileUrl: lyricsFileUrl || undefined,
        hasLyrics
      };

      onSave(updatedSong);
      onClose();
    } catch (error) {
      console.error('Error updating song:', error);
      alert('Error updating song. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Edit Song</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isLoading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-gray-200">Song Title *</Label>
            <Input
              id="title"
              name="title"
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
              name="album"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Enter album name"
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
                  <SelectItem value="none" className="text-white hover:bg-gray-700">None</SelectItem>
                  {keys.map((keyOption) => (
                    <SelectItem key={keyOption} value={keyOption} className="text-white hover:bg-gray-700">
                      {keyOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tempo" className="text-gray-200">Tempo (BPM) (Optional)</Label>
              <Input
                id="tempo"
                name="tempo"
                type="number"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="120"
                min="40"
                max="200"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="duration" className="text-gray-200">Duration *</Label>
            <Input
              id="duration"
              name="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="e.g., 3:45"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="albumArtFile" className="text-gray-200">Album Art</Label>
            <Input
              id="albumArtFile"
              type="file"
              accept="image/*"
              onChange={handleAlbumArtChange}
              className="bg-gray-800 border-gray-600 text-white"
              disabled={isLoading}
            />
            {albumArt && (
              <div className="mt-2">
                <img src={albumArt} alt="Album art preview" className="w-20 h-20 rounded object-cover" />
              </div>
            )}
          </div>

          <LyricsUploadSection
            lyricsText={lyricsText}
            lyricsFile={lyricsFile}
            isLoading={isLoading}
            onLyricsTextChange={setLyricsText}
            onLyricsFileChange={handleLyricsFileChange}
          />

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
