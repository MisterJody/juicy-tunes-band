
import React, { useState } from 'react';
import { X, Palette, Save, Maximize2, Minimize2, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Song } from '@/pages/Index';

interface EnhancedLyricsViewerProps {
  song: Song;
  onClose: () => void;
}

const NOTE_COLORS = [
  { name: 'Yellow', class: 'bg-yellow-200 text-yellow-900', value: 'yellow' },
  { name: 'Green', class: 'bg-green-200 text-green-900', value: 'green' },
  { name: 'Blue', class: 'bg-blue-200 text-blue-900', value: 'blue' },
  { name: 'Pink', class: 'bg-pink-200 text-pink-900', value: 'pink' },
  { name: 'Purple', class: 'bg-purple-200 text-purple-900', value: 'purple' },
  { name: 'Orange', class: 'bg-orange-200 text-orange-900', value: 'orange' },
];

export const EnhancedLyricsViewer = ({ song, onClose }: EnhancedLyricsViewerProps) => {
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [savedNotes, setSavedNotes] = useState<Array<{ text: string; color: string; id: string }>>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textSize, setTextSize] = useState(16);
  const [isNotesMinimized, setIsNotesMinimized] = useState(false);

  const handleSaveNote = () => {
    if (notes.trim()) {
      const newNote = {
        id: Date.now().toString(),
        text: notes.trim(),
        color: selectedColor,
      };
      setSavedNotes(prev => [...prev, newNote]);
      setNotes('');
    }
  };

  const removeNote = (id: string) => {
    setSavedNotes(prev => prev.filter(note => note.id !== id));
  };

  const getColorClass = (color: string) => {
    return NOTE_COLORS.find(c => c.value === color)?.class || NOTE_COLORS[0].class;
  };

  const increaseFontSize = () => {
    setTextSize(prev => Math.min(prev + 2, 32));
  };

  const decreaseFontSize = () => {
    setTextSize(prev => Math.max(prev - 2, 12));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
                onClick={decreaseFontSize}
                className="text-gray-400 hover:text-white"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-gray-400 text-sm min-w-[3rem] text-center">{textSize}px</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={increaseFontSize}
                className="text-gray-400 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
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
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 bg-black overflow-y-auto">
            <div className="p-6 text-white whitespace-pre-wrap leading-relaxed" style={{ fontSize: `${textSize}px` }}>
              {song.lyricsText || 'No lyrics available for this song'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{song.title}</h2>
            <p className="text-gray-400">{song.artist}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={decreaseFontSize}
              className="text-gray-400 hover:text-white"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-gray-400 text-sm min-w-[3rem] text-center">{textSize}px</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={increaseFontSize}
              className="text-gray-400 hover:text-white"
            >
              <Plus className="w-4 h-4" />
            </Button>
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
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Lyrics Section */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="bg-gray-800 rounded-lg p-4 min-h-full">
              {song.lyricsText ? (
                <pre className="text-gray-100 whitespace-pre-wrap font-mono leading-relaxed" style={{ fontSize: `${textSize}px` }}>
                  {song.lyricsText}
                </pre>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <p>No lyrics available for this song</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className={`border-l border-gray-700 flex flex-col transition-all duration-300 ${
            isNotesMinimized ? 'w-12' : 'w-80'
          }`}>
            {isNotesMinimized ? (
              <div className="p-2">
                <Button
                  onClick={() => setIsNotesMinimized(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white w-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Performance Notes</h3>
                    <Button
                      onClick={() => setIsNotesMinimized(true)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Color Selector */}
                  <div className="mb-4">
                    <label className="text-sm text-gray-400 block mb-2">Note Color</label>
                    <div className="flex flex-wrap gap-2">
                      {NOTE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setSelectedColor(color.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            selectedColor === color.value
                              ? 'border-white scale-110'
                              : 'border-gray-600 hover:border-gray-400'
                          } ${color.class}`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Note Input */}
                  <div className="space-y-3">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add performance notes, key changes, tempo adjustments..."
                      className="bg-gray-800 border-gray-600 text-white resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleSaveNote}
                      disabled={!notes.trim()}
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>

                {/* Saved Notes */}
                <div className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-3">
                    {savedNotes.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notes yet</p>
                      </div>
                    ) : (
                      savedNotes.map((note) => (
                        <div
                          key={note.id}
                          className={`p-3 rounded-lg border relative group ${getColorClass(note.color)}`}
                        >
                          <p className="text-sm pr-6">{note.text}</p>
                          <button
                            onClick={() => removeNote(note.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
