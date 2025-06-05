import React, { useState, useRef, useEffect } from 'react';
import { Song } from '@/pages/Index';
import { Play, Pause, ArrowLeft, ArrowRight, Music, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Metronome } from '@/components/Metronome';
import { LyricsButton } from '@/components/LyricsButton';

interface MusicPlayerProps {
  song: Song;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export const MusicPlayer = ({ song, isPlaying, onPlayPause }: MusicPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState([0]);
  const [volume, setVolume] = useState([75]);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [metronomeTempo, setMetronomeTempo] = useState(song.tempo || 120);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // Update metronome tempo when song changes
  useEffect(() => {
    if (song.tempo) {
      setMetronomeTempo(song.tempo);
    }
  }, [song.tempo]);

  // Update audio source when song changes
  useEffect(() => {
    if (audioRef.current && song.audioFile) {
      audioRef.current.src = song.audioFile;
      audioRef.current.load();
    }
  }, [song.audioFile]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      if (total > 0) {
        setProgress([(current / total) * 100]);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressChange = (newProgress: number[]) => {
    if (audioRef.current && duration > 0) {
      const newTime = (newProgress[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(newProgress);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <div className="bg-gradient-to-r from-gray-900 via-purple-900/50 to-gray-900 border-t border-purple-500/30 p-2">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => onPlayPause()}
          preload="metadata"
          src={song.audioFile}
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={song.albumArt}
              alt={song.album}
              className="w-10 h-10 rounded object-cover border-2 border-purple-500/50"
            />
            <div className="min-w-0">
              <p className="text-white font-medium text-sm truncate">{song.title}</p>
              <p className="text-gray-300 text-xs truncate">{song.artist}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={onPlayPause}
              className="w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full hover:from-orange-400 hover:to-pink-400 flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </Button>
            
            <Button
              onClick={() => setIsMinimized(false)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-900 via-purple-900/50 to-gray-900 border-t border-purple-500/30 p-4">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => onPlayPause()}
        preload="metadata"
        src={song.audioFile}
      />
      
      <div className="flex items-center justify-between">
        {/* Song info */}
        <div className="flex items-center space-x-4 flex-1">
          <img
            src={song.albumArt}
            alt={song.album}
            className="w-14 h-14 rounded object-cover border-2 border-purple-500/50"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-white font-medium truncate">{song.title}</p>
              <LyricsButton song={song} variant="ghost" size="sm" />
            </div>
            <p className="text-gray-300 text-sm truncate">{song.artist}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
              {song.key && <span className="text-orange-400">Key: {song.key}</span>}
              {song.tempo && <span className="text-pink-400">Original: {song.tempo} BPM</span>}
            </div>
          </div>
        </div>

        {/* Player controls */}
        <div className="flex flex-col items-center space-y-2 flex-1">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-orange-400 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={onPlayPause}
              className="w-10 h-10 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full hover:from-orange-400 hover:to-pink-400 hover:scale-105 transition-all duration-200 flex items-center justify-center shadow-lg"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-1" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-orange-400 transition-colors duration-200"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 w-full max-w-md">
            <span className="text-xs text-gray-400">{formatTime(currentTime)}</span>
            <Slider
              value={progress}
              onValueChange={handleProgressChange}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-gray-400">{duration > 0 ? formatTime(duration) : song.duration}</span>
          </div>

          {/* Enhanced Metronome */}
          {song.tempo && (
            <div className="mt-2">
              <Metronome
                tempo={metronomeTempo}
                isActive={isMetronomeActive}
                onToggle={() => setIsMetronomeActive(!isMetronomeActive)}
                onTempoChange={setMetronomeTempo}
              />
            </div>
          )}
        </div>

        {/* Volume control and minimize button */}
        <div className="flex items-center space-x-2 flex-1 justify-end">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <Slider
            value={volume}
            onValueChange={(newVolume) => {
              setVolume(newVolume);
              if (audioRef.current) {
                audioRef.current.volume = newVolume[0] / 100;
              }
            }}
            max={100}
            step={1}
            className="w-24"
          />
          
          <Button
            onClick={() => setIsMinimized(true)}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white ml-2"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
