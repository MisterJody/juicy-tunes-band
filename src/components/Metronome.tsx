import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface MetronomeProps {
  tempo: number;
  isActive: boolean;
  onToggle: () => void;
  onTempoChange?: (tempo: number) => void;
}

export const Metronome = ({ tempo, isActive, onToggle, onTempoChange }: MetronomeProps) => {
  const [beat, setBeat] = useState(0);
  const [currentTempo, setCurrentTempo] = useState(tempo);
  const [volume, setVolume] = useState([50]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sync tempo with prop changes
  useEffect(() => {
    setCurrentTempo(tempo);
  }, [tempo]);

  const playClick = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || ((window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext))();
    }
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Different frequencies for different beats
    const frequencies = [1200, 800, 900, 800]; // Accent on beat 1
    oscillator.frequency.value = frequencies[beat];
    oscillator.type = 'square';
    
    const vol = (volume[0] / 100) * 0.1;
    gainNode.gain.setValueAtTime(vol, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  };

  useEffect(() => {
    if (isActive && currentTempo > 0) {
      const interval = 60000 / currentTempo;
      
      intervalRef.current = setInterval(() => {
        setBeat((prevBeat) => {
          const nextBeat = (prevBeat + 1) % 4;
          playClick();
          return nextBeat;
        });
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setBeat(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, currentTempo, volume]);

  const handleTempoChange = (newTempo: number[]) => {
    setCurrentTempo(newTempo[0]);
    onTempoChange?.(newTempo[0]);
  };

  const resetToSongTempo = () => {
    setCurrentTempo(tempo);
  };

  const getBeatColor = (beatIndex: number) => {
    if (!isActive) return 'bg-gray-600';
    if (beat === beatIndex) {
      return beatIndex === 0 
        ? 'bg-orange-500 scale-125 shadow-lg shadow-orange-500/50 animate-pulse' 
        : 'bg-pink-500 scale-125 shadow-lg shadow-pink-500/50 animate-pulse';
    }
    return beatIndex === 0 ? 'bg-orange-300' : 'bg-pink-300';
  };

  const getTempoDescription = (bpm: number) => {
    if (bpm < 60) return 'Very Slow';
    if (bpm < 90) return 'Slow';
    if (bpm < 120) return 'Medium';
    if (bpm < 150) return 'Fast';
    if (bpm < 180) return 'Very Fast';
    return 'Extreme';
  };

  return (
    <div className="flex flex-col space-y-3 bg-gradient-to-r from-gray-800/50 to-purple-800/30 rounded-lg p-4 border border-purple-500/30">
      {/* Main controls */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className={`text-gray-400 hover:text-orange-400 transition-colors duration-200 ${
            isActive ? 'text-orange-400 bg-orange-400/20' : ''
          }`}
        >
          {isActive ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </Button>
        
        {/* Beat indicators */}
        <div className="flex items-center space-x-2">
          {[0, 1, 2, 3].map((beatIndex) => (
            <div
              key={beatIndex}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${getBeatColor(beatIndex)}`}
            >
              {beatIndex === 0 && isActive && beat === beatIndex && (
                <div className="w-full h-full rounded-full bg-white/30 animate-ping" />
              )}
            </div>
          ))}
        </div>
        
        {/* Tempo display */}
        <div className="text-center">
          <div className="text-lg font-bold text-white">{currentTempo}</div>
          <div className="text-xs text-gray-300">BPM</div>
        </div>

        {/* Reset button */}
        {currentTempo !== tempo && (
          <Button
            onClick={resetToSongTempo}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
            title={`Reset to song tempo (${tempo} BPM)`}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tempo slider */}
      <div className="flex items-center space-x-3">
        <span className="text-xs text-gray-400 min-w-[2rem]">60</span>
        <Slider
          value={[currentTempo]}
          onValueChange={handleTempoChange}
          min={60}
          max={200}
          step={1}
          className="flex-1"
        />
        <span className="text-xs text-gray-400 min-w-[2rem]">200</span>
      </div>

      {/* Volume and tempo description */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <Slider
            value={volume}
            onValueChange={setVolume}
            max={100}
            step={1}
            className="w-16"
          />
        </div>
        <span className="text-xs text-purple-300 font-medium">
          {getTempoDescription(currentTempo)}
        </span>
      </div>
    </div>
  );
};
