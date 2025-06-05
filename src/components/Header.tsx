
import React from 'react';
import { Upload, Music, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onUpload: () => void;
  currentView?: 'music' | 'setlists';
  onViewChange?: (view: 'music' | 'setlists') => void;
}

export const Header = ({ onUpload, currentView = 'music', onViewChange }: HeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-gray-900 via-purple-900/50 to-gray-900 border-b border-purple-500/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            BandHub
          </h1>
          
          {onViewChange && (
            <nav className="flex space-x-1">
              <Button
                variant={currentView === 'music' ? 'default' : 'ghost'}
                onClick={() => onViewChange('music')}
                className={`${
                  currentView === 'music' 
                    ? 'bg-purple-500 hover:bg-purple-600' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Music className="w-4 h-4 mr-2" />
                Music Library
              </Button>
              <Button
                variant={currentView === 'setlists' ? 'default' : 'ghost'}
                onClick={() => onViewChange('setlists')}
                className={`${
                  currentView === 'setlists' 
                    ? 'bg-purple-500 hover:bg-purple-600' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <ListMusic className="w-4 h-4 mr-2" />
                Setlists
              </Button>
            </nav>
          )}
        </div>
        
        <Button 
          onClick={onUpload}
          className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-400 hover:to-pink-400 hover:scale-105 transition-all duration-200 shadow-lg"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Music
        </Button>
      </div>
    </header>
  );
};
