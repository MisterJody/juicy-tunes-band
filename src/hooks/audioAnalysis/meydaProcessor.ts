import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Meyda from 'meyda';

export const useMeydaProcessor = () => {
  const { toast } = useToast();

  const processAudioFile = useCallback(async (
    songId: string,
    audioUrl: string,
    onComplete: (songId: string) => void
  ) => {
    console.log('=== Starting Meyda audio analysis for song ===', songId);
    
    try {
      // Fetch and decode the audio file
      console.log('Fetching audio file from:', audioUrl);
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio file: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || ((window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext))();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('=== Audio file loaded successfully ===', {
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels
      });
      
      // Use first 30 seconds for analysis
      const analysisLength = Math.min(audioBuffer.length, audioBuffer.sampleRate * 30);
      const audioData = audioBuffer.getChannelData().slice(0, analysisLength);
      
      console.log('=== Starting Meyda analysis ===');
      
      // Configure Meyda
      const bufferSize = 512;
      const sampleRate = audioBuffer.sampleRate;
      
      // Initialize Meyda
      Meyda.bufferSize = bufferSize;
      Meyda.sampleRate = sampleRate;
      
      // Analyze tempo using Meyda's spectral features
      console.log('=== Detecting tempo with Meyda ===');
      const tempo = await detectTempoWithMeyda(audioData, sampleRate, bufferSize);
      console.log('=== Tempo detection complete ===', tempo, 'BPM');
      
      // Analyze key using Meyda's chroma features
      console.log('=== Detecting key with Meyda ===');
      const key = await detectKeyWithMeyda(audioData, sampleRate, bufferSize);
      console.log('=== Key detection complete ===', key);
      
      // Update the song in the database
      console.log('=== Updating database ===');
      const { data, error: dbError } = await supabase
        .from('songs')
        .update({
          tempo: tempo,
          song_key: key
        })
        .eq('id', songId)
        .select();

      if (dbError) {
        console.error('=== Database update failed ===', dbError);
        toast({
          title: "Analysis update failed",
          description: "Could not save analysis results.",
          variant: "destructive",
        });
      } else {
        console.log('=== Database updated successfully ===', data);
        toast({
          title: "Analysis complete",
          description: `Tempo: ${tempo} BPM, Key: ${key}`,
        });
      }
      
      // Clean up
      await audioContext.close();
      console.log('=== Audio context closed ===');
      
    } catch (error) {
      console.error('=== Meyda audio analysis failed ===', error);
      toast({
        title: "Analysis failed",
        description: "Could not analyze the audio file.",
        variant: "destructive",
      });
    } finally {
      console.log('=== Calling onComplete for song ===', songId);
      onComplete(songId);
    }
  }, [toast]);

  return { processAudioFile };
};

// Tempo detection using Meyda's spectral features
async function detectTempoWithMeyda(
  audioData: Float32Array, 
  sampleRate: number, 
  bufferSize: number
): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        console.log('Meyda tempo analysis starting...');
        
        const numFrames = Math.floor(audioData.length / bufferSize);
        const onsetStrength = [];
        
        let prevSpectralCentroid = 0;
        let prevRms = 0;
        
        // Process audio in frames
        for (let i = 0; i < numFrames && i < 200; i++) { // Limit to prevent blocking
          const start = i * bufferSize;
          const frame = audioData.slice(start, start + bufferSize);
          
          // Get Meyda features - using individual feature calls
          const spectralCentroid = Meyda.extract('spectralCentroid', frame) as number;
          const rms = Meyda.extract('rms', frame) as number;
          
          if (spectralCentroid && rms) {
            // Calculate onset strength using spectral changes
            const spectralChange = Math.abs(spectralCentroid - prevSpectralCentroid);
            const rmsChange = Math.abs(rms - prevRms);
            const onsetValue = spectralChange + rmsChange * 1000; // Weight RMS changes
            
            onsetStrength.push(onsetValue);
            
            prevSpectralCentroid = spectralCentroid;
            prevRms = rms;
          } else {
            onsetStrength.push(0);
          }
          
          // Yield control periodically
          if (i % 50 === 0) {
            await new Promise(r => setTimeout(r, 1));
          }
        }
        
        console.log('Meyda features extracted, finding beats...');
        
        // Find peaks in onset strength
        const threshold = onsetStrength.reduce((a, b) => a + b, 0) / onsetStrength.length * 1.5;
        const peaks = [];
        
        for (let i = 2; i < onsetStrength.length - 2; i++) {
          if (onsetStrength[i] > threshold &&
              onsetStrength[i] > onsetStrength[i-1] &&
              onsetStrength[i] > onsetStrength[i+1] &&
              onsetStrength[i] > onsetStrength[i-2] &&
              onsetStrength[i] > onsetStrength[i+2]) {
            peaks.push(i);
          }
        }
        
        console.log('Found peaks:', peaks.length);
        
        if (peaks.length < 8) {
          resolve(120); // Default
          return;
        }
        
        // Calculate intervals
        const intervals = [];
        for (let i = 1; i < Math.min(peaks.length, 20); i++) {
          const interval = (peaks[i] - peaks[i-1]) * bufferSize / sampleRate;
          if (interval > 0.3 && interval < 2.0) {
            intervals.push(interval);
          }
        }
        
        if (intervals.length < 3) {
          resolve(120);
          return;
        }
        
        // Use median interval
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];
        let bpm = Math.round(60 / medianInterval);
        
        // Adjust for common tempo ranges
        if (bpm < 80) bpm *= 2;
        if (bpm > 160) bpm /= 2;
        if (bpm < 80) bpm *= 2;
        
        resolve(Math.max(70, Math.min(180, bpm)));
      } catch (error) {
        console.error('Meyda tempo detection error:', error);
        resolve(120);
      }
    }, 10);
  });
}

