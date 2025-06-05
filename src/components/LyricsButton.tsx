
import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnhancedLyricsViewer } from './EnhancedLyricsViewer';
import { Song } from '@/pages/Index';

interface LyricsButtonProps {
  song: Song;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LyricsButton = ({ song, variant = 'ghost', size = 'sm' }: LyricsButtonProps) => {
  const [showLyrics, setShowLyrics] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLyrics(true);
  };

  if (!song.hasLyrics && !song.lyricsText) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className="text-blue-400 hover:text-blue-300"
        title="View lyrics"
      >
        <FileText className="w-4 h-4" />
      </Button>

      {showLyrics && (
        <EnhancedLyricsViewer
          song={song}
          onClose={() => setShowLyrics(false)}
        />
      )}
    </>
  );
};
