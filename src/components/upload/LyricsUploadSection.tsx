
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface LyricsUploadSectionProps {
  lyricsText: string;
  lyricsFile: File | null;
  isLoading: boolean;
  onLyricsTextChange: (text: string) => void;
  onLyricsFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const LyricsUploadSection = ({
  lyricsText,
  lyricsFile,
  isLoading,
  onLyricsTextChange,
  onLyricsFileChange
}: LyricsUploadSectionProps) => {
  return (
    <div className="space-y-4 border-t border-gray-700 pt-4">
      <div className="flex items-center space-x-2">
        <FileText className="w-4 h-4 text-purple-400" />
        <Label className="text-gray-200 font-medium">Lyrics (Optional)</Label>
      </div>
      
      <div>
        <Label htmlFor="lyricsFile" className="text-gray-200 text-sm">Upload Lyrics File (PDF or TXT)</Label>
        <Input
          id="lyricsFile"
          type="file"
          accept=".pdf,.txt,text/plain,application/pdf"
          onChange={onLyricsFileChange}
          className="bg-gray-800 border-gray-600 text-white"
          disabled={isLoading}
        />
        {lyricsFile && (
          <p className="text-sm text-green-400 mt-1">
            File selected: {lyricsFile.name}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="lyricsText" className="text-gray-200 text-sm">Or Enter Lyrics Text</Label>
        <Textarea
          id="lyricsText"
          value={lyricsText}
          onChange={(e) => onLyricsTextChange(e.target.value)}
          className="bg-gray-800 border-gray-600 text-white min-h-[80px]"
          placeholder="Enter song lyrics here..."
          disabled={isLoading}
        />
      </div>

      {(lyricsText || lyricsFile) && (
        <p className="text-xs text-green-400">
          ✓ Lyrics will be available in the song viewer
        </p>
      )}
    </div>
  );
};
