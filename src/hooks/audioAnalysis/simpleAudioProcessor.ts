import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSimpleAudioProcessor = () => {
  const { toast } = useToast();

  const processAudioFile = useCallback(async (
    songId: string,
    audioUrl: string,
    onComplete: (songId: string) => void
  ) => {
    console.log('=== Starting simple audio analysis for song ===', songId);
    
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
      
      // Use only first 10 seconds for faster analysis
      const analysisLength = Math.min(audioBuffer.length, audioBuffer.sampleRate * 10);
      const audioData = audioBuffer.getChannelData().slice(0, analysisLength);
      
      console.log('=== Starting fast tempo detection ===');
      const tempo = await detectTempoFast(audioData, audioBuffer.sampleRate);
      console.log('=== Tempo detection complete ===', tempo, 'BPM');
      
      console.log('=== Starting fast key detection ===');
      const key = await detectKeyFast(audioData, audioBuffer.sampleRate);
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
      console.error('=== Simple audio analysis failed ===', error);
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

// Fast tempo detection using simplified autocorrelation
async function detectTempoFast(data: Float32Array, sampleRate: number): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        console.log('Fast tempo detection with', data.length, 'samples');
        
        // Use much smaller sample for speed
        const maxSamples = Math.min(data.length, sampleRate * 5); // Only 5 seconds
        const analysisData = data.slice(0, maxSamples);
        
        // Simple energy-based beat detection
        const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
        const energies = [];
        
        for (let i = 0; i < analysisData.length - windowSize; i += windowSize) {
          let energy = 0;
          for (let j = 0; j < windowSize; j++) {
            energy += analysisData[i + j] * analysisData[i + j];
          }
          energies.push(energy / windowSize);
        }
        
        // Find average interval between energy peaks
        const threshold = energies.reduce((a, b) => a + b) / energies.length * 1.5;
        const peaks = [];
        
        for (let i = 1; i < energies.length - 1; i++) {
          if (energies[i] > threshold && energies[i] > energies[i-1] && energies[i] > energies[i+1]) {
            peaks.push(i * windowSize / sampleRate);
          }
        }
        
        if (peaks.length < 3) {
          console.log('Not enough peaks, using default tempo');
          resolve(120);
          return;
        }
        
        // Calculate intervals and find most common
        const intervals = [];
        for (let i = 1; i < Math.min(peaks.length, 10); i++) {
          const interval = peaks[i] - peaks[i-1];
          if (interval > 0.3 && interval < 2.0) {
            intervals.push(interval);
          }
        }
        
        if (intervals.length === 0) {
          resolve(120);
          return;
        }
        
        // Use median interval
        intervals.sort((a, b) => a - b);
        const medianInterval = intervals[Math.floor(intervals.length / 2)];
        let bpm = Math.round(60 / medianInterval);
        
        // Adjust for common tempo ranges
        while (bpm < 80) bpm *= 2;
        while (bpm > 160) bpm /= 2;
        
        resolve(Math.max(80, Math.min(160, bpm)));
      } catch (error) {
        console.error('Fast tempo detection error:', error);
        resolve(120);
      }
    }, 10); // Small delay to prevent blocking
  });
}

// Fast key detection using simplified chromagram
async function detectKeyFast(data: Float32Array, sampleRate: number): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        console.log('Fast key detection starting');
        
        // Use even smaller sample for key detection
        const maxSamples = Math.min(data.length, sampleRate * 3); // Only 3 seconds
        const analysisData = data.slice(0, maxSamples);
        
        // Simple frequency analysis
        const fftSize = 2048;
        const frequencies = [];
        
        // Process in chunks to avoid blocking
        for (let i = 0; i < analysisData.length - fftSize; i += fftSize * 2) {
          const chunk = analysisData.slice(i, i + fftSize);
          const spectrum = simpleFFT(chunk);
          frequencies.push(spectrum);
          
          if (frequencies.length >= 5) break; // Limit processing
        }
        
        if (frequencies.length === 0) {
          resolve('C Major');
          return;
        }
        
        // Simple key detection based on dominant frequencies
        const avgSpectrum = new Float32Array(fftSize / 2);
        for (const spectrum of frequencies) {
          for (let i = 0; i < avgSpectrum.length; i++) {
            avgSpectrum[i] += spectrum[i] / frequencies.length;
          }
        }
        
        // Map to chromagram (simplified)
        const chroma = new Float32Array(12);
        for (let i = 1; i < avgSpectrum.length; i++) {
          const freq = (i * sampleRate) / (2 * fftSize);
          if (freq > 80 && freq < 2000) { // Focus on musical range
            const noteIndex = Math.round(12 * Math.log2(freq / 440)) % 12;
            if (noteIndex >= 0 && noteIndex < 12) {
              chroma[noteIndex] += avgSpectrum[i];
            }
          }
        }
        
        // Find dominant note
        let maxChroma = 0;
        let dominantNote = 0;
        for (let i = 0; i < 12; i++) {
          if (chroma[i] > maxChroma) {
            maxChroma = chroma[i];
            dominantNote = i;
          }
        }
        
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const detectedKey = `${noteNames[dominantNote]} Major`;
        
        console.log('Fast key detection result:', detectedKey);
        resolve(detectedKey);
      } catch (error) {
        console.error('Fast key detection error:', error);
        resolve('C Major');
      }
    }, 10); // Small delay to prevent blocking
  });
}

// Simplified FFT for basic frequency analysis
function simpleFFT(data: Float32Array): Float32Array {
  const N = data.length;
  const spectrum = new Float32Array(N / 2);
  
  // Very basic frequency analysis - not a real FFT but fast
  for (let k = 0; k < N / 2; k++) {
    let real = 0;
    let imag = 0;
    
    // Sample fewer points for speed
    for (let n = 0; n < N; n += 4) {
      const angle = -2 * Math.PI * k * n / N;
      real += data[n] * Math.cos(angle);
      imag += data[n] * Math.sin(angle);
    }
    
    spectrum[k] = Math.sqrt(real * real + imag * imag);
  }
  
  return spectrum;
}
