
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { Song } from '@/pages/Index';

interface LyricsViewerProps {
  song: Song;
  onClose: () => void;
}

export const LyricsViewer = ({ song, onClose }: LyricsViewerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lyrics, setLyrics] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLyrics = async () => {
      setIsLoading(true);
      
      if (song.lyricsText) {
        setLyrics(song.lyricsText);
      } else if (song.lyricsFileUrl) {
        try {
          const response = await fetch(song.lyricsFileUrl);
          const text = await response.text();
          setLyrics(text);
        } catch (error) {
          console.error('Error loading lyrics file:', error);
          setLyrics('Error loading lyrics file.');
        }
      } else {
        setLyrics('No lyrics available for this song.');
      }
      
      setIsLoading(false);
    };

    loadLyrics();
  }, [song]);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0 bg-gray-900">
            <div>
              <h2 className="text-xl font-bold text-white">{song.title}</h2>
              <p className="text-gray-400">{song.artist} - {song.album}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-gray-400 hover:text-white"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 bg-black">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-400">Loading lyrics...</div>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6 text-white whitespace-pre-wrap leading-relaxed text-xl">
                  {lyrics}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{song.title}</h2>
            <p className="text-gray-400">{song.artist} - {song.album}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 bg-gray-900 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">Loading lyrics...</div>
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="p-6 text-white whitespace-pre-wrap leading-relaxed text-base">
                {lyrics}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
};