// Key detection using Meyda's chroma features
async function detectKeyWithMeyda(
  audioData: Float32Array, 
  sampleRate: number, 
  bufferSize: number
): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        console.log('Meyda key analysis starting...');
        
        const numFrames = Math.floor(audioData.length / bufferSize);
        const chromaFeatures = [];
        
        // Process audio in frames to get chroma features
        for (let i = 0; i < numFrames && i < 150; i++) { // Limit frames
          const start = i * bufferSize;
          const frame = audioData.slice(start, start + bufferSize);
          
          try {
            const chroma = Meyda.extract('chroma', frame) as number[];
            
            if (chroma && Array.isArray(chroma)) {
              chromaFeatures.push(chroma);
            }
          } catch (err) {
            console.warn('Frame analysis error:', err);
          }
          
          // Yield control
          if (i % 30 === 0) {
            await new Promise(r => setTimeout(r, 1));
          }
        }
        
        if (chromaFeatures.length === 0) {
          resolve('C Major');
          return;
        }
        
        console.log('Meyda chroma features extracted:', chromaFeatures.length, 'frames');
        
        // Average the chroma features
        const avgChroma = new Array(12).fill(0);
        for (const chroma of chromaFeatures) {
          for (let i = 0; i < Math.min(12, chroma.length); i++) {
            avgChroma[i] += chroma[i] / chromaFeatures.length;
          }
        }
        
        // Normalize
        const maxChroma = Math.max(...avgChroma);
        if (maxChroma > 0) {
          for (let i = 0; i < 12; i++) {
            avgChroma[i] /= maxChroma;
          }
        }
        
        console.log('Average chroma:', avgChroma.map(x => x.toFixed(3)));
        
        // Key templates
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const majorTemplate = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
        const minorTemplate = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
        
        let bestKey = 'C Major';
        let bestScore = -Infinity;
        
        // Test all keys
        for (let root = 0; root < 12; root++) {
          // Major key
          let majorScore = 0;
          for (let i = 0; i < 12; i++) {
            const noteIndex = (i + root) % 12;
            majorScore += avgChroma[noteIndex] * majorTemplate[i];
          }
          
          if (majorScore > bestScore) {
            bestScore = majorScore;
            bestKey = `${noteNames[root]} Major`;
          }
          
          // Minor key
          let minorScore = 0;
          for (let i = 0; i < 12; i++) {
            const noteIndex = (i + root) % 12;
            minorScore += avgChroma[noteIndex] * minorTemplate[i];
          }
          
          if (minorScore > bestScore) {
            bestScore = minorScore;
            bestKey = `${noteNames[root]} Minor`;
          }
        }
        
        console.log('Meyda key detection result:', bestKey);
        resolve(bestKey);
      } catch (error) {
        console.error('Meyda key detection error:', error);
        resolve('C Major');
      }
    }, 10);
  });
}
